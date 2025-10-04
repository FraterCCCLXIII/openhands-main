import React from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import MenuIcon from '~/svgs/menu.svg?react';
import { Link, NavLink } from 'react-router';
import { AnimatedHeaderLogo } from './animated-header-logo';
import clsx from 'clsx';
import { GitHubButton } from './buttons/github-button';
import { TryItLiveButton } from './buttons/try-it-live-button';

// Navigation items for desktop view
const DESKTOP_NAV_ITEMS = [
  { name: 'Home', to: '/' },
  { name: 'Product', to: '/features' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'Blog', to: '/blog' },
  { name: 'Docs', to: 'https://docs.all-hands.dev/' },
];

interface HeaderProps {
  onClickMenuButton: () => void;
  showMenuIcon?: boolean;
  width?: number;
  onClickGitHubButton?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  width,
  showMenuIcon,
  onClickMenuButton,
  onClickGitHubButton,
}) => {
  const { scrollY } = useScroll();
  const [textIsVisible, setTextIsVisible] = React.useState(true);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > 0) {
      setTextIsVisible(false);
    } else {
      setTextIsVisible(true);
    }
  });

  return (
    <>
      {/* Webinar Banner */}
      <div className='bg-black text-white h-[50px] flex items-center justify-center fixed top-0 left-0 right-0 z-30 w-full'>
        <p className='text-center text-sm font-medium px-4'>
          <a href="https://luma.com/56mzjmzu" target="_blank"><u>Register</u> for our October 13th Webinar: Streamlining Dev Workflows with MCP</a>
        </p>
      </div>

      <header className='h-[83px] flex items-center bg-[#F1EAE0] fixed top-[50px] right-0 justify-between z-20 w-full'>


        {/* Max width container for desktop view */}
        <div className='w-full max-w-[1440px] mx-auto flex items-center px-[30px]'>


        {/* Mobile view - Logo centered with menu button on left */}
        <div className='flex items-center justify-between w-full lg:w-1/3 lg:justify-start'>
          {/* Mobile menu button - only visible on mobile */}
          <div className='lg:hidden w-[38px]'>
            {showMenuIcon && (
              <button aria-label='Open Menu' onClick={onClickMenuButton}>
                <MenuIcon width={38} height={38} />
              </button>
            )}
          </div>

          {/* Logo - centered on mobile, left-aligned on desktop */}
          <div className='flex-1 flex justify-center lg:justify-start'>
            <Link to='/' aria-label='Go to Home'>
              <AnimatedHeaderLogo renderText={textIsVisible} />
            </Link>
          </div>

          {/* Empty div to balance the menu button on mobile */}
          <div className='lg:hidden w-[38px]'></div>
        </div>

        {/* Center - Desktop Navigation - only visible on desktop */}
        <div className='hidden lg:flex lg:w-1/3 justify-center'>
          <nav>
            <ul className='flex space-x-8'>
              {DESKTOP_NAV_ITEMS.map((item) => (
                <li key={item.name}>
                  {item.to.startsWith('http') ? (
                    <a
                      href={item.to}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-[18px] hover:text-gray-600 transition-colors'
                    >
                      {item.name}
                    </a>
                  ) : (
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        clsx(
                          'text-[18px] hover:text-gray-600 transition-colors',
                          isActive && 'font-semibold'
                        )
                      }
                    >
                      {item.name}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Right side buttons */}
        <div className='hidden lg:flex lg:w-1/3 justify-end gap-[15px]'>
          <TryItLiveButton />
          <GitHubButton onClick={onClickGitHubButton} />
        </div>
      </div>
    </header>
    </>
  );
};
