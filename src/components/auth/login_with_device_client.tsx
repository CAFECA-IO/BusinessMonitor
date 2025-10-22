'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import QRCode from 'qrcode';
import Pusher from 'pusher-js';
import { routes } from '@/config/api-routes';
import { getPusherInstance } from '@/lib/pusher_client';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import Button from '@/components/common/button';
import MessageModal from '@/components/auth/message_modal';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export default function LoginWithDeviceClient() {
  const [backupKeyInput, setBackupKeyInput] = useState<string>('');
  const [hideBackupKey, setHideBackupKey] = useState<boolean>(true);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState<boolean>(false);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('正在產生 QR Code...');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, isLoading: isAuthLoading, login } = useAuth();

  const toggleHideBackupKey = () => setHideBackupKey((prev) => !prev);
  const toggleMessageModal = () => setIsMessageModalVisible((prev) => !prev);

  const changeBackupKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupKeyInput(e.target.value);
  };

  const verifyBackupKey = async () => {
    // ToDo: (20251021 - Julian) Implement actual backup key verification logic
    const mockBackupKey = 'ABC1234';

    if (backupKeyInput === mockBackupKey) {
       
      console.log('Backup key verified successfully.');
    } else {
      setStatusMessage('You have 4 attempts left before your account is locked for 1 hour.');
      setIsMessageModalVisible(true);
    }
  };

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (user) {
      router.push(BM_URL.PROFILE);
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (isAuthLoading || user) {
      return;
    }
    let pusherClient: Pusher | null = null;
    const initializeQrSession = async () => {
      try {
        const res = await fetch(`${origin}${routes.pairing.initiate()}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        const { sessionId, challenge } = data.payload;
        const scanUrl = new URL(`${origin}${BM_URL.APPROVE_DEVICE}`);
        scanUrl.searchParams.set('sessionId', sessionId);
        scanUrl.searchParams.set('challenge', challenge);

        const dataUrl = await QRCode.toDataURL(scanUrl.toString(), { width: 256, margin: 2 });
        setQrCodeDataUrl(dataUrl);
        setStatusMessage('請使用您已登入的手機掃描 QR Code 以登入此裝置。');

        pusherClient = getPusherInstance();
        const channel = pusherClient.subscribe(`private-login-session-${sessionId}`);

        channel.bind('login-success', async (eventData: { dewt: string }) => {
          setStatusMessage('✅ 授權成功！正在為您登入...');
          // localStorage.setItem('dewt', eventData.dewt);
          await login(eventData.dewt);
          setTimeout(() => router.push('/profile'), 1500);
        });

        channel.bind('login-error', (eventData: { message: string }) => {
          setError(eventData.message || '手機端授權失敗。');
          setStatusMessage('授權失敗，請重試或返回。');
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化 QR Code 失敗。');
      } finally {
        setIsLoading(false);
      }
    };

    initializeQrSession();

    return () => pusherClient?.disconnect();
  }, [isAuthLoading, login, router, user]);

  if (isAuthLoading || user) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <p>正在驗證您的身份...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-surface-background p-4 px-24px py-32px">
      <h1 className="text-h5 font-bold text-text-secondary">Add New Device</h1>

      <div className="mt-64px flex flex-col items-center gap-24px">
        {/* Info: (20251021 - Julian) Backup Key part */}
        <div className="flex flex-col items-start gap-8px">
          <p className="text-base font-bold text-text-brand">Enter Backup Key</p>
          <p className="text-sm font-normal text-text-secondary">
            If you&apos;ve backed up your identity key, you can enter it to restore your identity.
          </p>
          <div className="flex w-full items-center overflow-hidden rounded-radius-s border border-border-secondary bg-surface-primary">
            <div className="flex flex-1 items-center gap-8px p-spacing-2xs">
              <input
                id="backed_key_input"
                type={hideBackupKey ? 'password' : 'text'}
                value={backupKeyInput}
                onChange={changeBackupKeyInput}
                className="flex-1 bg-transparent"
              />
              <button type="button" className="text-text-secondary" onClick={toggleHideBackupKey}>
                {hideBackupKey ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
            <button
              type="button"
              onClick={verifyBackupKey}
              className="h-full bg-button-secondary px-24px py-8px text-sm font-bold text-text-invert hover:bg-button-secondary-hover"
            >
              Verify
            </button>
          </div>
        </div>
        {/* Info: (20251021 - Julian) ========== OR ========== */}
        <div className="text-lg font-bold uppercase text-text-secondary">or</div>
        {/* Info: (20251021 - Julian) QR code part */}
        <div className="flex w-full flex-col gap-24px rounded-radius-s bg-surface-secondary px-24px py-16px">
          <div className="flex flex-col gap-8px">
            <p className="text-base font-bold text-text-brand">Authorize via Existing Device</p>
            <p className="text-sm font-normal text-text-secondary">
              Use a device you&apos;ve already registered to scan the QR code.
            </p>
          </div>
          <div className="flex w-full items-center justify-center">
            {isLoading && <div className="animate-pulse">Loading...</div>}
            {error && <div className="break-all text-xs text-red-500">{error}</div>}
            {qrCodeDataUrl && (
              <div className="size-72">
                <Image
                  src={qrCodeDataUrl}
                  alt="Login QR Code"
                  width={256}
                  height={256}
                  style={{ objectFit: 'contain' }}
                  unoptimized
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Link href="/auth/login">
        <Button type="button" size="extraLarge" className="mt-40px w-full">
          Go Back
        </Button>
      </Link>

      {isMessageModalVisible && (
        <MessageModal
          title="Incorrect Backup Key"
          cancelString="Back"
          content={statusMessage ?? '--'}
          visibleHandler={toggleMessageModal}
        />
      )}
    </div>
  );
}
