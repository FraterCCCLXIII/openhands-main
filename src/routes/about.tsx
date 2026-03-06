import { Link } from 'react-router';
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
    { title: 'About OpenHands | Our Mission, Team, and Community' },
    { name: 'description', content: 'Learn about OpenHands - the open, model-agnostic AI platform redefining how software gets built. Backed by a global community of contributors.' },
    { property: 'og:title', content: 'About OpenHands | Our Mission, Team, and Community' },
    { property: 'og:description', content: 'Learn about OpenHands - the open, model-agnostic AI platform redefining how software gets built. Backed by a global community of contributors.' },
    { property: 'og:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'About OpenHands | Our Mission, Team, and Community' },
    { name: 'twitter:description', content: 'Learn about OpenHands - the open, model-agnostic AI platform redefining how software gets built. Backed by a global community of contributors.' },
    { name: 'twitter:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const MILESTONES = [
  { date: 'March 2024', title: 'Project Launch', description: 'OpenHands launched as an open-source project.' },
  { date: 'June 2024', title: '100K+ GitHub Stars Milestone', description: 'Reached over 100,000 stars on GitHub.' },
  { date: 'November 2024', title: 'Series A Funding', description: 'Raised $18.8M to build the open standard for autonomous software development.' },
];

const About = () => {
  const shuffledMembers = [...members].sort(() => Math.random() - 0.5);

  return (
    <main className='pt-[100px]'>
      <section className='flex flex-col items-center gap-4 text-center py-16 px-10'>
        <h1 className='text-4xl lg:text-6xl font-bold max-w-[900px]'>
          Empowering every team to build software autonomously.
        </h1>
        <p className='text-lg text-brand-muted max-w-2xl mt-4'>
          OpenHands is the open, secure, and model-agnostic platform for cloud coding agents.
        </p>
        <div className='flex gap-4 justify-center flex-wrap mt-6'>
          <Link to='https://app.all-hands.dev' className='btn btn-primary'>
            Try it live
          </Link>
          <Link to='https://docs.openhands.dev/sdk' className='btn btn-outline'>
            Build with SDK
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className='px-10 py-16'>
        <div className='max-w-4xl mx-auto'>
          <div className='grid md:grid-cols-2 gap-8 text-center'>
            <div className='border border-brand-border rounded-xl p-8'>
              <div className='text-5xl font-bold text-brand-accent mb-2'>{formatContributorCount(statistics.contributors_count)}+</div>
              <p className='text-brand-muted'>OSS contributors</p>
            </div>
            <div className='border border-brand-border rounded-xl p-8'>
              <div className='text-5xl font-bold text-brand-accent mb-2'>5M+</div>
              <p className='text-brand-muted'>Over 5 million open source downloads</p>
            </div>
          </div>
        </div>
      </section>

      {/* Built by developers */}
      <section className='px-10 py-16 bg-brand-fg text-white'>
        <div className='max-w-4xl mx-auto text-center'>
          <p className='text-3xl font-bold mb-4'>Built by developers, for developers.</p>
          <p className='text-white/70'>
            OpenHands is shaped by a global community of engineers who believe in open, autonomous software development.
          </p>
        </div>
      </section>

      {/* Milestones */}
      <section className='px-10 py-16 bg-[#efe6d1]'>
        <div className='max-w-4xl mx-auto'>
          <h2 className='section-title text-center mb-12'>Milestones</h2>
          <div className='space-y-8'>
            {MILESTONES.map((milestone) => (
              <div key={milestone.title} className='flex gap-6 items-start'>
                <div className='text-sm font-semibold text-brand-muted min-w-[120px]'>{milestone.date}</div>
                <div>
                  <div className='font-semibold mb-1'>{milestone.title}</div>
                  <p className='text-brand-muted'>{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
        <h3 className='sr-only'>Team</h3>

        <div className='flex flex-col justify-center lg:flex-row flex-wrap max-w-[1228px]'>
          {founders.map((founder) => (
            <MemberCard key={founder.name} member={founder} />
          ))}
          {shuffledMembers.map((member) => (
            <MemberCard key={member.name} member={member} />
          ))}
        </div>
      </section>

      <section className='mb-16'>
        <YellowWaveSection
          heading='Ready to join us?'
          cta={{
            text: 'Join us',
            to: 'https://allhandsai.applytojob.com/apply/',
          }}
        />
      </section>
    </main>
  );
};

export default About;
