// components/Hero.tsx
import Link from 'next/link';
import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="bg-neutral-950 flex items-center justify-center grow">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 md:py-20 md:px-10 lg:py-32 my-20">
        <div className="mx-2 max-w-full text-left text-white">

          <h1 className="mb-6 pb-4 text-6xl font-bold md:text-9xl">
            All Hands AI.
          </h1>

          <p className="mb-7 lg:mb-8 text-4xl md:text-6xl">
            We build AI software development agents <b>for everyone, in the open.</b>
          </p>
          
          <div className="flex space-x-5 pt-7">
            {/* <a href="https://github.com/OpenDevin/OpenDevin" 
              className="grid grid-cols-1 gap-1 justify-items-center rounded-lg bg-slate-300 px-3 py-3 text-center font-bold text-black transition hover:border-black hover:bg-white sm:grid-cols-3 sm:justify-items-start">
              <img src="/logo/open-devin.png" alt="OpenDevin logo" className="h-8 w-8" />
              <span className="sm:col-span-2">OpenDevin</span>
              <img
                      src="https://img.shields.io/github/stars/opendevin/opendevin?style=social"
                      alt="Stargazers"
                      className="inline-block align-middle h-6 col-span-1 sm:col-span-3"
              />
            </a> */}

            <a href="/contact" className="inline-flex items-center justify-center rounded-lg bg-slate-300 px-6 py-3 text-center font-bold text-black transition hover:border-black hover:bg-white text-xl">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;


{/* Logo Cloud -- Use it when we have enterprise customers */}
{/* <div className="mx-auto mt-16 grid max-w-[1040px] grid-cols-2 gap-8 py-20 sm:grid-cols-3 sm:gap-12 md:grid-cols-5">
  <div className="mx-auto">
    <img src="https://uploads-ssl.webflow.com/646f65e37fe0275cfb808405/646f66cdeeb4ddfdae25a267_Microsoft%20Logo.svg" alt="" className="inline-block" />
  </div>
  <div className="mx-auto">
    <img src="https://uploads-ssl.webflow.com/646f65e37fe0275cfb808405/646f66cdeeb4ddfdae25a26a_PayPal%20Logo.svg" alt="" className="inline-block" />
  </div>
  <div className="mx-auto">
    <img src="https://uploads-ssl.webflow.com/646f65e37fe0275cfb808405/646f66cdeeb4ddfdae25a268_Google%20Logo.svg" alt="" className="inline-block" />
  </div>
  <div className="mx-auto">
    <img src="https://uploads-ssl.webflow.com/646f65e37fe0275cfb808405/646f66cdeeb4ddfdae25a269_Chase%20Logo.svg" alt="" className="inline-block" />
  </div>
  <div className="mx-auto">
    <img src="https://uploads-ssl.webflow.com/646f65e37fe0275cfb808405/646f66cdeeb4ddfdae25a26b_Walmart%20Logo.svg" alt="" className="inline-block" />
  </div>
</div> */}
