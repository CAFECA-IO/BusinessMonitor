'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaRegClock, FaRegUser } from 'react-icons/fa6';
import { FiMapPin } from 'react-icons/fi';
import { VscCircleLargeFilled } from 'react-icons/vsc';
import Button from '@/components/common/button';
import AnimationModal, { AnimationType } from '@/components/common/animation_modal';
import { timestampToString } from '@/lib/common';
import { ILoginDevice } from '@/interfaces/device';

export enum ModalType {
  LOGOUT = 'logout',
  REMOVE = 'remove',
}

export enum RemoveStatus {
  GENERAL = 'general',
  VERIFICATION_CODE = 'verification_code',
  ENTER_CODE = 'enter_code',
}

interface ILogoutOrRemoveModalProps {
  modalType: ModalType;
  selectedDevice: ILoginDevice | null;
  toggleModal: () => void;
}

// ToDo: (20251029 - Julian) Develop verification code input UI

const LogoutOrRemoveModal: React.FC<ILogoutOrRemoveModalProps> = ({
  modalType,
  selectedDevice,
  toggleModal,
}) => {
  const [isShowAnimModal, setIsShowAnimModal] = useState<boolean>(false);
  const [removeStatus, setRemoveStatus] = useState<RemoveStatus>(RemoveStatus.ENTER_CODE);
  // const [verificationCodeValue, setVerificationCodeValue] = useState<string>('');

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (value.length === 1 && index < inputsRef.current.length - 1) {
      // Info: (20251029 - Julian) 自動跳到下一格
      inputsRef.current[index + 1]?.focus();
    }
  };

  // ToDo: (20251029 - Julian) Replace with real countdown logic
  const codeValidCountdown = '00:59';
  // ToDo: (20251029 - Julian) Replace with real validation code from API
  const validationCode = ['1', '2', '3', '4'];

  useEffect(() => {
    if (isShowAnimModal) {
      const timer = setTimeout(() => {
        setIsShowAnimModal(false);
        toggleModal();
      }, 2000); // Info: (20251027 - Julian) 2 秒後關閉

      return () => clearTimeout(timer); // Info: (20251027 - Julian) 清除計時器
    }
  }, [isShowAnimModal, toggleModal]);

  if (!selectedDevice) {
    return null;
  }

  const validationCodeInputs = Array.from({ length: 4 }, (_, index) => {
    const ref = (el: HTMLInputElement | null) => {
      if (inputsRef) inputsRef.current[index] = el;
    };
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e, index);
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    };

    return (
      <input
        key={index}
        type="text"
        maxLength={1}
        ref={ref}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className="rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs text-center text-2xl text-text-primary outline-none"
      />
    );
  });

  const removeDescription =
    removeStatus === RemoveStatus.GENERAL
      ? 'Are you sure you want to remove this device?'
      : removeStatus === RemoveStatus.VERIFICATION_CODE
        ? 'Please open another registered device and enter the number below to remove the device'
        : 'Someone is trying to remove this device.\nPlease enter your 4-digit passcode to confirm. ';

  const modalTitle = modalType === ModalType.LOGOUT ? 'Log out of Device' : 'Remove Device?';
  const modalDescription =
    modalType === ModalType.LOGOUT
      ? 'Are you sure you want to log out of this device?'
      : removeDescription;
  const animationText = modalType === ModalType.LOGOUT ? 'Logged out' : 'Device removed';

  const { deviceName, position, lastActiveTime, status } = selectedDevice;

  const timeStr = timestampToString(lastActiveTime);
  const lastActiveTimeStr = `${timeStr.formattedDate} ${timeStr.time}`;

  const removeDevice = () => {
    // ToDo: (20251027 - Julian) Implement remove device functionality
    setIsShowAnimModal(true);
  };

  const logoutDevice = () => {
    // ToDo: (20251027 - Julian) Implement logout device functionality
    setIsShowAnimModal(true);
  };

  const toVerificationCode = () => {
    setRemoveStatus(RemoveStatus.VERIFICATION_CODE);
  };
  const backToGeneral = () => {
    setRemoveStatus(RemoveStatus.GENERAL);
  };

  const loginStatus =
    status === 'Online' ? (
      <div className="flex items-center justify-between text-xs font-medium text-text-primary">
        <div className="flex items-center gap-4px">
          <FaRegUser size={16} />
          <p>Status:</p>
        </div>
        <div className="flex items-baseline gap-4px">
          <VscCircleLargeFilled size={9} className="text-text-success" />
          <p className="text-xs font-medium text-text-primary">Online</p>
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-between text-xs font-medium text-text-primary">
        <div className="flex items-center gap-4px">
          <FaRegUser size={16} />
          <p>Status:</p>
        </div>
        <div className="flex items-baseline gap-4px">
          <VscCircleLargeFilled size={9} className="text-text-note" />
          <p className="text-xs font-medium text-text-primary">Offline</p>
        </div>
      </div>
    );

  const buttons =
    modalType === ModalType.LOGOUT ? (
      <div className="grid grid-cols-2 gap-8px">
        <Button type="button" variant="secondary" className="w-full" onClick={toggleModal}>
          Cancel
        </Button>
        <Button type="button" variant="primary" className="w-full" onClick={logoutDevice}>
          Log out
        </Button>
      </div>
    ) : removeStatus === RemoveStatus.GENERAL ? (
      <div className="grid grid-cols-2 gap-8px">
        <Button type="button" variant="danger" className="w-full" onClick={toVerificationCode}>
          Remove
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={toggleModal}>
          Cancel
        </Button>
      </div>
    ) : removeStatus === RemoveStatus.VERIFICATION_CODE ? (
      <Button type="button" variant="secondary" className="w-full" onClick={backToGeneral}>
        Cancel
      </Button>
    ) : (
      <div className="grid grid-cols-2 gap-8px">
        <Button
          type="button"
          variant="danger"
          disabled={!!validationCode}
          className="w-full"
          onClick={removeDevice}
        >
          Remove
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={toggleModal}>
          Cancel
        </Button>
      </div>
    );

  const modalContent =
    removeStatus === RemoveStatus.VERIFICATION_CODE ? (
      <>
        {/* Info: (20251029 - Julian) 驗證碼有效期限 */}
        <p className="text-center text-sm font-medium">{codeValidCountdown}</p>
        {/* Info: (20251029 - Julian) 驗證碼 */}
        <div className="mx-auto grid grid-cols-4 gap-12px">
          {validationCode.map((code) => (
            <p key={code} className="text-h1 font-bold text-black">
              {code}
            </p>
          ))}
        </div>
      </>
    ) : (
      <div className="flex flex-col gap-12px">
        <p className="text-lg font-bold text-black">{deviceName}</p>
        <div className="flex items-center justify-between text-xs font-medium text-text-primary">
          <div className="flex items-center gap-4px">
            <FiMapPin size={16} />
            <p>Location:</p>
          </div>
          <p>{position}</p>
        </div>
        <div className="flex items-center justify-between text-xs font-medium text-text-primary">
          <div className="flex items-center gap-4px">
            <FaRegClock size={16} />
            <p>Last active time:</p>
          </div>
          <p>{lastActiveTimeStr}</p>
        </div>
        {loginStatus}
      </div>
    );

  // ToDo: (20251029 - Julian) Report Link
  const reportHint = modalType === ModalType.REMOVE && removeStatus === RemoveStatus.ENTER_CODE && (
    <div className="text-base font-medium text-text-secondary">
      If this wasn’t you, please <span className="text-button-link underline">Report</span> it
      immediately.
    </div>
  );

  return (
    <div className="fixed left-0 top-0 flex size-full items-center justify-center bg-black/50 p-20px">
      <div className="flex flex-col gap-24px rounded-radius-m bg-white px-24px pb-24px pt-40px">
        <p className="text-center text-lg font-bold text-text-primary">{modalTitle}</p>
        <p className="text-base font-medium text-text-secondary">{modalDescription}</p>
        {modalContent}
        <div className="mx-auto grid grid-cols-4 gap-12px">{validationCodeInputs}</div>
        {buttons}
        {reportHint}
      </div>

      {isShowAnimModal && <AnimationModal anim={AnimationType.SUCCESS} text={animationText} />}
    </div>
  );
};

export default LogoutOrRemoveModal;
