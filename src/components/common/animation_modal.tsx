'use client';

import React from 'react';
import { useLottie } from 'lottie-react';
import errorAnimation from '@/lottie/error.json';

export enum AnimationType {
  ERROR = 'error',
  SUCCESS = 'success',
}

interface IAnimationModalProps {
  anim: AnimationType;
  text?: string;
}

const AnimationModal: React.FC<IAnimationModalProps> = ({ anim, text }) => {
  const animMap = {
    [AnimationType.ERROR]: errorAnimation,
    [AnimationType.SUCCESS]: errorAnimation, // ToDo: (20251027 - Julian) Replace with success animation
  };

  const options = {
    animationData: animMap[anim],
    loop: true,
  };

  const { View } = useLottie(options);

  return (
    <div className="fixed left-0 top-0 flex size-full items-center justify-center bg-black/50 p-20px">
      <div className="flex min-h-150px min-w-150px flex-col items-center gap-8px rounded-radius-l bg-white p-16px">
        <div className="relative size-100px p-10px">{View}</div>
        {text && <p className="text-sm font-medium text-text-primary">{text}</p>}
      </div>
    </div>
  );
};

export default AnimationModal;
