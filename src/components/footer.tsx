import { Link, NavLink } from 'react-router';
import { useState } from 'react';

// Footer nav links matching openhands.dev exactly
const MAIN_NAV = [
  { name: 'Home', to: '/' },
  { name: 'Product', to: '/product' },
  { name: 'Enterprise', to: '/enterprise' },
  { name: 'Pricing', to: '/pricing' },
  { name: 'About', to: '/about' },
];

const RESOURCES_DROPDOWN = [
  { name: 'Community', to: '/community' },
  { name: 'Manifesto', to: '/manifesto' },
  { name: 'Docs', to: 'https://docs.openhands.dev/' },
  { name: 'Blog', to: '/blog' },
  { name: 'Press', to: '/press' },
  { name: 'Careers', to: 'https://jobs.ashbyhq.com/OpenHands' },
];

// Footer is rendered INSIDE the yellow CTA section on the live site
// This component only renders the nav links, copyright, and logo
export const Footer = () => {
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <div className='text-center'>
      {/* Horizontal nav links */}
      <div className='flex flex-wrap justify-center gap-x-8 gap-y-2 mb-4'>
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `text-sm hover:opacity-70 transition-opacity ${isActive ? 'font-semibold' : ''}`
            }
          >
            {item.name}
          </NavLink>
        ))}
        {/* Resources dropdown */}
        <div className='relative'>
          <button
            onClick={() => setResourcesOpen(!resourcesOpen)}
            className='text-sm hover:opacity-70 transition-opacity'
          >
            Resources
          </button>
          {resourcesOpen && (
            <div className='absolute top-full left-0 mt-2 bg-brand-bg border border-brand-border rounded-lg shadow-lg py-2 min-w-[140px] z-50'>
              {RESOURCES_DROPDOWN.map((item) =>
                item.to.startsWith('http') ? (
                  <a
                    key={item.name}
                    href={item.to}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block px-4 py-1.5 text-sm hover:bg-brand-fg/10 transition-colors'
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.to}
                    className='block px-4 py-1.5 text-sm hover:bg-brand-fg/10 transition-colors'
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>
          )}
        </div>
        <NavLink to='/contact' className='text-sm hover:opacity-70 transition-opacity'>
          Contact
        </NavLink>
      </div>

      {/* Divider */}
      <div className='w-full max-w-3xl mx-auto border-t border-brand-fg/20 my-6' />

      {/* Copyright and Privacy */}
      <div className='text-xs font-mono mb-2'>
        © {new Date().getFullYear()} OpenHands - All rights reserved
      </div>
      <Link to='/privacy' className='text-xs font-mono hover:underline'>
        Privacy Policy
      </Link>

      {/* Large OpenHands logo */}
      <div className='mt-8 flex justify-center'>
        <img
          src='/assets/webflow/brand/openhands-logo-full.svg'
          alt='OpenHands'
          className='h-16 lg:h-20'
        />
      </div>
    </div>
  );
};
