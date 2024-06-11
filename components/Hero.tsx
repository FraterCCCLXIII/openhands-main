// components/Hero.tsx
import React from 'react';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <div className="bg-neutral-950 flex items-center justify-center h-auto">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 my-20 md:px-10 md:py-24 lg:py-32">
        <div className="max-w-full text-left text-white ">
          <h1 className="mx-2 mb-6 pb-4 text-6xl font-bold md:text-9xl">
            All Hands AI.
          </h1>
          <p className="mx-2 mb-5 text-4xl lg:mb-8 md:text-6xl">
            We build AI software development agents for everyone, <b>in the open.</b>
          </p>
          
          <a href="/contact" className="inline-block rounded-full bg-slate-400 px-6 py-3 text-center font-bold text-black transition hover:border-black hover:bg-white">
            Contact Us
          </a>
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
