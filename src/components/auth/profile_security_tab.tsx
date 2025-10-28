'use client";';

import React, { useState, useEffect } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { RxCopy } from 'react-icons/rx';
import Button from '@/components/common/button';
import AnimationModal, { AnimationType } from '@/components/common/animation_modal';

const SecurityTab: React.FC = () => {
  const [isRecoveryKeyVisible, setIsRecoveryKeyVisible] = useState<boolean>(false);
  const [isShowCopySuccess, setIsShowCopySuccess] = useState<boolean>(false);

  // ToDo: (20251028 - Julian) Replace with real recovery key from API
  const recoveryKeyValue = '12345678901112131415';

  // Info: (20251028 - Julian) 根據 key 長度產生隱藏表示
  const representation = recoveryKeyValue.length > 0 ? '*'.repeat(recoveryKeyValue.length) : '';

  useEffect(() => {
    if (isShowCopySuccess) {
      const timer = setTimeout(() => {
        setIsShowCopySuccess(false);
      }, 1000); // Info: (20251028 - Julian) 1 秒後關閉

      return () => clearTimeout(timer); // Info: (20251028 - Julian) 清除計時器
    }
  }, [isShowCopySuccess]);

  const toggleRecoveryKeyVisibility = () => setIsRecoveryKeyVisible((prev) => !prev);

  const copyKey = () => {
    navigator.clipboard.writeText(recoveryKeyValue);
    setIsShowCopySuccess(true);
  };

  const displayedKey = isRecoveryKeyVisible ? recoveryKeyValue : representation;

  const hiddenBtn = isRecoveryKeyVisible ? (
    <button type="button" className="p-10px" onClick={toggleRecoveryKeyVisibility}>
      <FiEyeOff size={20} />
    </button>
  ) : (
    <button type="button" className="p-10px" onClick={toggleRecoveryKeyVisibility}>
      <FiEye size={20} />
    </button>
  );

  return (
    <>
      <div className="flex max-h-500px flex-col gap-40px overflow-y-auto px-16px py-24px">
        <div className="flex flex-col gap-24px">
          <p className="text-lg font-bold text-text-brand">Recovery Key</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8px font-normal text-text-primary">
              <p>{displayedKey}</p>
              {hiddenBtn}
            </div>
            <Button type="button" className="gap-8px" onClick={copyKey}>
              <RxCopy size={20} />
              <p>Copy</p>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-16px rounded-radius-s bg-surface-secondary px-16px py-12px">
          <p className="text-base font-bold text-text-primary">Back Up Your Recovery Key</p>
          <p className="text-sm font-medium text-text-secondary">
            This recovery key is the way to restore your Digital Identity if you lose or change your
            device.Please store it safely and privately. If you lose this key.
          </p>
          <div className="flex flex-col text-sm font-medium">
            <p>We recommend the following:</p>
            <ul className="ml-20px list-outside list-disc text-text-secondary">
              <li>Write it down and keep it in a secure place (e.g., a locked drawer or safe).</li>
              <li>Do not store it online or in cloud storage.</li>
              <li>Do not share it with anyone.</li>
              <li>Consider printing a copy and storing it offline.</li>
            </ul>
            <p></p>
          </div>
          <p className="text-sm font-medium text-text-error">
            You may permanently lose access to your identity and any connected services.
          </p>
        </div>
      </div>

      {/* Info: (20251028 - Julian) Copy Success Modal */}
      {isShowCopySuccess && <AnimationModal anim={AnimationType.STATIC_SUCCESS} text="Copied!" />}
    </>
  );
};

export default SecurityTab;
