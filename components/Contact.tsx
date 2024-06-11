import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="bg-neutral-900 flex items-center justify-center flex-grow">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 my-20 md:px-10 md:py-24 lg:py-32">
        <div className="max-w-full text-left text-white">
          <h1 className="mx-2 mb-10 pb-4 text-6xl font-bold md:text-9xl">
            Contact.
          </h1>
          <p className="mx-2 mb-5 text-2xl lg:mb-8 md:text-4xl">
            Email: <a href="mailto:contact@all-hands.dev">contact@all-hands.dev</a>
          </p>

          <p className="mx-2 mb-5 text-2xl lg:mb-8 md:text-4xl">
            GitHub: <a href="https://github.com/OpenDevin">OpenDevin/OpenDevin</a>
          </p>

          <p className="mx-2 mb-5 text-2xl lg:mb-8 md:text-4xl">
            Slack: <a href="https://join.slack.com/t/opendevin/shared_invite/zt-2jsrl32uf-fTeeFjNyNYxqSZt5NPY3fA">join.slack.com/t/opendevin</a>
          </p>

          <p className="mx-2 mb-5 text-2xl lg:mb-8 md:text-4xl">
            Discord: <a href="https://discord.gg/ESHStjSjD4">discord.gg/ESHStjSjD4</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
