'use client';

import React from 'react';
import { useLottie } from 'lottie-react';
import { FaRegCircleCheck } from 'react-icons/fa6';
import errorAnimation from '@/lottie/error.json';
import successAnimation from '@/lottie/check.json';
import loadingAnimation from '@/lottie/loading.json';

export enum AnimationType {
  ERROR = 'error',
  SUCCESS = 'success',
  STATIC_SUCCESS = 'static_success',
  LOADING = 'loading',
}

interface IAnimationModalProps {
  anim: AnimationType;
  text?: string;
  loop?: boolean;
}

const AnimationModal: React.FC<IAnimationModalProps> = ({ anim, text, loop }) => {
  const animMap = {
    [AnimationType.ERROR]: errorAnimation,
    [AnimationType.SUCCESS]: successAnimation,
    [AnimationType.STATIC_SUCCESS]: null,
    [AnimationType.LOADING]: loadingAnimation,
  };

  const options = {
    animationData: animMap[anim],
    loop: loop ?? false,
  };

  const { View } = useLottie(options);

  const staticSuccessView = <FaRegCircleCheck size={90} className="text-text-primary" />;

  const ViewToRender =
    anim === AnimationType.STATIC_SUCCESS ? (
      staticSuccessView
    ) : (
      <div className="relative size-100px p-10px">{View}</div>
    );

  return (
    <div className="fixed left-0 top-0 z-50 flex size-full items-center justify-center bg-black/50 p-20px">
      <div className="flex min-h-150px min-w-150px flex-col items-center gap-8px rounded-radius-l bg-white p-16px">
        {ViewToRender}
        {text && <p className="text-sm font-medium text-text-primary">{text}</p>}
      </div>
    </div>
  );
};

export default AnimationModal;
