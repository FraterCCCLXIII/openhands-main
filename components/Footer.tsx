// components/Footer.tsx
import Link from 'next/link';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <div className="bg-black py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          <div className="flex space-x-4 mb-4">
            <a href="https://github.com/OpenDevin/OpenDevin" target="_blank" rel="noopener noreferrer">
              <img src="/social/github.svg" alt="Github" title="Github" style={{ width: '24px', height: '24px' }} />
            </a>
            <a href="https://twitter.com/allhands_ai" target="_blank" rel="noopener noreferrer">
              <img src="/social/twitter.svg" alt="Twitter" title="Twitter" style={{ width: '24px', height: '24px' }} />
            </a>
            <a href="mailto:contact@all-hands.dev" target="_blank" rel="noopener noreferrer">
              <img src="/social/email.svg" alt="Email" title="Email" style={{ width: '24px', height: '24px' }} />
            </a>
            <a href="https://join.slack.com/t/opendevin/shared_invite/zt-2jsrl32uf-fTeeFjNyNYxqSZt5NPY3fA" target="_blank" rel="noopener noreferrer">
              <img src="/social/slack.svg" alt="Slack" title="Slack" style={{ width: '24px', height: '24px' }} />
            </a>
            <a href="https://discord.gg/ESHStjSjD4" target="_blank" rel="noopener noreferrer">
              <img src="/social/discord.svg" alt="Discord" title="Discord" style={{ width: '24px', height: '24px' }} />
            </a>
          </div>
          <div className="text-gray-300">© 2024 All Hands AI.</div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
