import clsx from 'clsx';
import X from '~/svgs/x.svg?react';
import TripleWowYellow from '~/svgs/triple-wow-yellow.svg?react';
import { motion } from 'framer-motion';
import React from 'react';
import { NavLink } from 'react-router';
import { MainButton } from '../main-button';
import { AnimatedListItem } from './animated-list-item';
import { ExternalAnchor } from './external-anchor';

const INTERNAL_NAV_MAP = [
  { name: 'Home', to: '/' },
  { name: 'Product', to: '/features' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'Blog', to: '/blog' },
  { name: 'Careers', to: 'https://allhandsai.applytojob.com/apply/' },
  { name: 'About Us', to: '/about' },
];

const EXTERNAL_NAV_MAP = [{ name: 'Docs', to: 'https://docs.all-hands.dev/' }];

interface SidebarProps {
  isHidden: boolean;
  onClose: () => void;
  onClickGitHubButton?: () => void;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ isHidden, onClose, onClickGitHubButton }, ref) => (
    <motion.aside
      ref={ref}
      hidden={isHidden}
      initial={{ x: '-100%' }}
      animate={{ x: isHidden ? '-100%' : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      data-testid='sidebar'
      className={clsx(
        'bg-black flex fixed top-0 left-0 w-screen h-screen lg:w-[323px] items-center lg:items-start justify-center z-30'
      )}
    >
      <button
        onClick={onClose}
        className='absolute left-7 top-7'
        aria-label='Close Sidebar'
      >
        <X width={31} height={31} style={{ color: '#FFE165' }} />
      </button>

      <nav className='lg:mt-[122px]'>
        <ul className='text-center flex flex-col gap-8'>
          {INTERNAL_NAV_MAP.map((item) => (
            <AnimatedListItem key={item.name}>
              {item.to.startsWith('http') ? (
                <ExternalAnchor to={item.to}>{item.name}</ExternalAnchor>
              ) : (
                <NavLink to={item.to} className='relative' onClick={onClose}>
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <TripleWowYellow
                          width={36}
                          height={22}
                          className='absolute -right-7 -top-2 transform rotate-[34deg]'
                        />
                      )}
                      {item.name}
                    </>
                  )}
                </NavLink>
              )}
            </AnimatedListItem>
          ))}
          {EXTERNAL_NAV_MAP.map((item) => (
            <AnimatedListItem key={item.name}>
              <ExternalAnchor to={item.to}>{item.name}</ExternalAnchor>
            </AnimatedListItem>
          ))}
          <li>
            <MainButton onClick={onClickGitHubButton} />
          </li>
        </ul>
      </nav>
    </motion.aside>
  )
);

Sidebar.displayName = 'Sidebar';
