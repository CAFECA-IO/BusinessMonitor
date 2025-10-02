'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FiShare2 } from 'react-icons/fi';
import { LuTrash2 } from 'react-icons/lu';
import { RxCross1 } from 'react-icons/rx';
import { TbEdit } from 'react-icons/tb';
import Button from '@/components/common/button';
import { IAnnouncementItem } from '@/interfaces/announcement';
import { timestampToString } from '@/lib/common';

interface IAnnouncementModalProps {
  announcement: IAnnouncementItem | null;
  visibleHandler: () => void;
}

interface IDeleteModalProps {
  modalType: 'Announcement' | 'Comment';
  visibleHandler: () => void;
  deleteHandler: () => void;
}

const DeleteModal: React.FC<IDeleteModalProps> = ({ visibleHandler, deleteHandler }) => {
  return (
    <div className="fixed left-0 top-0 z-50 flex size-full flex-col items-center justify-center bg-black/50">
      <div className="relative flex flex-col gap-24px rounded-radius-l bg-surface-primary p-24px">
        {/* Info: (20251001 - Julian) Modal Title */}
        <div className="flex items-center">
          <h6 className="flex-1 text-center text-h6 font-bold text-text-primary">
            ⚠️ Delete This Announcement
          </h6>
          <button type="button" onClick={visibleHandler} className="p-10px text-text-primary">
            <RxCross1 size={24} />
          </button>
        </div>

        <hr className="bg-border-secondary" />

        <div className="w-420px flex-1 text-sm font-medium">
          Are you sure you want to delete this Announcement? It will be removed from your discussion
          page for good. This action is irreversible. Please proceed with caution.
        </div>

        <div className="flex items-center gap-12px">
          <Button type="button" onClick={visibleHandler} variant="secondary">
            Cancel
          </Button>
          <Button type="button" onClick={deleteHandler} className="whitespace-nowrap">
            Delete Announcement
          </Button>
        </div>
      </div>
    </div>
  );
};

const AnnouncementModal: React.FC<IAnnouncementModalProps> = ({ announcement, visibleHandler }) => {
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState<boolean>(false);

  if (!announcement) return null;

  const { title, date, content, imageUrl } = announcement;

  const modalType = 'Announcement';

  const timestamp = new Date(date).getTime() / 1000;
  const formattedTime = timestampToString(timestamp);

  const deleteVisibleHandler = () => setIsDeleteModalVisible(true);
  const deleteHandler = () => {
    // ToDo: (20251001 - Julian) Delete Announcement API
    visibleHandler();
  };

  const isShowImage = imageUrl && (
    <div className="relative h-250px w-800px">
      <Image src={imageUrl} alt="announcement_image" objectFit="cover" fill />
    </div>
  );

  return (
    <>
      <div className="fixed left-0 top-0 z-50 flex size-full flex-col items-center justify-center bg-black/50">
        <div className="relative flex w-900px flex-col gap-24px rounded-radius-l bg-surface-primary px-40px py-24px">
          {/* Info: (20251001 - Julian) Modal Type */}
          <div className="flex items-center">
            <p className="flex-1 text-center text-lg font-bold text-text-primary">{modalType}</p>
            <button type="button" onClick={visibleHandler} className="p-10px text-text-primary">
              <RxCross1 size={24} />
            </button>
          </div>

          <hr className="bg-border-secondary" />

          <div className="flex max-h-500px flex-col gap-24px overflow-y-auto">
            {/* Info: (20251001 - Julian) Main Title */}
            <div className="relative flex flex-col items-center justify-end gap-24px">
              <h4 className="text-h4 font-bold">{title}</h4>
              <p className="text-sm font-bold text-button-secondary">
                {formattedTime.formattedDate} {formattedTime.time}
              </p>
              {/* Info: (20251001 - Julian) Edit & Delete Button */}
              <div className="absolute right-0 flex items-center">
                <Button
                  type="button"
                  variant="secondaryBorderless"
                  size="small"
                  className="gap-spacing-3xs"
                  onClick={deleteVisibleHandler}
                >
                  <LuTrash2 size={20} />
                  <p>Delete</p>
                </Button>
                <Button
                  type="button"
                  variant="secondaryBorderless"
                  size="small"
                  className="gap-spacing-3xs"
                >
                  <TbEdit size={20} />
                  <p>Edit</p>
                </Button>
              </div>
            </div>
            {/* Info: (20251001 - Julian) Image & Content */}
            <div className="flex flex-col items-center gap-12px">
              {isShowImage}
              <p className="text-base font-normal text-text-primary">{content}</p>
            </div>
          </div>
          {/* Info: (20251001 - Julian) Share & Close Button */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondaryBorderless"
              size="small"
              className="gap-spacing-3xs"
            >
              <FiShare2 size={20} />
              <p>Share</p>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={visibleHandler}
              className="px-24px py-8px"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {isDeleteModalVisible && (
        <DeleteModal
          modalType="Announcement"
          visibleHandler={() => setIsDeleteModalVisible(false)}
          deleteHandler={deleteHandler}
        />
      )}
    </>
  );
};

export default AnnouncementModal;
