import React from 'react';
import { FaRegClock, FaRegUser } from 'react-icons/fa6';
import { FiMapPin } from 'react-icons/fi';
import { VscCircleLargeFilled } from 'react-icons/vsc';
import Button from '@/components/common/button';
import { timestampToString } from '@/lib/common';
import { ILoginDevice } from '@/interfaces/device';

export enum ModalType {
  LOGOUT = 'logout',
  REMOVE = 'remove',
}

interface ILogoutOrRemoveModalProps {
  modalType: ModalType;
  selectedDevice: ILoginDevice | null;
  toggleModal: () => void;
}

const LogoutOrRemoveModal: React.FC<ILogoutOrRemoveModalProps> = ({
  modalType,
  selectedDevice,
  toggleModal,
}) => {
  if (!selectedDevice) {
    return null;
  }

  const modalTitle = modalType === ModalType.LOGOUT ? 'Log out of Device' : 'Remove Device?';
  const modalDescription =
    modalType === ModalType.LOGOUT
      ? 'Are you sure you want to log out of this device?'
      : 'Are you sure you want to remove this device?';

  const { deviceName, position, lastActiveTime, status } = selectedDevice;

  const timeStr = timestampToString(lastActiveTime);
  const lastActiveTimeStr = `${timeStr.formattedDate} ${timeStr.time}`;

  const removeDevice = () => {
    // ToDo: (20251027 - Julian) Implement remove device functionality
     
    console.log(`Removing device: ${deviceName}`);
  };

  const logoutDevice = () => {
    // ToDo: (20251027 - Julian) Implement logout device functionality
     
    console.log(`Logging out device: ${deviceName}`);
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
    ) : (
      <div className="grid grid-cols-2 gap-8px">
        <Button type="button" variant="danger" className="w-full" onClick={removeDevice}>
          Remove
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={toggleModal}>
          Cancel
        </Button>
      </div>
    );

  return (
    <div className="fixed left-0 top-0 flex size-full items-center justify-center bg-black/50 px-20px">
      <div className="flex flex-col gap-24px rounded-radius-m bg-white px-24px pb-24px pt-40px">
        <p className="text-center text-lg font-bold text-text-primary">{modalTitle}</p>
        <p className="text-base font-medium text-text-secondary">{modalDescription}</p>
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
        {buttons}
      </div>
    </div>
  );
};

export default LogoutOrRemoveModal;
