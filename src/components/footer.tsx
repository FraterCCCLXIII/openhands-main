import { Link, NavLink } from 'react-router';
import clsx from 'clsx';
import { FOOTER_NAV_ITEMS, FOOTER_RESOURCE_LINKS } from '~/constants/site-shell';

interface FooterProps {
  standalone?: boolean;
}

const FooterContent = () => {
  return (
    <div className='text-center text-brand-fg'>
      <div className='mb-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm leading-[20.8px]'>
        {FOOTER_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              clsx('transition-colors hover:text-[#8a5f45]', isActive && 'text-[#8a5f45]')
            }
          >
            {item.name}
          </NavLink>
        ))}
      </div>

      <div id='footer-resources' className='mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2'>
        <a
          href='#footer-resources'
          className='text-base font-medium leading-[22.4px] transition-colors hover:text-[#8a5f45]'
        >
          Resources
        </a>
        {FOOTER_RESOURCE_LINKS.map((item) =>
          item.external ? (
            <a
              key={item.name}
              href={item.to}
              target='_blank'
              rel='noopener noreferrer'
              className='text-[14px] font-normal leading-[19.6px] transition-colors hover:text-[#8a5f45]'
            >
              {item.name}
            </a>
          ) : (
            <Link
              key={item.name}
              to={item.to}
              className='text-[14px] font-normal leading-[19.6px] transition-colors hover:text-[#8a5f45]'
            >
              {item.name}
            </Link>
          )
        )}
      </div>

      <div className='my-6 w-full max-w-3xl mx-auto border-t border-brand-fg/20' />

      <div className='mb-2 text-[14px] font-normal leading-[16.9px]'>
        © {new Date().getFullYear()} OpenHands - All rights reserved
      </div>
      <Link to='/privacy' className='text-[14px] font-normal leading-[16.9px] transition-colors hover:text-[#8a5f45]'>
        Privacy Policy
      </Link>

      <div className='mt-8 flex justify-center'>
        <img
          src='/assets/webflow/brand/openhands-logo-full.svg'
          alt='OpenHands'
          className='h-16 w-auto lg:h-20'
        />
      </div>
    </div>
  );
};

export const Footer = ({ standalone = false }: FooterProps) => {
  if (!standalone) {
    return <FooterContent />;
  }

  return (
    <footer className='relative overflow-hidden bg-brand-accent px-6 py-16 text-brand-fg'>
      <div className='absolute inset-0 pointer-events-none opacity-20'>
        <img
          src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
          alt=''
          className='h-full w-full object-cover'
        />
      </div>
      <div className='relative z-10 mx-auto max-w-[1238px]'>
        <FooterContent />
      </div>
    </footer>
  );
};
