import React from 'react';

const ToggleSwitch: React.FC<{
  isOn: boolean;
  handleToggle: () => void;
  label?: string;
  disabled?: boolean;
}> = ({ isOn, handleToggle, label, disabled }) => {
  const spotPosition = isOn && !disabled ? 'translate-x-20px' : 'translate-x-0';
  const spotColor = disabled ? 'bg-button-secondary-hover' : 'bg-surface-primary';

  return (
    <div className="flex items-center gap-16px">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`${isOn ? 'enabled:bg-surface-brand' : 'bg-button-disable'} flex h-28px w-48px items-center rounded-full p-2px disabled:bg-button-disable disabled:hover:cursor-not-allowed`}
      >
        <span
          className={`${spotPosition} ${spotColor} size-24px rounded-full transition-all duration-150 ease-in-out`}
        ></span>
      </button>
      {label && (
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className="text-sm font-normal text-text-primary disabled:hover:cursor-not-allowed"
        >
          {label}
        </button>
      )}
    </div>
  );
};

export default ToggleSwitch;
