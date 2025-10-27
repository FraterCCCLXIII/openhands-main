import { ContributorGrid } from '~/components/contributor-grid';
import { MemberCard } from '~/components/member-card';
import { SectionHeading } from '~/components/section-heading';
import { YellowWaveSection } from '~/components/yellow-wave-section';
import contributors from '~/data/contributors.json';
import statistics from '~/data/statistics.json';
import { formatContributorCount } from '~/utils/format-contributor-count';
import type { Route } from './+types/about';
import { founders, members } from '~/constants/members';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'All Hands AI - About Us' },
    { name: 'description', content: 'Discover the talented team behind OpenHands and how we leverage the power of collaboration to innovate in software development.' },
    { property: 'og:title', content: 'All Hands AI - About Us' },
    { property: 'og:description', content: 'Discover the talented team behind OpenHands and how we leverage the power of collaboration to innovate in software development.' },
    { property: 'og:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'All Hands AI' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'All Hands AI - About Us' },
    { name: 'twitter:description', content: 'Discover the talented team behind OpenHands and how we leverage the power of collaboration to innovate in software development.' },
    { name: 'twitter:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const About = () => {
  const shuffledMembers = [...members].sort(() => Math.random() - 0.5);

  return (
    <main>
      <section className='flex flex-col items-center gap-4 text-center py-[86px] px-[53px]'>
        <h1 className='heading-large max-w-[763px]'>
          It takes a village to build the future. So we invited the internet.
        </h1>
      </section>

      <section className='flex flex-col items-center'>
        <SectionHeading subheading='OUR CONTRIBUTORS'>
          <p className='paragraph h-[75px]'>
            {formatContributorCount(statistics.contributors_count)} developers
            have contributed.{' '}
            <a
              className='underline'
              href='https://github.com/OpenHands/OpenHands'
              target='_blank'
              rel='noopener noreferrer'
            >
              Come join us!
            </a>
          </p>
          <div className='h-[calc(88px*4+40px)] lg:h-auto overflow-hidden relative'>
            <ContributorGrid variant='large' contributors={contributors} />
            <div className='lg:hidden absolute bottom-0 bg-gradient-to-t from-[#F1EAE0] to-transparent h-[40px] w-full' />
          </div>
        </SectionHeading>
      </section>

      <section className='flex flex-col items-center'>
        <SectionHeading subheading='THE ALL HANDS TEAM' />

        <div className='flex flex-col justify-center lg:flex-row flex-wrap max-w-[1228px]'>
          {founders.map((founder) => (
            <MemberCard key={founder.name} member={founder} />
          ))}
          {shuffledMembers.map((member) => (
            <MemberCard key={member.name} member={member} />
          ))}
        </div>
      </section>

      <section className='mb-[104px]'>
        <YellowWaveSection
          heading='Ready to start building software with software that builds software?'
          cta={{
            text: 'View open jobs',
            to: 'https://allhandsai.applytojob.com/apply/',
          }}
        />
      </section>
    </main>
  );
};

export default About;
