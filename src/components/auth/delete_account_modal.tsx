'use client';

import React, { useState } from 'react';
import { IoWarningOutline } from 'react-icons/io5';
import Button from '@/components/common/button';

const DELETE_CONFIRMATION_TEXT = 'DELETE';

interface IDeleteAccountModalProps {
  onClose: () => void;
}

const DeleteAccountModal: React.FC<IDeleteAccountModalProps> = ({ onClose }) => {
  const [confirmValue, setConfirmValue] = useState<string>('');

  const deleteDisabled = confirmValue !== DELETE_CONFIRMATION_TEXT;

  const changeConfirmValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmValue(e.target.value);
  };

  const deleteAccount = () => {
    // Info: (20251029 - Julian) Implement account deletion logic here
     
    console.log('Account deleted');
    onClose();
  };

  return (
    <div className="fixed left-0 top-0 z-10 flex size-full items-center justify-center bg-black/50 p-20px">
      <div className="flex flex-col items-center gap-24px rounded-radius-m bg-white px-24px pb-24px pt-40px">
        <IoWarningOutline size={100} className="text-text-error" />
        <p className="text-lg font-bold text-text-primary">Permanently Delete Your Account</p>
        <p className="text-base font-medium text-text-secondary">
          You will no longer be able to recover your account, access any linked services, or restore
          your identity—even with your recovery key.
          <br /> This action is irreversible. Please proceed with caution.
        </p>
        <input
          type="text"
          value={confirmValue}
          onChange={changeConfirmValue}
          className="w-full rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs text-base text-text-primary outline-none placeholder:text-text-note"
          placeholder="Enter “DELETE” to delete this account"
        />
        <div className="grid w-full grid-cols-2 gap-8px">
          <Button type="button" variant="primary" onClick={deleteAccount} disabled={deleteDisabled}>
            Delete Account
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
