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
    <header data-wf-el='nav_wrap' className='sticky top-0 left-0 right-0 z-50 w-full backdrop-blur-md' style={{ display: 'block', height: '84px', backgroundColor: 'rgb(249, 240, 217)', paddingTop: '16px', paddingBottom: '16px' }}>
      <div data-wf-el='nav_contain' style={{ display: 'block', maxWidth: '1440px', paddingLeft: '0px', paddingRight: '0px' }}>
        <div data-wf-el='nav_grid' className='hidden lg:grid mx-auto' style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'auto 1fr auto', maxWidth: '1368px', paddingLeft: '0px', paddingRight: '0px' }}>
          <div className='flex justify-start'>
            <Link data-wf-el='nav_logo_link' to='/' aria-label='Go to Home' style={{ lineHeight: '16px', textDecorationLine: 'underline', textDecorationThickness: '1.6px', color: 'rgb(255, 255, 139)' }}>
              <AnimatedHeaderLogo renderText={textIsVisible} />
            </Link>
          </div>

          <nav className='flex items-stretch justify-center'>
            <ul data-wf-el='nav_links_list' style={{ display: 'flex', justifyContent: 'center', gap: '21.6px', alignItems: 'stretch' }}>
              {DESKTOP_NAV_ITEMS.map((item) => (
                <li data-wf-el='nav_links_li' key={item.name} style={{ display: 'list-item' }}>
                  {item.external ? (
                    <a
                      href={item.to}
                      target='_blank'
                      rel='noopener noreferrer'
                      data-wf-el='nav_links_link'
                      className='text-base font-normal leading-[22.4px] transition-colors hover:text-[#8a5f45]'
                      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      to={item.to}
                      data-wf-el='nav_links_link'
                      className={clsx(
                        'text-base font-normal leading-[22.4px] transition-colors hover:text-[#8a5f45]',
                        isPathActive(pathname, item.to) && 'text-brand-fg'
                      )}
                      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
              <li data-wf-el='nav_links_li' className='relative' style={{ display: 'list-item' }}>
                <button
                  className='flex items-center gap-1 px-2 text-base font-normal leading-[22.4px] transition-colors hover:text-[#8a5f45]'
                  style={{ cursor: 'default' }}
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  onBlur={() => setTimeout(() => setResourcesOpen(false), 150)}
                  type='button'
                >
                  <span>Resources</span>
                  <div data-wf-el='nav_links_icon' className={clsx('transition-transform', resourcesOpen && 'rotate-180')} style={{ display: 'block', width: '19px', height: '19px', cursor: 'default', textAlign: 'center', textUnderlineOffset: 'auto' }}>
                    <svg style={{ width: '100%', height: '100%' }} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                    </svg>
                  </div>
                </button>
                {resourcesOpen && (
                  <div data-wf-el='nav_links_dropdown' className='absolute left-0 top-full z-50 mt-2 w-[280px] rounded-lg border border-brand-border bg-brand-bg p-4 shadow-lg'>
                    {RESOURCE_LINK_GROUPS.map((group) => (
                      <div key={group.title} data-wf-el='nav_links_dropdown_group' className='mb-4 last:mb-0'>
                        <div data-wf-el='dropdown-eyebrow' className='mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted'>
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

          <div data-wf-el='nav_right' className='flex-shrink-0 items-center gap-5' style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a
                data-wf-el='nav-menu_gh_count'
                href='https://github.com/OpenHands/OpenHands'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1.5 text-sm transition-colors hover:opacity-80'
                style={{ justifyContent: 'center' }}
              >
                <div data-wf-el='nav-menu_gh_icon'><GitHubLogoBlack className='h-4 w-4 flex-shrink-0' style={{ width: '16px', height: '16px' }} /></div>
                <div data-wf-el='nav-menu_gh_num'><span style={{ fontWeight: 400 }}>{formatThousands(statistics.stargazers)}</span></div>
              </a>
              <div className='btn btn-outline relative' style={{ padding: '0.9em 1.9em', margin: 0, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.34)', borderColor: 'transparent' }}>
                <div aria-hidden='true'>Build with SDK</div>
                <a href='https://docs.openhands.dev/sdk' target='_blank' rel='noopener noreferrer' className='absolute inset-0'>
                  <span className='sr-only'>Build with SDK</span>
                </a>
              </div>
              <div className='btn btn-primary relative' style={{ padding: '0.9em 1.9em', margin: 0, borderRadius: '8px' }}>
                <div aria-hidden='true'>Try it live</div>
                <a href='https://app.all-hands.dev/' target='_blank' rel='noopener noreferrer' className='absolute inset-0'>
                  <span className='sr-only'>Try it live</span>
                </a>
              </div>
            </div>
        </div>

        {/* Mobile nav */}
        <div className='flex items-center justify-between px-4 lg:hidden' style={{ height: '52px' }}>
          <div className='w-[38px]'>
            {showMenuIcon && (
              <button aria-label='Open Menu' onClick={onClickMenuButton}>
                <MenuIcon width={38} height={38} />
              </button>
            )}
          </div>
          <Link to='/' aria-label='Go to Home'>
            <AnimatedHeaderLogo renderText={textIsVisible} />
          </Link>
          <div className='w-[38px]' />
        </div>
      </div>
    </header>
  );
};
