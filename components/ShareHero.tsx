import React from 'react';

const ShareHero: React.FC = () => {
  return (
    <div className="bg-neutral-950 flex items-center justify-center grow">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 md:py-20 md:px-10 lg:py-12 my-20">
        <div className="mx-2 max-w-full text-left text-white">
          <h1 className="mb-6 pb-4 text-6xl font-bold md:text-9xl">
            Share OpenDevin
          </h1>
        </div>
      </div>
    </div>
  );
};

export default ShareHero;
