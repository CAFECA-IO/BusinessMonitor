/**
 * Info: (20250918 - Luphia) eslint.config.mjs
 * - 這份設定檔是我們團隊的程式碼規範，目標是為了統一風格、預防錯誤、提升程式碼品質與可讀性
 * - 使用 Prettier 統一程式碼風格
 * - 使用 ESLint 專注於程式碼品質、最佳實踐與潛在錯誤
 */

import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import nextPlugin from '@next/eslint-plugin-next';
import tailwindcss from 'eslint-plugin-tailwindcss';
import prettierConfig from 'eslint-config-prettier';

const tslintConfigs = [
  // Info: (20250918 - Luphia) 全域忽略設定
  {
    ignores: ['coverage', 'node_modules', '.next', 'dist', 'build', 'eslint.config.mjs', 'tailwind.config.ts', 'postcss.config.mjs', 'jest.*.ts'],
  },

  // Info: (20250918 - Luphia) 基礎設定
  // 1. TypeScript 基礎規則
  ...tseslint.configs.recommended,
  // 2. Tailwind CSS 推薦規則
  ...tailwindcss.configs['flat/recommended'],

  /**
   * Info: (20250921 - Luphia)
   * 合併 TS/JS/React/Next.js 的主要設定檔
   * 將所有相關設定合併至單一物件，確保 plugins 能被所有 rules 正確識別
   */
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],

    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      '@next/next': nextPlugin,
      tailwindcss, // Info: (20250921 - Luphia) 將 tailwindcss 也加入，讓客製化規則能識別
    },

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: ['./tsconfig.json'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },

    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {},
      },
    },

    rules: {
      // Info: (20250921 - Luphia) 啟用各個外掛的推薦規則
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // Info: (20250918 - Luphia) 以下為團隊的主要客製化規則
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

      // Info: (20250918 - Luphia) React Hooks 規則 (此處的設定會覆蓋上面的推薦設定)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'import/prefer-default-export': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'react/react-in-jsx-scope': 'off',
      
      '@typescript-eslint/naming-convention': [
        'error',
        // Info: (20250918 - Luphia) 一般函式採用 camelCase，react 元件採用 PascalCase
        { selector: 'function', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },

        // Info: (20250918 - Luphia) 一般變數採用 camelCase，react 元件採用 PascalCase，常數採用 UPPER_CASE
        { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },

        // Info: (20250918 - Luphia) 類別、型別、介面採用 PascalCase
        { selector: 'typeLike', format: ['PascalCase'] },

        // Info: (20250918 - Luphia) 介面採用 IPascalCase，名稱強制以 I 開頭
        { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: true } },
      ],

      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['../*'], message: "請使用 '@/' 路徑別名取代相對路徑 '..'" }] },
      ],

      'no-nested-ternary': 'off',
      'no-param-reassign': ['error', { props: false }],

      // Info: (20250918 - Luphia) a11y 技術債
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/control-has-associated-label': 'warn',

      // Info: (20250918 - Luphia) Tailwind CSS 客製化規則
      'tailwindcss/no-custom-classname': 'warn',
      'tailwindcss/classnames-order': 'error',
    },
  },

  // Info: (20250918 - Luphia) 針對測試檔案的設定覆寫
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },

  // Info: (20250918 - Luphia) Prettier 必須放在最後
  prettierConfig,
];

export default tslintConfigs;
