// Info: (20250925 - Tzuhan) 定義 CORS 標頭，這是 Next.js 的標準做法
const CORS_HEADERS = [
  { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_ORIGIN || '*' },
  { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
  { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
  { key: 'Access-Control-Expose-Headers', value: 'X-Request-Id' },
  { key: 'Vary', value: 'Origin' },
];

const nextConfig = {
  // Info: (20250925 - Tzuhan) 將 CORS 邏輯移到這裡
  // 這裡的設定會應用到所有匹配的路由
  async headers() {
    return [
      {
        // Info: (20250925 - Tzuhan) 應用到所有的 API 路由
        source: '/api/:path*',
        headers: CORS_HEADERS,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/member/:path*',
        destination: 'https://isunfa.com',
        permanent: true,
      },
    ];
  },
  images: {
    // Info: (20251021 - Julian) 允許來自 avatar.cafeca.io 的遠端圖片
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatar.cafeca.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
