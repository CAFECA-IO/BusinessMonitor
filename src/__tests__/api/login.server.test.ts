import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { getChallenge } from '@/lib/cafeca';
import { PrismaClient } from '@prisma/client';
import { createHash, generateKeyPairSync, randomBytes } from 'crypto';
import cbor from 'cbor';

const agent = getAgent();
const prisma = new PrismaClient();

// Info: (20250912 - Tzuhan) FIDO2/WebAuthn 需要一個複雜的加密物件，這個輔助函式用來模擬瀏覽器產生它。
// Info: (20250912 - Tzuhan) 它會產生一個新的金鑰對，並圍繞它建立一個可用於 API 請求的 payload。
async function createMockFidoPayload(loginData: Record<string, unknown>) {
  // Info: (20250912 - Tzuhan) 1. 產生一對新的 ECDSA P-256 金鑰
  const keyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const publicKeyJwk = keyPair.publicKey.export({ format: 'jwk' });

  // Info: (20250912 - Tzuhan) 2. 模擬 clientDataJSON 的產生
  const challenge = await getChallenge(JSON.stringify(loginData));
  const clientData = {
    type: 'webauthn.create',
    challenge,
    origin: process.env.ORIGIN || 'http://localhost:3000',
  };
  const clientDataJSON = Buffer.from(JSON.stringify(clientData)).toString('base64url');

  // Info: (20250912 - Tzuhan) 3. 建立 FIDO2 Authenticator Data
  const rpIdHash = createHash('sha256')
    .update(process.env.RPID || 'localhost')
    .digest();
  const flags = Buffer.from([0x41]); // Info: (20250912 - Tzuhan) Flag: User Present, Attested Credential Data Included
  const signCount = Buffer.from([0, 0, 0, 0]);
  const aaguid = Buffer.alloc(16); // Info: (20250912 - Tzuhan) AAGUID (zeros for none attestation)
  const credentialId = randomBytes(16);
  const credentialIdLength = Buffer.alloc(2);
  credentialIdLength.writeUInt16BE(credentialId.length, 0);

  // Info: (20250912 - Tzuhan) 建立 COSE 格式的公鑰
  const cosePublicKey = cbor.encode(
    new Map<number, number | string | undefined>([
      [1, 2], // Info: (20250912 - Tzuhan) kty: EC2
      [3, -7], // Info: (20250912 - Tzuhan) alg: ES256
      [-1, 1], // Info: (20250912 - Tzuhan) crv: P-256
      [-2, publicKeyJwk.x], // Info: (20250912 - Tzuhan) x
      [-3, publicKeyJwk.y], // Info: (20250912 - Tzuhan) y
    ])
  );

  const authData = Buffer.concat([
    rpIdHash,
    flags,
    signCount,
    aaguid,
    credentialIdLength,
    credentialId,
    cosePublicKey,
  ]);

  // Info: (20250912 - Tzuhan) 4. 建立 Attestation Object (使用 'none' 格式以簡化測試)
  const attestationObject = cbor.encode({
    fmt: 'none',
    attStmt: {},
    authData,
  });

  // Info: (20250912 - Tzuhan) 5. 組裝最終的 registrationData payload
  const registrationData = {
    id: credentialId.toString('base64url'),
    rawId: credentialId.toString('base64url'),
    type: 'public-key',
    response: {
      clientDataJSON,
      attestationObject: attestationObject.toString('base64url'),
      transports: ['internal'],
      // Info: (20250912 - Tzuhan) 【核心修正點】新增 Zod schema 期望的額外欄位
      authenticatorData: authData.toString('base64url'),
      publicKey: cosePublicKey.toString('base64url'),
      publicKeyAlgorithm: -7, // Info: (20250912 - Tzuhan) ES256
    },
    clientExtensionResults: {},
    user: { id: `user-${Date.now()}`, name: 'Test User' },
  };

  return { loginData, registrationData };
}

// Info: (20250912 - Tzuhan) --- 測試主體 ---

describe('POST /api/v1/secure/login (integration, black-box)', () => {
  // Info: (20250912 - Tzuhan) 每次測試後都清理透過 FIDO2 建立的使用者，確保測試獨立性
  afterEach(async () => {
    const testUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@fido.user' } },
    });
    if (testUsers.length > 0) {
      await prisma.credential.deleteMany({
        where: { userId: { in: testUsers.map((u) => u.id) } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: testUsers.map((u) => u.id) } },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('400: 缺少 registrationData 應回報錯誤', async () => {
    const url = Routes.auth.login();
    const payload = { loginData: { email: 'test@example.com' } }; // Info: (20250912 - Tzuhan) 故意缺少 registrationData
    const res = await agent.post(url).send(payload).expect(400);

    expect(res.body.success).toBe(false);
  });

  it('401: Challenge 不匹配應認證失敗', async () => {
    const url = Routes.auth.login();
    const payload = await createMockFidoPayload({ email: 'test@example.com' });

    // Info: (20250912 - Tzuhan) 竄改 payload 中的 loginData，讓後端計算出不同的 challenge
    payload.loginData = { email: 'tampered@example.com' };

    const res = await agent.post(url).send(payload).expect(401);
    expect(res.body.success).toBe(false);
  });

  it('200: 首次請求 (新憑證) 應視為「註冊」，成功建立使用者並回傳 DeWT', async () => {
    const url = Routes.auth.login();
    const loginData = { email: `new-user-${Date.now()}@example.com` };
    const payload = await createMockFidoPayload(loginData);

    // Info: (20250912 - Tzuhan) 執行請求
    const res = await agent.post(url).send(payload).expect(200);

    // Info: (20250912 - Tzuhan) 驗證 API 回應
    expect(res.body.success).toBe(true);
    expect(res.body.payload).toHaveProperty('dewt');
    expect(res.body.payload.user).toHaveProperty('id');

    // Info: (20250912 - Tzuhan) 驗證資料庫狀態：確實有名為 fido-* 的使用者被建立
    const dbUser = await prisma.user.findUnique({ where: { id: res.body.payload.user.id } });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.email).toContain('@fido.user');

    const dbCred = await prisma.credential.findUnique({
      where: { credentialId: payload.registrationData.id },
    });
    expect(dbCred).not.toBeNull();
    expect(dbCred?.userId).toBe(dbUser?.id);
  });

  it('200: 重複請求 (已存在憑證) 應視為「登入」，成功找到使用者並回傳 DeWT', async () => {
    const url = Routes.auth.login();
    const loginData = { email: `existing-user-${Date.now()}@example.com` };
    const payload = await createMockFidoPayload(loginData);

    // Info: (20250912 - Tzuhan) 步驟 1: 第一次請求，註冊使用者
    const res1 = await agent.post(url).send(payload).expect(200);
    const userId = res1.body.payload.user.id;
    expect(userId).toBeDefined();

    // Info: (20250912 - Tzuhan) 步驟 2: 使用完全相同的 payload 進行第二次請求
    const res2 = await agent.post(url).send(payload).expect(200);

    // Info: (20250912 - Tzuhan) 驗證 API 回應
    expect(res2.body.success).toBe(true);
    expect(res2.body.payload.user.id).toBe(userId); // Info: (20250912 - Tzuhan) 使用者 ID 應該相同

    // Info: (20250912 - Tzuhan) 驗證資料庫狀態：使用者總數沒有增加
    const userCount = await prisma.user.count({ where: { id: userId } });
    expect(userCount).toBe(1);
  });
});
