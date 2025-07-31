// ToDo: (20250731 - Julian) 這個檔案中的設定都還無法使用
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'text-text-primary': 'var(--color-grey-grey-900)',
        'text-text-secondary': 'var(--color-grey-grey-500)',
        'text-text-note': 'var(--color-grey-grey-300)',
        'text-text-brand': 'var(--color-brand-brand-purple-500)',
        'text-text-invert': 'var(--color-grey-grey-50)',
        'surface-surface-background': 'var(--color-grey-grey-50)',
        'text-text-success': 'var(--color-state-safe)',
        'surface-surface-primary': 'var(--color-grey-grey-000)',
        'surface-surface-secondary': 'var(--color-grey-grey-100)',
        'text-text-warning': 'var(--color-state-warn)',
        'surface-surface-invert': 'var(--color-grey-grey-900)',
        'text-text-error': 'var(--color-state-danger)',
        'surface-surface-brand': 'var(--color-brand-brand-purple-500)',
        'button-button-primary': 'var(--color-brand-brand-purple-500)',
        'button-button-secondary': 'var(--color-grey-grey-600)',
        'button-button-accent': 'var(--color-brand-brand-blud-500)',
        'button-button-disable': 'var(--color-grey-grey-300)',
        'button-button-primary-hover': 'var(--color-brand-brand-purple-300)',
        'button-button-secondary-hover': 'var(--color-grey-grey-500)',
        'button-button-accent-hover': 'var(--color-brand-brand-blud-300)',
        'button-link': 'var(--color-state-link)',
        'button-link-hover': 'var(--color-state-link-hover)',
        'border-border-primary': 'var(--color-grey-grey-900)',
        'border-border-secondary': 'var(--color-grey-grey-300)',
        'border-border-brand': 'var(--color-brand-brand-purple-500)',
      },
    },
  },
  plugins: [],
};
