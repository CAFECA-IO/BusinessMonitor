import React from 'react';
import { FaChevronLeft, FaPlus } from 'react-icons/fa6';
import useOuterClick from '@/lib/hooks/use_outer_click';
import Button from '@/components/common/button';
import DeviceCard from '@/components/auth/device_card';
import { ILoginDevice } from '@/interfaces/device';

interface ILoginDeviceTabProps {
  devices: ILoginDevice[];
}

const LoginDeviceTab: React.FC<ILoginDeviceTabProps> = ({ devices }) => {
  const {
    targetRef: tabRef,
    componentVisible: isTabOpen,
    setComponentVisible: setIsTabOpen,
  } = useOuterClick<HTMLDivElement>(false);

  const openTab = () => setIsTabOpen(true);
  const closeTab = () => setIsTabOpen(false);

  const deviceList = devices.map((device) => (
    <DeviceCard key={device.deviceName} device={device} />
  ));

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
        {/* Info: (20251027 - Julian) Tab Content */}
        <div className="flex flex-col py-40px"></div>
      </div>
    </>
  );
};

export default LoginDeviceTab;
