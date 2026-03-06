import React from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import MenuIcon from '~/svgs/menu.svg?react';
import { Link, NavLink } from 'react-router';
import { AnimatedHeaderLogo } from './animated-header-logo';
import clsx from 'clsx';
import GitHubLogoBlack from '~/svgs/github-logo-black.svg?react';
import statistics from '~/data/statistics.json';
import { formatThousands } from '~/utils/format-thousands';

// Navigation items matching Webflow design
const DESKTOP_NAV_ITEMS = [
  { name: 'Product', to: '/product' },
  { name: 'Enterprise', to: '/enterprise' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'Benchmarks', to: 'https://index.openhands.dev/home' },
  { name: 'Community', to: '/community' },
];

const RESOURCES_DROPDOWN = [
  { name: 'Docs', to: 'https://docs.openhands.dev/', description: 'Build, integrate, and scale with ease.' },
  { name: 'Manifesto', to: '/manifesto', description: 'Our vision of an open future.' },
  { name: 'Blog', to: '/blog', description: 'Ideas, updates, and insights that inspire.' },
  { name: 'Press', to: '/press', description: '' },
  { name: 'Careers', to: 'https://jobs.ashbyhq.com/OpenHands', description: '' },
  { name: 'About', to: '/about', description: '' },
  { name: 'Contact', to: '/contact', description: '' },
];

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
                  {item.to.startsWith('http') ? (
                    <a href={item.to} target='_blank' rel='noopener noreferrer' className='text-base font-medium hover:opacity-70 transition-opacity'>
                      {item.name}
                    </a>
                  ) : (
                    <NavLink to={item.to} className={({ isActive }) => clsx('text-base font-medium hover:opacity-70 transition-opacity', isActive && 'font-semibold')}>
                      {item.name}
                    </NavLink>
                  )}
                </li>
              ))}
              <li className='relative'>
                <button
                  className='text-base font-medium hover:opacity-70 transition-opacity flex items-center gap-1'
                  onClick={() => setResourcesOpen(!resourcesOpen)}
                  onBlur={() => setTimeout(() => setResourcesOpen(false), 150)}
                >
                  Resources
                  <svg className={clsx('w-3 h-3 transition-transform', resourcesOpen && 'rotate-180')} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                </button>
                {resourcesOpen && (
                  <div className='absolute top-full left-0 mt-2 w-72 bg-brand-bg border border-brand-border rounded-lg shadow-lg py-2 z-50'>
                    {RESOURCES_DROPDOWN.map((item) => (
                      item.to.startsWith('http') ? (
                        <a key={item.name} href={item.to} target='_blank' rel='noopener noreferrer' className='block px-4 py-2 hover:bg-brand-fg/5 transition-colors'>
                          <span className='text-base font-medium'>{item.name}</span>
                          {item.description && <span className='block text-xs text-brand-muted'>{item.description}</span>}
                        </a>
                      ) : (
                        <Link key={item.name} to={item.to} className='block px-4 py-2 hover:bg-brand-fg/5 transition-colors'>
                          <span className='text-base font-medium'>{item.name}</span>
                          {item.description && <span className='block text-xs text-brand-muted'>{item.description}</span>}
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>

        <div className='hidden lg:flex items-center gap-3 flex-shrink-0'>
          {/* GitHub badge - matches Webflow .nav-menu_gh_count styling */}
          <a href='https://github.com/OpenHands/OpenHands' target='_blank' rel='noopener noreferrer' className='flex items-center gap-1.5 text-sm transition-colors hover:opacity-80 whitespace-nowrap'>
            <GitHubLogoBlack className='w-4 h-4 flex-shrink-0' style={{ width: '16px', height: '16px' }} />
            <span style={{ fontWeight: 400 }}>{formatThousands(statistics.stargazers)}</span>
          </a>
          {/* Webflow buttons use outer div for padding, inner a for link coverage */}
          {/* .button has padding: 0.9em 1.9em (14.4px 30.4px at 16px) */}
          <div className='btn btn-outline whitespace-nowrap flex-shrink-0' style={{ padding: '0.9em 1.9em', margin: 0 }}>
            <Link to='https://docs.openhands.dev/sdk' className='absolute inset-0' aria-label='Build with SDK' />
            <span aria-hidden='true'>Build with SDK</span>
          </div>
          <div className='btn btn-primary whitespace-nowrap flex-shrink-0' style={{ padding: '0.9em 1.9em', margin: 0 }}>
            <Link to='https://app.all-hands.dev' className='absolute inset-0' aria-label='Try it live' />
            <span aria-hidden='true'>Try it live</span>
          </div>
        </div>
      </div>
    </header>
  );
};
