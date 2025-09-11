import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { PrismaClient, User, Credential, WebAuthnAlgo } from '@prisma/client';
import { buildChallenge } from '@/lib/challenge';
import { env } from '@/lib/env';
import crypto from 'node:crypto';
import type { AuthenticationResponseJSON } from '@passwordless-id/webauthn/dist/esm/types';

const agent = getAgent();
const prisma = new PrismaClient();

function createMockAssertion(
  privateKey: crypto.KeyObject,
  challenge: string,
  origin: string,
  counter: number,
  credId: string,
  userId: string
): AuthenticationResponseJSON {
  const clientData = {
    type: 'webauthn.get',
    challenge, // 瀏覽器會自動做 base64url 編碼
    origin,
    crossOrigin: false,
  };
  const clientDataJSON = Buffer.from(JSON.stringify(clientData)).toString('base64url');

  const authenticatorData = Buffer.alloc(37);
  const rpIdHash = crypto.createHash('sha256').update(env.RPID).digest();
  rpIdHash.copy(authenticatorData, 0); // 32 bytes
  authenticatorData.writeUInt8(0x01, 32); // Flags (User Present)
  authenticatorData.writeUInt32BE(counter, 33); // Sign Count (32-bit big-endian)

  const signatureBase = Buffer.concat([
    authenticatorData,
    crypto.createHash('sha256').update(clientDataJSON).digest(),
  ]);
  const signature = crypto.sign('sha256', signatureBase, {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  });

  return {
    id: credId,
    rawId: credId,
    type: 'public-key',
    response: {
      clientDataJSON,
      authenticatorData: authenticatorData.toString('base64url'),
      signature: signature.toString('base64url'),
      userHandle: userId,
    },
    clientExtensionResults: {},
  };
}

describe.skip('POST /api/v1/secure/login (integration, black-box)', () => {
  let testUser: User;
  let testCred: Credential;
  let keyPair: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject };

  // Info: (20250911 - Tzuhan) login 測試需要在執行前動態建立使用者和憑證，
  beforeAll(async () => {
    keyPair = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const publicKeyJwk = keyPair.publicKey.export({ format: 'jwk' });

    testUser = await prisma.user.create({
      data: { email: `fido-test-${Date.now()}@example.com` },
    });

    testCred = await prisma.credential.create({
      data: {
        userId: testUser.id,
        credentialId: crypto.randomBytes(16).toString('base64url'),
        publicKey: JSON.stringify(publicKeyJwk),
        counter: 10, // Info: (20250911 - Tzuhan) 從一個非零的 counter 開始
        algorithmNamed: WebAuthnAlgo.ES256,
      },
    });
  });

  afterAll(async () => {
    await prisma.credential.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  it('400: 請求 body 為空或格式錯誤', async () => {
    const url = Routes.auth.login();
    const res = await agent.post(url).send({}).expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Missing credential id');
  });

  it('404: 使用不存在的 credentialId 應回報找不到憑證', async () => {
    const url = Routes.auth.login();
    const challenge = buildChallenge({ rpId: env.RPID, origin: env.ORIGIN });

    // Info: (20250911 - Tzuhan) 產生一個有效的簽章，但 credentialId 是虛構的
    const assertion = createMockAssertion(
      keyPair.privateKey,
      challenge,
      env.ORIGIN,
      testCred.counter,
      'non-existent-credential-id',
      testUser.id
    );

    const res = await agent.post(url).send(assertion).expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Credential not found');
  });

  it('401: 使用錯誤的 challenge 應登入失敗', async () => {
    const url = Routes.auth.login();
    const wrongChallenge = `wrong_${Date.now()}`;
    const assertion = createMockAssertion(
      keyPair.privateKey,
      wrongChallenge,
      env.ORIGIN,
      testCred.counter,
      testCred.credentialId,
      testUser.id
    );

    const res = await agent.post(url).send(assertion).expect(401);
    expect(res.body.success).toBe(false);
  });

  it('401: 使用無效的簽章 (錯誤的私鑰) 應登入失敗', async () => {
    const url = Routes.auth.login();
    const wrongKeyPair = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const challenge = buildChallenge({ rpId: env.RPID, origin: env.ORIGIN });
    const assertion = createMockAssertion(
      wrongKeyPair.privateKey, // Info: (20250911 - Tzuhan) 使用錯誤的私鑰
      challenge,
      env.ORIGIN,
      testCred.counter,
      testCred.credentialId,
      testUser.id
    );

    const res = await agent.post(url).send(assertion).expect(401);
    expect(res.body.success).toBe(false);
  });

  it('409: 使用已用過的 counter 應回報衝突 (Replay Attack)', async () => {
    const url = Routes.auth.login();
    // Info: (20250911 - Tzuhan) 步驟 1: 先成功登入一次，讓 DB counter 增加
    const firstChallenge = buildChallenge({ rpId: env.RPID, origin: env.ORIGIN });
    const firstAssertion = createMockAssertion(
      keyPair.privateKey,
      firstChallenge,
      env.ORIGIN,
      testCred.counter, // Info: (20250911 - Tzuhan) 當前 DB counter 是 10
      testCred.credentialId,
      testUser.id
    );
    await agent.post(url).send(firstAssertion).expect(200);

    // Info: (20250911 - Tzuhan) DB counter 現在應該 > 10

    // Info: (20250911 - Tzuhan) 步驟 2: 再次使用相同的舊 assertion (或一個 counter 值更低的 assertion)
    const secondChallenge = buildChallenge({ rpId: env.RPID, origin: env.ORIGIN });
    const replayAssertion = createMockAssertion(
      keyPair.privateKey,
      secondChallenge,
      env.ORIGIN,
      testCred.counter, // Info: (20250911 - Tzuhan) 再次使用舊的 counter 10
      testCred.credentialId,
      testUser.id
    );

    const res = await agent.post(url).send(replayAssertion).expect(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Replay detected');
  });

  it('200: 使用有效的 FIDO2 憑證應成功登入', async () => {
    const url = Routes.auth.login();
    // Info: (20250911 - Tzuhan) 重設 counter 以便測試成功情境
    await prisma.credential.update({ where: { id: testCred.id }, data: { counter: 50 } });

    const challenge = buildChallenge({ rpId: env.RPID, origin: env.ORIGIN });
    const assertion = createMockAssertion(
      keyPair.privateKey,
      challenge,
      env.ORIGIN,
      50, // Info: (20250911 - Tzuhan) 使用最新的 counter
      testCred.credentialId,
      testUser.id
    );

    const res = await agent.post(url).send(assertion).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('OK');
    expect(res.body.payload).toHaveProperty('dewt');
    expect(res.body.payload.user.id).toBe(testUser.id);

    // Info: (20250911 - Tzuhan) 驗證資料庫 counter 已被更新
    const updatedCred = await prisma.credential.findUnique({ where: { id: testCred.id } });
    expect(updatedCred?.counter).toBeGreaterThan(50);
  });
});
