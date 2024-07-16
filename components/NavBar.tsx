"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import MobileMenuButton from './MobileMenuButton';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return ( 
    <nav className="bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className='hover:no-underline'>
              <span className="flex items-center text-white font-bold text-xl cursor-pointer">
                <img src="/logo/all-hands-logo-white.png" alt="All Hands AI" className="w-8 mr-2" />
                All Hands AI
              </span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {/* <Link href="/about">
                <span className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-md font-medium cursor-pointer">
                  About
                </span>
              </Link> */}
              <Link href="https://allhandsai.applytojob.com/apply/">
                <span className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-md font-medium cursor-pointer">
                  Join us
                </span>
              </Link>
              <Link href="/team">
                <span className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-md font-medium cursor-pointer">
                  Team
                </span>
              </Link>
              <Link href="/blog">
                <span className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-md font-medium cursor-pointer">
                  Blog
                </span>
              </Link>
              <Link href="/contact">
                <span className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-md font-medium cursor-pointer">
                  Contact
                </span>
              </Link>
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <MobileMenuButton isOpen={isOpen} onClick={toggleMenu} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* <Link href="/about">
              <span className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer">
                About
              </span>
            </Link> */}
            <Link href="/team">
              <span className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer">
                Team
              </span>
            </Link>
            <Link href="/contact">
              <span className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer">
                Contact
              </span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
