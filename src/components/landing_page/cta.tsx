import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/common/button';

const MessageBubble: React.FC<{ avatarScr: string; text: string; isLeft?: boolean }> = ({
  avatarScr,
  text,
  isLeft = false,
}) => {
  const bubbleOnLeft = isLeft ? (
    <div className="rounded-radius-s bg-surface-brand p-12px text-lg font-medium text-text-invert">
      {text}
    </div>
  ) : null;

  const bubbleOnRight = isLeft ? null : (
    <div className="rounded-radius-s bg-surface-primary p-12px text-lg font-medium text-text-primary">
      {text}
    </div>
  );

  return (
    <div className="flex items-center gap-8px">
      {bubbleOnLeft}
      <Image src={avatarScr} width={100} height={100} alt="fake_avatar" />
      {bubbleOnRight}
    </div>
  );
};

const Cta: React.FC = () => {
  return (
    <div className="relative h-1200px w-full bg-cta bg-cover bg-top bg-no-repeat">
      {/* Info: (20250730 - Julian) Main Title */}
      <div className="mx-auto mt-54px flex w-2/3 flex-col text-9xl font-bold">
        <h2 className="text-left text-grey-600">Redefine</h2>
        <h2 className="text-center text-brand-blud-500">your</h2>
        <h2 className="text-right text-grey-600">identity</h2>
      </div>

      {/* Info: (20250730 - Julian) Subtitle */}
      <div className="absolute bottom-20 right-40 flex w-500px flex-col items-start gap-40px">
        <p className="text-lg font-bold text-text-secondary">
          CAFECA is a decentralized identity platform using blockchain and zero-knowledge proofs to
          enable secure, private, and portable self-sovereign identity (SSI).
        </p>
        {/* ToDo: (20250731 - Julian) Style */}
        <Link href="/">
          <Button type="button" variant="primary">
            Go to CAFECA
          </Button>
        </Link>
      </div>

      {/* Info: (20250730 - Julian) Holding a phone Image */}
      <div className="absolute left-1/5 top-1/3">
        <Image
          src="/elements/hand_holding_phone.png"
          width={500}
          height={700}
          alt="hand_holding_phone"
        />
      </div>

      {/* Info: (20250801 - Julian) Message Bubbles */}
      <div className="absolute right-64px top-64px">
        <MessageBubble
          avatarScr="/fake_avatar/avatar_1.png"
          text="Wait... I didn’t even need a password!"
          isLeft
        />
      </div>
      <div className="absolute left-64px top-1/2">
        <MessageBubble
          avatarScr="/fake_avatar/avatar_2.png"
          text="Feels way safer than usual logins"
        />
      </div>
    </div>
  );
};

export default Cta;
