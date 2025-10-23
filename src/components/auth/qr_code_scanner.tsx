'use client';

import React, { useState } from 'react';
import { redirect, RedirectType } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RxCross2 } from 'react-icons/rx';
import { IDetectedBarcode } from '@yudiel/react-qr-scanner';

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner), {
  ssr: false,
});

interface IQRCodeScannerProps {
  onClose: () => void;
}

// ToDo: (20251023 - Julian) 調整 Scanner focus form 樣式
const QRCodeScanner: React.FC<IQRCodeScannerProps> = ({ onClose }) => {
  const [scanning, setScanning] = useState<boolean>(true);

  const handleScan = (res: IDetectedBarcode[] | null) => {
    if (res && scanning) {
      // Info: (20251023 - Julian) 取得掃描到的 QR Code 結果，並導向新地址
      const rawValue = res[0].rawValue;
      setScanning(false);
      redirect(rawValue, RedirectType.push);
    }
  };

  const handleError = (err: unknown) => {
    // ToDo: (20251023 - Julian) 掃描錯誤處理
    alert(`掃描錯誤：${(err as Error).message}`);
    onClose();
  };

  return (
    <div
      className={`${true ? 'translate-y-0' : 'translate-y-full'} fixed z-20 flex size-full flex-col bg-black/50 transition-all duration-150 ease-in-out`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute left-16px top-40px z-10 p-10px text-text-invert"
      >
        <RxCross2 size={24} />
      </button>
      <div className="max-h-400px">
        {scanning && (
          <Scanner
            onScan={handleScan}
            onError={handleError}
            constraints={{
              facingMode: 'environment', // Info: (20251023 - Julian) 使用後置鏡頭
            }}
            sound={false}
          />
        )}
      </div>
      <div className="flex flex-1 items-center justify-center bg-surface-invert text-base font-medium text-text-invert">
        Scan the QR code to log in with your Digital ID
      </div>
    </div>
  );
};

export default QRCodeScanner;
