import React from 'react';
import Image from 'next/image';

interface IAuthorizeViaExistingDeviceProps {
  isLoading: boolean;
  error: string | null;
  qrCodeDataUrl: string;
}

const AuthorizeViaExistingDevice: React.FC<IAuthorizeViaExistingDeviceProps> = ({
  isLoading,
  error,
  qrCodeDataUrl,
}) => {
  return (
    <div className="mt-40px flex w-full flex-col gap-24px rounded-radius-s bg-surface-secondary px-24px py-16px">
      <div className="flex flex-col gap-8px">
        <p className="text-base font-bold text-text-brand">Authorize via Existing Device</p>
        <p className="text-sm font-normal text-text-secondary">
          Use a device you&apos;ve already registered to scan the QR code.
        </p>
      </div>
      <div className="flex w-full flex-col items-center justify-center">
        {isLoading && <div className="animate-pulse">Loading...</div>}
        {error && <div className="break-all text-xs text-red-500">{error}</div>}
        {qrCodeDataUrl && (
          <div className="flex size-72 items-center justify-center">
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
  );
};

export default AuthorizeViaExistingDevice;
