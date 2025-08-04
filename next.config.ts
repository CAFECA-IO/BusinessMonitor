import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Info: (20250804 - Julian) config options here */
  env: {
    CAFECA_COPYRIGHT: process.env.CAFECA_COPYRIGHT,
    CAFECA_LOCATION_EN: process.env.CAFECA_LOCATION_EN,
    CAFECA_LOCATION_CH: process.env.CAFECA_LOCATION_CH,
    CAFECA_LOCATION_MAP: process.env.CAFECA_LOCATION_MAP,
    CAFECA_PHONE: process.env.CAFECA_PHONE,
    CAFECA_FACEBOOK_LINK: process.env.CAFECA_FACEBOOK_LINK,
    CAFECA_TWITTER_LINK: process.env.CAFECA_TWITTER_LINK,
    CAFECA_LINKEDIN_LINK: process.env.CAFECA_LINKEDIN_LINK,
    CAFECA_GITHUB_LINK: process.env.CAFECA_GITHUB_LINK,
  },
};

export default nextConfig;
