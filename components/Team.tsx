import React from 'react';

const people = [
  {
    name: 'Robert Brennan',
    role: 'Founder & CEO',
    imageUrl: '/team/robert.jpg',
    websiteUrl: 'https://rbren.io/',
    xUrl: 'https://x.com/rbren_dev',
    linkedinUrl: 'https://www.linkedin.com/in/robert-a-brennan/',
    githubUrl: 'https://github.com/rbren',
  },
  {
    name: 'Xingyao Wang',
    role: 'Founder',
    imageUrl: '/team/xingyao.jpg',
    websiteUrl: 'https://xwang.dev/',
    xUrl: 'https://x.com/xingyaow_',
    linkedinUrl: 'https://www.linkedin.com/in/xingyao-wang',
    githubUrl: 'https://github.com/xingyaoww',
  },
  {
    name: 'Graham Neubig',
    role: 'Founder',
    imageUrl: '/team/graham.jpg',
    websiteUrl: 'https://www.phontron.com/',
    xUrl: 'https://x.com/gneubig',
    linkedinUrl: 'https://www.linkedin.com/in/graham-neubig-10b41616b/',
    githubUrl: 'https://github.com/neubig',
  },
];


const NameCard: React.FC<{ person: typeof people[number] }> = ({ person }) => {
  return (
  <li>
    <img className="aspect-1 max-h-100 w-full rounded-2xl object-cover" src={person.imageUrl} alt={person.name} />
    <h3 className="mt-6 text-lg font-semibold leading-8 tracking-tight text-gray-900">{person.name}</h3>
    <p className="text-base leading-7 text-gray-600">{person.role}</p>
    
    <ul role="list" className="mt-6 flex gap-x-6">

      <li>
        <a href={person.websiteUrl} target="_blank" rel="noopener noreferrer">
          <span className="sr-only">Website</span>
          <img src="/social/website.svg" alt="Website" title="Website" style={{ width: '24px', height: '24px'}} />
        </a>
      </li>

      <li>
        <a href={person.xUrl} target="_blank" rel="noopener noreferrer">
          <span className="sr-only">X</span>
          <img src="/social/twitter.svg" alt="Twitter" title="Twitter" style={{ width: '24px', height: '24px', filter: 'invert(100%)' }} />
        </a>
      </li>


      <li>
        <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer">
          <span className="sr-only">LinkedIn</span>
          <img src="/social/linkedin.svg" alt="LinkedIn" title="LinkedIn" style={{ width: '24px', height: '24px' }} />
        </a>
      </li>
</ul>
</li>
);
};

const Team: React.FC = () => {
  return (
  <div className="bg-white py-24 sm:py-32">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl lg:mx-0">
        <h2 className="text-6xl font-bold tracking-tight text-gray-900">
        All Hands AI Team
        </h2>
      </div>
      <ul
      role="list"
      className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3"
      >
      {people.map((person) => (
      <NameCard key={person.name} person={person} />
      ))}
      </ul>
    </div>
  </div>
);
};
export default Team;
