"use client";
import Link from 'next/link';
import React, { useState } from 'react';
import MobileMenuButton from './MobileMenuButton';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { href: "https://allhandsai.applytojob.com/apply/", label: "Join us" },
    { href: "/team", label: "Team" },
    { href: "/blog", label: "Blog" }, // Add other items as needed
    { href: "/share-opendevin", label: "Share OpenDevin" },
    { href: "/contact", label: "Contact" },
  ];

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
              {navItems.map(item => (
                <Link key={item.href} href={item.href}>
                  <span className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-md font-medium cursor-pointer">
                    {item.label}
                  </span>
                </Link>
              ))}
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
            {navItems.map(item => (
              <Link key={item.href} href={item.href}>
                <span className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
