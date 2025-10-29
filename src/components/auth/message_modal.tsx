import React from 'react';
import { TbFaceIdError } from 'react-icons/tb';
import Button from '@/components/common/button';

interface IMessageModalProps {
  title?: string;
  content: string | React.ReactNode;
  cancelString?: string;
  submitString?: string;
  submitHandler?: () => void;
  visibleHandler: () => void;
}

const MessageModal: React.FC<IMessageModalProps> = ({
  title,
  content,
  cancelString,
  submitString,
  submitHandler,
  visibleHandler,
}) => {
  const isShowSubmit = submitString && submitHandler;

  const displayedTitle = title ? (
    <h2 className="text-center text-lg font-bold text-text-primary">{title}</h2>
  ) : (
    <div className="flex items-center justify-center text-text-brand">
      <TbFaceIdError size={100} />
    </div>
  );

  const cancelText = cancelString ?? 'Cancel';

  const displayedSubmit = isShowSubmit ? (
    <Button type="button" size="medium" onClick={submitHandler} className="whitespace-nowrap">
      {submitString}
    </Button>
  ) : null;

  return (
    <div className="fixed left-0 top-0 z-50 flex size-full flex-col items-center justify-center bg-black/50">
      <div className="relative flex w-350px flex-col gap-24px rounded-radius-m bg-surface-primary px-24px pb-24px pt-40px">
        {/* Info: (20251017 - Julian) Title */}
        {displayedTitle}
        {/* Info: (20251017 - Julian) Content */}
        <p className="text-base font-medium text-text-secondary">{content}</p>
        {/* Info: (20251017 - Julian) Buttons */}
        <div className={`${isShowSubmit ? 'grid-cols-2' : 'grid-cols-1'} grid gap-8px`}>
          <Button
            type="button"
            onClick={visibleHandler}
            variant="secondary"
            size="medium"
            className="whitespace-nowrap"
          >
            {cancelText}
          </Button>
          {displayedSubmit}
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
