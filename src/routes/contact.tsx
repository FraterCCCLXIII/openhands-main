import { Link } from 'react-router';
import type { Route } from './+types/contact';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'Get in Touch | OpenHands Sales & Support' },
    { name: 'description', content: 'Connect with the OpenHands team to explore cloud coding agents, enterprise deployments, support, or partnerships.' },
    { property: 'og:title', content: 'Get in Touch | OpenHands Sales & Support' },
    { property: 'og:description', content: 'Connect with the OpenHands team to explore cloud coding agents, enterprise deployments, support, or partnerships.' },
    { property: 'og:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Get in Touch | OpenHands Sales & Support' },
    { name: 'twitter:description', content: 'Connect with the OpenHands team to explore cloud coding agents, enterprise deployments, support, or partnerships.' },
    { name: 'twitter:image', content: 'https://www.all-hands.dev/assets/all-hands-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const CONTACT_OPTIONS = [
  {
    title: 'Enterprise Sales',
    description: 'Learn about OpenHands Enterprise for your team or organization.',
    cta: 'Book a demo',
    link: 'https://forms.gle/pdYjBk59Fwy6rshF8',
  },
  {
    title: 'Support',
    description: 'Get help with OpenHands Cloud or technical questions.',
    cta: 'Get support',
    link: 'https://join.slack.com/t/openhands-community/shared_invite/zt-2t4m9lwnr-pZPQqJlB~vAMJ1BYY2c31w',
  },
  {
    title: 'Partnerships',
    description: 'Explore partnership and integration opportunities.',
    cta: 'Contact us',
    link: 'https://docs.google.com/forms/d/e/1FAIpQLScygK76gSmjRfqkC1XzogU89X4vNVaiITdDVkmdEP_Qh2b4gg/viewform',
  },
  {
    title: 'Press & Media',
    description: 'For press inquiries and media resources.',
    cta: 'View newsroom',
    link: '/press',
  },
];

const Contact = () => {
  return (
    <main className='pt-[100px]'>
      {/* Hero */}
      <section className='px-10 py-20 lg:py-32 text-center max-w-4xl mx-auto'>
        <h1 className='text-4xl lg:text-6xl font-bold mb-6'>
          Talk to the OpenHands Team
        </h1>
        <p className='text-lg lg:text-xl text-brand-muted max-w-2xl mx-auto mb-8'>
          Connect with us to explore enterprise solutions, get support, or discuss partnerships.
        </p>
        <div className='flex gap-4 justify-center flex-wrap'>
          <Link to='https://app.all-hands.dev' className='btn btn-primary'>
            Try it live
          </Link>
          <Link to='https://docs.openhands.dev/sdk' className='btn btn-outline'>
            Build with SDK
          </Link>
        </div>
      </section>

      {/* Contact Options */}
      <section className='px-10 py-20 max-w-4xl mx-auto'>
        <div className='grid md:grid-cols-2 gap-6'>
          {CONTACT_OPTIONS.map((option) => (
            <div key={option.title} className='border border-brand-border rounded-xl p-6'>
              <div className='text-lg font-semibold mb-2'>{option.title}</div>
              <p className='text-brand-muted text-sm mb-4'>{option.description}</p>
              <a
                href={option.link}
                target={option.link.startsWith('/') ? undefined : '_blank'}
                rel={option.link.startsWith('/') ? undefined : 'noopener noreferrer'}
                className='btn btn-outline text-sm'
              >
                {option.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* General Contact */}
      <section className='px-10 py-20 bg-[#efe6d1] text-center'>
        <div className='max-w-2xl mx-auto'>
          <div className='section-title mb-6'>General Inquiries</div>
          <p className='text-brand-muted mb-8'>
            For general questions, fill out our contact form and we'll get back to you.
          </p>
          <a
            href='https://docs.google.com/forms/d/e/1FAIpQLScygK76gSmjRfqkC1XzogU89X4vNVaiITdDVkmdEP_Qh2b4gg/viewform'
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-primary btn-lg'
          >
            Contact us
          </a>
        </div>
      </section>
    </main>
  );
};

export default Contact;