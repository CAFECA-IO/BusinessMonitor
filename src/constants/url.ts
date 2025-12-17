export const BM_URL = {
  HOME: '/',
  BUSINESS_MONITOR: '/business_monitor',
  SEARCH: '/business_monitor/search',
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Info: (20251009 - Tzuhan) --- 身份驗證流程 (Auth Flow) ---
  LOGIN: '/auth/login', // Info: (20251009 - Tzuhan) 登入頁
  SIGN_UP: '/auth/signup', // Info: (20251009 - Tzuhan) 註冊頁 (從 login 中移出，成為獨立流程)
  LOGIN_WITH_EXISTING_DEVICE: '/auth/login_with_existing_device', // Info: (20251009 - Tzuhan) 未登入狀態下，用舊有裝置登入的入口
  ADD_DEVICE: '/auth/add_device', // Info: (20251009 - Tzuhan) 登入狀態下，新增裝置的入口
  APPROVE_DEVICE: '/auth/approve_device', // Info: (20251009 - Tzuhan) 已登入的「舊裝置」掃碼後，進行批准的頁面
  SETUP_NEW_DEVICE: '/auth/setup_new_device', // Info: (20251009 - Tzuhan) 新裝置掃碼後，進行 Passkey 註冊的頁面

  // Info: (20251009 - Tzuhan) --- 登入後的設定/個人資料區 (User Profile / Settings) ---
  PROFILE: '/profile', // Info: (20251009 - Tzuhan) (建議新增) 登入後的個人資料主頁
};

export const EXTERNAL_URL = {
  BAIFA_EXPLORER:
    `${process.env.NEXT_PUBLIC_BAIFA_EXPLORER}/en/app/chains/${process.env.NEXT_PUBLIC_ISUNCOIN_CHAIN_ID}/transaction/` ||
    'https://baifa.io/en/app/chains/8017/transaction/',
};
