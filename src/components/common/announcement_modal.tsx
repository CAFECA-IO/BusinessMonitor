import React from 'react';
import Image from 'next/image';
import { FiShare2 } from 'react-icons/fi';
import { LuTrash2 } from 'react-icons/lu';
import { RxCross1 } from 'react-icons/rx';
import { TbEdit } from 'react-icons/tb';
import Button from '@/components/common/button';

const AnnouncementModal: React.FC = () => {
  const modalType = 'Announcement';

  return (
    <div className="fixed left-0 top-0 z-50 flex size-full flex-col items-center justify-center bg-black/50">
      <div className="relative flex w-900px flex-col gap-24px rounded-radius-l bg-surface-primary px-40px py-24px">
        {/* Info: (20251001 - Julian) Modal Type */}
        <div className="flex items-center">
          <p className="flex-1 text-center text-lg font-bold text-text-primary">{modalType}</p>
          <button type="button" className="p-10px text-text-primary">
            <RxCross1 size={24} />
          </button>
        </div>

        <hr className="border-border-secondary" />

        <div className="flex h-500px flex-col gap-24px overflow-y-auto">
          {/* Info: (20251001 - Julian) Main Title */}
          <div className="relative flex flex-col items-center justify-center gap-24px">
            <h4 className="text-h4 font-bold">Exciting News Ahead!</h4>
            <p className="text-sm font-bold text-button-secondary">2025-06-13 14:06</p>

            <div className="absolute right-0 flex items-center gap-12px">
              <Button
                type="button"
                variant="secondaryBorderless"
                size="small"
                className="gap-spacing-3xs"
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

          <div className="flex flex-col items-center gap-12px">
            <div className="relative h-300px w-800px">
              <Image src="/elements/kv_mask.png" alt="announcement sample" objectFit="cover" fill />
            </div>

            <p className="font-normal text-text-primary">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
              laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
              architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas
              sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
              voluptatem sequi nesciunt. Sed ut perspiciatis unde omnis iste natus error sit
              voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab
              illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo
              enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
              consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro
              quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed
              quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat
              voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis
              suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum
              iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur,
              vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? Neque porro quisquam
              est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non
              numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat
              voluptatem. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
              doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis
              et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia
              voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos
              qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum
              quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi
              tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad
              minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
              aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea
              voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum
              fugiat quo voluptas nulla pariatur? Ut enim ad minima veniam, quis nostrum
              exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi
              consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam
              nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla
              pariatur?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button type="button" variant="secondaryBorderless" size="small">
            <FiShare2 size={20} />
            <p>Share</p>
          </Button>
          <Button type="button" variant="secondary" size="small">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
