import { Link, useLocation } from 'react-router';
import clsx from 'clsx';
import { FOOTER_NAV_ITEMS, FOOTER_RESOURCE_LINKS } from '~/constants/site-shell';
import { isPathActive, normalizePathname } from '~/utils/normalize-pathname';

interface FooterProps {
  standalone?: boolean;
  showSocialLinks?: boolean;
  compactNav?: boolean;
}

const SOCIAL_LINKS = [
  {
    href: '/joinslack',
    icon: '/assets/webflow/misc/6908d21b2270590dedae7f30_Frame48095725.svg',
    label: 'Join Slack',
  },
  {
    href: 'https://x.com/OpenHandsDev',
    icon: '/assets/webflow/misc/6908d21bd2a1305f4f77161b_Frame48095723.svg',
    label: 'X',
    external: true,
  },
  {
    href: 'https://github.com/OpenHands/OpenHands',
    icon: '/assets/webflow/misc/6908d21a36dee3e7147b3d21_Frame48095724.svg',
    label: 'GitHub',
    external: true,
  },
] as const;

const FooterContent = ({
  showSocialLinks = false,
  compactNav = false,
}: Pick<FooterProps, 'showSocialLinks' | 'compactNav'>) => {
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);

  return (
    <div className='text-center text-brand-fg'>
      {showSocialLinks ? (
        <div className='mb-12 flex justify-center'>
          <div className='flex flex-wrap items-center justify-center gap-4'>
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className='flex h-10 w-10 items-center justify-center'
                data-testid='footer-social-link'
              >
                <img src={item.icon} alt='' className='h-10 w-10 object-contain' />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className='mb-8 flex justify-center'>
        {compactNav ? (
          <div className='flex w-full max-w-[825px] flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-[#b3a88c] pb-4 text-left'>
            {FOOTER_NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className={clsx(
                  'inline-flex whitespace-nowrap px-[5px] py-[14.4px] text-base font-medium leading-[22.4px] transition-colors hover:text-[#8a5f45]',
                  isPathActive(pathname, item.to) && 'text-[#8a5f45]'
                )}
              >
                {item.name}
              </Link>
            ))}

            <div id='footer-resources' className='flex flex-col items-start'>
              <a
                href='#footer-resources'
                className='inline-flex whitespace-nowrap px-[5px] py-[14.4px] text-base font-medium leading-[22.4px] transition-colors hover:text-[#8a5f45]'
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
                    className='px-[5px] text-[14px] font-normal leading-[19.6px] transition-colors hover:text-[#8a5f45]'
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.to}
                    className='px-[5px] text-[14px] font-normal leading-[19.6px] transition-colors hover:text-[#8a5f45]'
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </div>

            <Link
              to='/contact'
              className={clsx(
                'inline-flex whitespace-nowrap px-[5px] py-[14.4px] text-base font-medium leading-[22.4px] transition-colors hover:text-[#8a5f45]',
                isPathActive(pathname, '/contact') && 'text-[#8a5f45]'
              )}
            >
              Contact
            </Link>
          </div>
        ) : (
          <div className='flex max-w-[825px] flex-wrap items-start justify-center gap-x-8 gap-y-3 text-sm leading-[20.8px]'>
            {FOOTER_NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                to={item.to}
                className={clsx(
                  'text-base font-medium leading-[22.4px] transition-colors hover:text-[#8a5f45]',
                  isPathActive(pathname, item.to) && 'text-[#8a5f45]'
                )}
              >
                {item.name}
              </Link>
            ))}

            <div id='footer-resources' className='flex max-w-[220px] flex-wrap items-start gap-x-5 gap-y-2 text-left'>
              <a href='#footer-resources' className='text-base font-medium leading-[22.4px] transition-colors hover:text-[#8a5f45]'>
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
                ),
              )}
            </div>

            <Link
              to='/contact'
              className={clsx(
                'text-base font-medium leading-[22.4px] transition-colors hover:text-[#8a5f45]',
                isPathActive(pathname, '/contact') && 'text-[#8a5f45]'
              )}
            >
              Contact
            </Link>
          </div>
        )}
      </div>

      <div className='mb-2 text-[14px] font-normal leading-[16.9px]'>© {new Date().getFullYear()} OpenHands - All rights reserved</div>
      <Link to='/privacy' className='text-[14px] font-normal leading-[16.9px] transition-colors hover:text-[#8a5f45]'>
        Privacy Policy
      </Link>

      <div className='mt-8 flex justify-center'>
        <img src='/assets/webflow/backgrounds/openhands_logo_black.svg' alt='' className='h-16 w-auto lg:h-20' />
      </div>
    </div>
  );
};

export const Footer = ({
  standalone = false,
  showSocialLinks = standalone,
  compactNav = false,
}: FooterProps) => {
  if (!standalone) {
    return <FooterContent showSocialLinks={showSocialLinks} compactNav={compactNav} />;
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
        <FooterContent showSocialLinks={showSocialLinks} compactNav={compactNav} />
      </div>
    </footer>
  );
};
