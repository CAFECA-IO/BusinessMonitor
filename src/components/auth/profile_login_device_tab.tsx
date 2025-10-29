'use client';

import React, { useState /* useEffect */ } from 'react';
import { FaChevronLeft, FaPlus } from 'react-icons/fa6';
// import { useRouter } from 'next/navigation';
// import QRCode from 'qrcode';
// import Pusher from 'pusher-js';
// import { routes } from '@/config/api-routes';
// import { getPusherInstance } from '@/lib/pusher_client';
import useOuterClick from '@/lib/hooks/use_outer_click';
// import { BM_URL } from '@/constants/url';
// import { useAuth } from '@/contexts/auth_context';
import Button from '@/components/common/button';
import DeviceCard from '@/components/auth/device_card';
import AuthorizeViaExistingDevice from '@/components/auth/authorize_via_existing_device';
import LogoutOrRemoveModal, { ModalType } from '@/components/auth/logout_or_remove_modal';
import { ILoginDevice } from '@/interfaces/device';

interface ILoginDeviceTabProps {
  devices: ILoginDevice[];
}

const LoginDeviceTab: React.FC<ILoginDeviceTabProps> = ({ devices }) => {
  // ToDo: (20251029 - Julian) QR Code and authorization state
  // const [isLoading, setIsLoading] = useState<boolean>(true);
  // const [error, setError] = useState<string | null>(null);
  // const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);
  const [qrCodeDataUrl] = useState<string>('');

  // Info: (20251027 - Julian) Device logout modal state
  const [modalType, setModalType] = useState<ModalType>(ModalType.LOGOUT);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<ILoginDevice | null>(null);

  // const router = useRouter();
  // const { user, isLoading: isAuthLoading, login } = useAuth();

  const {
    targetRef: tabRef,
    componentVisible: isTabOpen,
    setComponentVisible: setIsTabOpen,
  } = useOuterClick<HTMLDivElement>(false);

  const openTab = () => setIsTabOpen(true);
  const closeTab = () => setIsTabOpen(false);

  // ToDo: (20251029 - Julian) 調整邏輯：在登入情況下授權新裝置
  // useEffect(() => {
  //   if (isAuthLoading || user) {
  //     return;
  //   }
  //   let pusherClient: Pusher | null = null;
  //   const initializeQrSession = async () => {
  //     try {
  //       const res = await fetch(`${origin}${routes.pairing.initiate()}`, { method: 'POST' });

  //       const data = await res.json();
  //       if (!res.ok || !data.success) throw new Error(data.message);

  //       const { sessionId, challenge } = data.payload;
  //       const scanUrl = new URL(`${origin}${BM_URL.APPROVE_DEVICE}`);
  //       scanUrl.searchParams.set('sessionId', sessionId);
  //       scanUrl.searchParams.set('challenge', challenge);

  //       const dataUrl = await QRCode.toDataURL(scanUrl.toString(), { width: 256, margin: 2 });
  //       setQrCodeDataUrl(dataUrl);

  //       pusherClient = getPusherInstance();
  //       const channel = pusherClient.subscribe(`private-login-session-${sessionId}`);

  //       channel.bind('login-success', async (eventData: { dewt: string }) => {
  //         // localStorage.setItem('dewt', eventData.dewt);
  //         await login(eventData.dewt);
  //         setTimeout(() => router.push('/profile'), 1500);
  //       });

  //       channel.bind('login-error', (eventData: { message: string }) => {
  //         setError(eventData.message || '手機端授權失敗。');
  //       });
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : '初始化 QR Code 失敗。');
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   initializeQrSession();

  //   return () => pusherClient?.disconnect();
  // }, [isAuthLoading, login, router, user]);

  const deviceList =
    devices.length > 0 ? (
      devices.map((device) => {
        const clickRemove = () => {
          setModalType(ModalType.REMOVE);
          setSelectedDevice(device);
          setIsLogoutModalOpen(true);
        };

        const clickLogout = () => {
          setModalType(ModalType.LOGOUT);
          setSelectedDevice(device);
          setIsLogoutModalOpen(true);
        };

        return (
          <DeviceCard
            key={device.deviceName}
            device={device}
            clickRemove={clickRemove}
            clickLogout={clickLogout}
          />
        );
      })
    ) : (
      // ToDo: (20251027 - Julian) Design empty state
      <div className="p-10px text-center text-text-secondary">No devices found.</div>
    );

  return (
    <>
      {/* Info: (20251027 - Julian) Main Content */}
      <div className="flex flex-col gap-24px px-16px py-24px">
        <Button type="button" className="w-full gap-8px" onClick={openTab}>
          <FaPlus size={16} />
          <p>Add New Device</p>
        </Button>
        <div className="flex h-420px flex-col gap-12px overflow-x-auto">{deviceList}</div>
      </div>

      {/* Info: (20251027 - Julian) Add New Device Content */}
      <div
        ref={tabRef}
        className={`${isTabOpen ? 'translate-x-0' : 'translate-x-full'} absolute left-0 top-0 flex size-full flex-col bg-surface-background pt-16px transition-all duration-300 ease-in-out`}
      >
        {/* Info: (20251027 - Julian) Tab Title */}
        <div className="flex h-56px items-center gap-8px px-16px">
          <button type="button" className="p-10px" onClick={closeTab}>
            <FaChevronLeft size={24} />
          </button>
          <p className="font-bold text-text-primary">Add New Device</p>
        </div>
        {/* Info: (20251027 - Julian) QR Code part */}
        <div className="px-20px">
          <AuthorizeViaExistingDevice
            error={error}
            isLoading={isLoading}
            qrCodeDataUrl={qrCodeDataUrl}
          />
        </div>
      </div>

      {isLogoutModalOpen && (
        <LogoutOrRemoveModal
          modalType={modalType}
          selectedDevice={selectedDevice}
          toggleModal={() => setIsLogoutModalOpen((prev) => !prev)}
        />
      )}
    </>
  );
};

export default LoginDeviceTab;
