import React from 'react';
import Link from 'next/link';
import { BiLogoFacebook } from 'react-icons/bi';
import { FaLocationDot, FaPhone, FaTwitter, FaLinkedinIn, FaGithub } from 'react-icons/fa6';
import {
  CAFECA_COPYRIGHT,
  CAFECA_PHONE,
  CAFECA_LOCATION_EN,
  CAFECA_LOCATION_MAP,
  CAFECA_FACEBOOK_LINK,
  CAFECA_TWITTER_LINK,
  CAFECA_LINKEDIN_LINK,
  CAFECA_GITHUB_LINK,
} from '@/constants/config';

const Footer: React.FC = () => {
  return (
    <footer className="flex w-full flex-col items-center justify-between gap-24px bg-surface-invert px-20px py-24px text-xs font-normal text-white desktop:flex-row desktop:px-80px desktop:text-sm">
      {/* Info: (20250804 - Julian) Contact Information */}
      <div className="flex flex-1 flex-col items-center gap-24px desktop:flex-row">
        <Link href={CAFECA_LOCATION_MAP} target="_blank" className="flex items-center gap-8px">
          <FaLocationDot size={24} />
          <p>{CAFECA_LOCATION_EN}</p>
        </Link>
        <Link href={`tel:${CAFECA_PHONE}`} className="flex items-center gap-8px">
          <FaPhone size={16} />
          <p>{CAFECA_PHONE}</p>
        </Link>
        {/* Info: (20250804 - Julian) Social Media Links */}
        <div className="flex items-center gap-16px">
          <Link href={CAFECA_FACEBOOK_LINK} target="_blank">
            <BiLogoFacebook size={24} />
          </Link>
          <Link href={CAFECA_TWITTER_LINK} target="_blank">
            <FaTwitter size={24} />
          </Link>
          <Link href={CAFECA_LINKEDIN_LINK} target="_blank">
            <FaLinkedinIn size={24} />
          </Link>
          <Link href={CAFECA_GITHUB_LINK} target="_blank">
            <FaGithub size={24} />
          </Link>
        </div>
      </div>

      {/* Info: (20250804 - Julian) Copyright */}
      <p>{CAFECA_COPYRIGHT}</p>
    </footer>
  );
};

export default Footer;
