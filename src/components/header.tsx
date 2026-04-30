import React from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import MenuIcon from '~/svgs/menu.svg?react';
import { Link, useLocation } from 'react-router';
import { AnimatedHeaderLogo } from './animated-header-logo';
import clsx from 'clsx';
import GitHubLogoBlack from '~/svgs/github-logo-black.svg?react';
import statistics from '~/data/statistics.json';
import { DESKTOP_NAV_ITEMS, RESOURCE_LINK_GROUPS } from '~/constants/site-shell';
import { formatThousands } from '~/utils/format-thousands';
import { isPathActive, normalizePathname } from '~/utils/normalize-pathname';

interface HeaderProps {
  onClickMenuButton: () => void;
  showMenuIcon?: boolean;
  width?: number;
  onClickGitHubButton?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showMenuIcon,
  onClickMenuButton,
}) => {
  const { scrollY } = useScroll();
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);
  const [textIsVisible, setTextIsVisible] = React.useState(true);
  const [resourcesOpen, setResourcesOpen] = React.useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > 0) {
      setTextIsVisible(false);
    } else {
      setTextIsVisible(true);
    }
  });

  return (
    // Match openhands.dev nav_wrap: height 100px, padding 24px 0px
    <header className='h-[100px] flex items-center sticky top-0 left-0 right-0 z-50 w-full bg-brand-bg/95 backdrop-blur-md py-6'>
      {/* Inner container: 1368px (1440 - 72px padding on sides = 36px each) */}
      <div className='w-full max-w-[1368px] mx-auto flex items-center px-9'>
        <div className='flex items-center justify-between w-full lg:w-auto'>
          <div className='lg:hidden w-[38px]'>
            {showMenuIcon && (
              <button aria-label='Open Menu' onClick={onClickMenuButton}>
                <MenuIcon width={38} height={38} />
              </button>
            )}
          </div>
          <div className='flex-1 flex justify-center lg:justify-start lg:flex-none'>
            <Link to='/' aria-label='Go to Home'>
              <AnimatedHeaderLogo renderText={textIsVisible} />
            </Link>
          </div>
          <div className='lg:hidden w-[38px]'></div>
        </div>

        <div className='hidden lg:flex flex-1 justify-center'>
          <nav>
            <ul className='flex items-center space-x-8'>
              {DESKTOP_NAV_ITEMS.map((item) => (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.to}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-base font-normal leading-[22.4px] transition-colors hover:text-[#8a5f45]'
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      to={item.to}
                      className={clsx(
                        'text-base font-normal leading-[22.4px] transition-colors hover:text-[#8a5f45]',
                        isPathActive(pathname, item.to) && 'text-brand-fg'
                      )}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
              <li className='relative'>
                <button
                  className='flex items-center gap-1 text-base font-normal leading-[22.4px] transition-colors hover:text-[#8a5f45]'
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  onBlur={() => setTimeout(() => setResourcesOpen(false), 150)}
                  type='button'
                >
                  <span>Resources</span>
                  <svg className={clsx('h-3 w-3 transition-transform', resourcesOpen && 'rotate-180')} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </button>
                {resourcesOpen && (
                  <div className='absolute left-0 top-full z-50 mt-2 w-[280px] rounded-lg border border-brand-border bg-brand-bg p-4 shadow-lg'>
                    {RESOURCE_LINK_GROUPS.map((group) => (
                      <div key={group.title} className='mb-4 last:mb-0'>
                        <div className='mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted'>
                          {group.title}
                        </div>
                        <ul className='flex flex-col gap-1'>
                          {group.links.map((item) => (
                            <li key={item.name}>
                              {item.external ? (
                                <a
                                  href={item.to}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-brand-fg/5'
                                >
                                  {item.name}
                                </a>
                              ) : (
                                <Link
                                  to={item.to}
                                  className='block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-brand-fg/5 hover:text-[#8a5f45]'
                                >
                                  {item.name}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>

        <div className='hidden flex-shrink-0 items-center gap-3 lg:flex'>
          <a
            href='https://github.com/OpenHands/OpenHands'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-1.5 whitespace-nowrap text-sm transition-colors hover:opacity-80'
          >
            <GitHubLogoBlack className='h-4 w-4 flex-shrink-0' style={{ width: '16px', height: '16px' }} />
            <span style={{ fontWeight: 400 }}>{formatThousands(statistics.stargazers)}</span>
          </a>
          <div className='btn btn-outline relative whitespace-nowrap' style={{ padding: '0.9em 1.9em', margin: 0 }}>
            <div aria-hidden='true'>Build with SDK</div>
            <a
              href='https://docs.openhands.dev/sdk'
              target='_blank'
              rel='noopener noreferrer'
              className='absolute inset-0'
            >
              <span className='sr-only'>Build with SDK</span>
            </a>
          </div>
          <div className='btn btn-primary relative whitespace-nowrap' style={{ padding: '0.9em 1.9em', margin: 0 }}>
            <div aria-hidden='true'>Try it live</div>
            <a
              href='https://app.all-hands.dev/'
              target='_blank'
              rel='noopener noreferrer'
              className='absolute inset-0'
            >
              <span className='sr-only'>Try it live</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
