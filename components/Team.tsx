import React from 'react';

interface NameCardProps {
  name: string;
  title: string;
  imageUrl: string;
  websiteUrl: string;
}

const NameCard: React.FC<NameCardProps> = ({ name, title, imageUrl, websiteUrl}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-solid border-[#636262] p-4 [box-shadow:rgb(0,_0,_0)_6px_6px]">
      <img
        src={imageUrl}
        alt={name}
        className="mb-2 inline-block w-full rounded-xl object-cover h-80 lg:h-80"
      />
      <p className="font-bold text-2xl">{name}</p>
      <p className="text-xl text-gray-700">{title}</p>
      <div className="mb-1 text-lg">
        <a href={websiteUrl} target="_blank" rel="noopener noreferrer">[Website]</a>
        {/* <Link href={websiteUrl}>
            <FontAwesomeIcon icon={faGithub} className="text-white" size="2x" />
        </Link> */}
      </div>
    </div>
  );
};

const Team: React.FC = () => {
  return (
    <section>
      <div className="mx-auto w-full max-w-7xl px-5 py-16 md:px-10 md:py-20 lg:py-32 md:mt-10">
        <div className="text-center mb-5 md:mb-20">
          <h2 className="text-3xl font-semibold md:text-5xl">All Hands AI Team</h2>
        </div>
        <div className="mx-auto grid max-w-[1040px] grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 sm:justify-items-stretch md:grid-cols-3 md:gap-4 lg:gap-6">
          <NameCard name="Robert Brennan" title="Founder & CEO" imageUrl="/team/robert.jpg" websiteUrl="https://rbren.io/" />
          <NameCard name="Xingyao Wang" title="Founder" imageUrl="/team/xingyao.jpg" websiteUrl="https://xwang.dev/" />
          <NameCard name="Graham Neubig" title="Founder" imageUrl="/team/graham.jpg" websiteUrl="https://www.phontron.com/" />
        </div>
      </div>
    </section>
  );
};

export default Team;
