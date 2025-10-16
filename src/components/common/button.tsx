/* eslint-disable tailwindcss/classnames-order */
import React from 'react';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('group rounded-full text-center justify-center flex items-center', {
  variants: {
    variant: {
      primary:
        'text-text-invert bg-button-primary enabled:hover:bg-button-primary-hover disabled:cursor-not-allowed disabled:bg-button-disable',
      primaryBorderless:
        'text-text-brand enabled:hover:text-button-primary-hover disabled:text-text-note',
      secondary:
        'text-text-invert bg-button-secondary enabled:hover:bg-button-secondary-hover disabled:bg-button-disable',
      secondaryBorderless:
        'text-text-primary enabled:hover:text-button-primary disabled:text-button-disable',
      accent:
        'text-text-invert bg-button-accent enabled:hover:bg-button-accent-hover disabled:bg-button-disable',
      accentBorderless:
        'text-button-accent enabled:hover:text-button-accent-hover disabled:text-button-disable',
    },
    size: {
      small: 'text-xs p-4px desktop:p-8px desktop:text-sm font-bold',
      medium: 'text-sm px-16px py-8px desktop:px-48px desktop:py-12px desktop:text-base font-bold',
      large: 'text-base px-20px py-10px desktop:px-54px desktop:py-18px desktop:text-lg font-bold',
      extraLarge: 'px-48px py-12px text-sm font-bold',
      extraSmall: 'text-sm px-16px py-8px font-normal',
      icon: 'p-10px desktop:p-18px',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
});

interface IButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// Info: (20250801 - Julian) 使用 forwardRef 將引用傳遞給 DOM 元素
const Button = forwardRef<HTMLButtonElement, IButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    const Comp = 'button';
    return <Comp className={buttonVariants({ variant, size, className })} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export default Button;
