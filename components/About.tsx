import React from 'react';
import Link from 'next/link';

const About: React.FC = () => {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24 lg:py-32">
        <h2 className="mb-6 pb-4 text-2xl font-bold md:text-4xl">
            All Hands AI's mission is to build AI tools to help developers build software faster and better, and do it in the open.
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center">
          <div className="md:w-1/4 mb-8 mr-8 md:mb-0">
            <img src="/logo/open-devin.png" alt="OpenDevin logo" className="w-full" />
          </div>
          <div className="md:w-3/4 text-left">
            <div className="mb-5 text-2xl lg:mb-8 md:text-3xl">
              <p>
                Our flagship project is <a href="https://github.com/OpenDevin/OpenDevin">OpenDevin</a>{' '}
                <a href="https://github.com/OpenDevin/OpenDevin/stargazers" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://img.shields.io/github/stars/opendevin/opendevin?style=social"
                    alt="Stargazers"
                    className="inline-block align-middle h-8"
                  />
                </a>
                , an open-source software development agent that can autonomously solve software development tasks end-to-end.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
