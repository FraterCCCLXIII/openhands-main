import { Link } from 'react-router';
import AllHandsLogo from '~/svgs/brand/all-hands-logo-1.svg?react';
import GitHubCircleLogo from '~/svgs/gh-logo.svg?react';
import TwitterLogo from '~/svgs/twitter-logo.svg?react';

export const Footer = () => (
  <footer>
    <div className="bg-[url('/assets/white-wave.png')] h-[89px]" />

    <div className='bg-white h-[355px] lg:h-[175px] pt-8 lg:pt-0 flex justify-center'>
      <div className='flex flex-col lg:flex-row items-center lg:justify-between lg:w-screen lg:max-w-[1086px] gap-8'>
        <AllHandsLogo width={65} height={45} />

        <nav className='w-[160px] lg:w-auto'>
          <ul className='flex flex-wrap gap-8 justify-center text-sm leading-[21px] lg:flex'>
            <li>
              <Link
                to='https://github.com/OpenHands/OpenHands'
                rel='noreferrer'
                target='_blank'
              >
                GitHub
              </Link>
            </li>
            <li>
              <Link to='blog'>Blog</Link>
            </li>
            <li>
              <Link 
                to='https://docs.all-hands.dev/'
                target='_blank'
                rel='noopener noreferrer'
              >
                Docs
              </Link>
            </li>
            <li>
              <Link to='about'>About Us</Link>
            </li>
            <li>
              <Link to='contact'>Contact</Link>
            </li>
            <li>
              <Link 
                to='https://allhandsai.applytojob.com/apply/'    
                target='_blank'
              >Careers</Link>
            </li>
            <li>
              <Link
                to='https://statuspage.incident.io/openhands'
                target='_blank'
                >System Status</Link>
            </li>
            <li>
              <Link to='tos'>Terms of Service</Link>
            </li>
            <li>
              <Link to='privacy'>Privacy Policy</Link>
            </li>
          </ul>
        </nav>

        <span className='flex gap-4'>
          <Link
            aria-label='OpenHands GitHub'
            to='https://github.com/OpenHands/OpenHands'
            rel='noreferrer'
            target='_blank'
          >
            <GitHubCircleLogo width={24} height={24} />
          </Link>
          <Link
            aria-label='OpenDevin Twitter'
            to='https://x.com/OpenHandsDev'
            rel='noreferrer'
            target='_blank'
          >
            <TwitterLogo width={24} height={24} />
          </Link>
        </span>
      </div>
    </div>
  </footer>
);
