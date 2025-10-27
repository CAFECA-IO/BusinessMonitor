import React from 'react';
import { FaRegClock, FaRegUser } from 'react-icons/fa6';
import { FiMapPin } from 'react-icons/fi';
import { VscCircleLargeFilled } from 'react-icons/vsc';
import { timestampToString } from '@/lib/common';
import { ILoginDevice } from '@/interfaces/device';
import Button from '@/components/common/button';

const DeviceCard: React.FC<{
  device: ILoginDevice;
  clickLogout: () => void;
  clickRemove: () => void;
}> = ({ device, clickLogout, clickRemove }) => {
  const { deviceName, position, lastActiveTime, status } = device;

  const timeStr = timestampToString(lastActiveTime);
  const lastActiveTimeStr = `${timeStr.formattedDate} ${timeStr.time}`;

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

  return (
    <div className="flex flex-col gap-24px rounded-radius-m border border-border-secondary bg-surface-primary px-16px py-12px">
      <p className="text-lg font-bold text-black">{deviceName}</p>
      <div className="flex flex-col gap-12px">
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
      <div className="grid grid-cols-2 gap-12px">
        <Button type="button" variant="danger" onClick={clickRemove}>
          Remove
        </Button>
        <Button type="button" variant="secondary" onClick={clickLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
};

export default DeviceCard;
