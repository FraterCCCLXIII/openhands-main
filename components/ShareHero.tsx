import React from 'react';

const ShareHero: React.FC = () => {
  return (
    <div className="bg-neutral-950 flex items-center justify-center flex-grow">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 md:py-20 md:px-10 lg:py-32 my-20">
        <div className="mx-2 max-w-full text-left text-white">
          <h1 className="mb-6 pb-4 text-6xl font-bold md:text-9xl">
            Share OpenDevin
          </h1>
          <p className="mb-7 lg:mb-8 text-4xl md:text-6xl">
            View and share OpenDevin content with others.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareHero;
