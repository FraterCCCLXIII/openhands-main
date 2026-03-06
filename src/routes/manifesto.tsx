import { Link } from 'react-router';
import type { Route } from './+types/manifesto';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Manifesto | The Future of Open, Autonomous Software Development' },
    { name: 'description', content: 'We believe software development should be open, transparent, and autonomous. Discover OpenHands\' vision for the future of coding.' },
    { property: 'og:title', content: 'OpenHands Manifesto | The Future of Open, Autonomous Software Development' },
    { property: 'og:description', content: 'We believe software development should be open, transparent, and autonomous. Discover OpenHands\' vision for the future of coding.' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const Manifesto = () => {
  return (
    <main className='pt-[100px]'>
      {/* Hero Section */}
      <section className='px-10 py-20 lg:py-32 text-center max-w-4xl mx-auto'>
        <h1 className='text-4xl lg:text-6xl font-bold mb-6'>
          Hands on the Future
        </h1>
        <p className='text-lg lg:text-xl text-brand-muted max-w-2xl mx-auto'>
          We believe in an open, autonomous future for software development
        </p>
      </section>

      {/* Opening Statement - H3 to match live site */}
      <section className='px-10 py-20 max-w-3xl mx-auto'>
        <h3 className='text-xl font-semibold mb-8'>
          We're at the beginning of a new era in software development. Work is shifting from keystrokes to delegated tasks, from single laptops to coordinated fleets of agents running in environments you control.This is our point of view on how we build, what we ship, and why it matters… we believe:‍
        </h3>
        <div className='prose prose-lg'>
          <ul className='space-y-4 text-lg'>
            <li>The future of software development must be written by engineers</li>
            <li>A new class of engineers are emerging</li>
            <li>Scale lives in the cloud</li>
            <li>Openness is non-negotiable</li>
            <li>Model choice is a right</li>
          </ul>
        </div>
      </section>

      {/* What this means for OpenHands - H3 */}
      <section className='px-10 py-20 bg-[#efe6d1]'>
        <div className='max-w-3xl mx-auto'>
          <h3 className='text-xl font-semibold mb-8'>What this means for OpenHands</h3>
          <div className='prose prose-lg'>
            <p className='text-lg leading-relaxed mb-6'>
              We are building an open platform for cloud coding agents that embodies these principles.
              OpenHands is transparent, customizable, and accessible to all developers.
            </p>
            <p className='text-lg leading-relaxed'>
              We believe developers deserve AI coding tools they can trust, inspect, and modify.
              Tools that respect their autonomy and don't lock them into proprietary ecosystems.
            </p>
          </div>
        </div>
      </section>

      {/* What this asks of you - H3 */}
      <section className='px-10 py-20 max-w-3xl mx-auto'>
        <h3 className='text-xl font-semibold mb-8'>What this asks of you</h3>
        <div className='prose prose-lg'>
          <p className='text-lg leading-relaxed mb-8'>
            Join us in building the future of software development.
            A future that is open, transparent, and works for everyone.
          </p>
        </div>
        <div className='flex gap-4 justify-center flex-wrap'>
          <Link to='https://app.all-hands.dev' className='btn btn-primary btn-lg'>
            Try it live
          </Link>
          <Link to='https://docs.openhands.dev/sdk' className='btn btn-outline btn-lg'>
            Build with SDK
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Manifesto;
