import type { FormEvent } from 'react';
import type { Route } from './+types/contact';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'Get in Touch | OpenHands Sales & Support' },
    { name: 'description', content: "Connect with the OpenHands team to explore cloud coding agents, enterprise deployments, support, or partnerships. We're here to help." },
    { property: 'og:title', content: 'Get in Touch | OpenHands Sales & Support' },
    { property: 'og:description', content: "Connect with the OpenHands team to explore cloud coding agents, enterprise deployments, support, or partnerships. We're here to help." },
    { property: 'og:image', content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Get in Touch | OpenHands Sales & Support' },
    { name: 'twitter:description', content: "Connect with the OpenHands team to explore cloud coding agents, enterprise deployments, support, or partnerships. We're here to help." },
    { name: 'twitter:image', content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const CONTACT_FEATURES = [
  'Containerized sandbox runtime for safe autonomy',
  'Model agnostic - use any LLM provider you want',
  "Self-hosted or private cloud deployments - 'fully air gapped'",
  'Open source and transparent by design',
  'Access to proprietary SDK kits and custom applications',
  'Designated support, training, and services offerings',
];

const TRUSTED_LOGOS = [
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137f2cb537758796a9dba1_Roche_Logo.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137f10c3975e28b3932320_Amazon_logo%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137efe8466ac374a9bc8a1_idlJcLIGV__1761186158095%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137eedd7c29cc9046de43f_Group.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137ec5a6f77dd174e557ce_C3ai_logo%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137eac8f27ca27f5e48420_Netflix_2015_logo%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137e8df2c028b9e1506ede_mastercard%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137e783790933dd06f9d59_Red_Hat_Logo_2019%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137e5fa006d963a1d1904d_mongodb-ar21%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137e47b45195da10c50f49_apple-11%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137e34e3a5ab71e37082a7_NVIDIA_logo%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137e199ce2cb594b0210ab_google-ar21%201.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/690b9e5400fdae4c12eedd75_small-client-logo.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6915b02ded45d0b434a0974d_flextract.png',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137f6974b71a1a4a932f82_TikTok_logo.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137f523b08f91a5aa905b9_Vmware.svg',
];

const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};

const Contact = () => {
  return (
    <main className='pt-[100px]'>
      <section className='px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto grid max-w-[1238px] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,540px)] lg:gap-16'>
          <div>
            <h1 className='max-w-[640px] font-quincy text-[44px] font-normal leading-[0.95] tracking-[-0.04em] text-brand-fg lg:text-[60px]'>
              Talk to the OpenHands Team
            </h1>
            <p className='mt-4 max-w-[560px] text-lg leading-[1.5] text-brand-muted'>
              Get a custom demo and explore pricing, private deployments, and white-glove training, support and services for your org
            </p>

            <div className='mt-12'>
              <h2 className='text-[28px] font-medium leading-[1.15] tracking-[-0.03em] text-brand-fg lg:text-[32px]'>
                Why enterprises choose OpenHands
              </h2>
              <div className='mt-6 space-y-0 border-t border-brand-border/70'>
                {CONTACT_FEATURES.map((feature) => (
                  <div key={feature} className='flex items-start gap-3 border-b border-brand-border/70 py-4'>
                    <span className='mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-fg text-sm text-brand-bg'>
                      ✓
                    </span>
                    <p className='text-base leading-[1.55] text-brand-fg'>{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className='mt-12'>
              <p className='mb-6 text-sm font-medium uppercase tracking-[0.16em] text-brand-muted'>Trusted by engineers at</p>
              <div className='grid grid-cols-3 gap-x-6 gap-y-6 sm:grid-cols-4 lg:grid-cols-4'>
                {TRUSTED_LOGOS.map((logo) => (
                  <div key={logo} className='flex min-h-12 items-center justify-center'>
                    <img src={logo} alt='' className='max-h-8 w-auto object-contain' />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='rounded-[28px] border border-brand-border bg-white/55 p-6 shadow-[0_20px_60px_rgba(34,21,13,0.08)] backdrop-blur-sm lg:p-8'>
            <form className='space-y-5' onSubmit={handleSubmit}>
              <div className='grid gap-5 md:grid-cols-2'>
                <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                  <span>First Name *</span>
                  <input
                    type='text'
                    name='firstname'
                    placeholder='James'
                    required
                    className='rounded-none border border-brand-border bg-transparent px-4 py-3 text-base text-brand-fg outline-none transition-colors placeholder:text-brand-muted focus:border-brand-fg'
                  />
                </label>
                <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                  <span>Company email *</span>
                  <input
                    type='email'
                    name='email'
                    placeholder='email@company.com'
                    required
                    className='rounded-none border border-brand-border bg-transparent px-4 py-3 text-base text-brand-fg outline-none transition-colors placeholder:text-brand-muted focus:border-brand-fg'
                  />
                </label>
                <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                  <span>Last name *</span>
                  <input
                    type='text'
                    name='lastname'
                    placeholder='Smith'
                    required
                    className='rounded-none border border-brand-border bg-transparent px-4 py-3 text-base text-brand-fg outline-none transition-colors placeholder:text-brand-muted focus:border-brand-fg'
                  />
                </label>
                <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                  <span>Company name *</span>
                  <input
                    type='text'
                    name='company'
                    placeholder='Acme'
                    required
                    className='rounded-none border border-brand-border bg-transparent px-4 py-3 text-base text-brand-fg outline-none transition-colors placeholder:text-brand-muted focus:border-brand-fg'
                  />
                </label>
              </div>

              <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                <span>Engineering team size*</span>
                <select
                  name='team-size'
                  defaultValue=''
                  required
                  className='rounded-none border border-brand-border bg-transparent px-4 py-3 text-base text-brand-fg outline-none transition-colors focus:border-brand-fg'
                >
                  <option value='' disabled>
                    Select one...
                  </option>
                  <option value='1-50'>1-50</option>
                  <option value='50-100'>50-100</option>
                  <option value='501+'>501+</option>
                </select>
              </label>

              <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                <span>Message *</span>
                <textarea
                  name='message'
                  placeholder='Send us a note here....'
                  required
                  rows={6}
                  className='min-h-[160px] rounded-none border border-brand-border bg-transparent px-4 py-3 text-base text-brand-fg outline-none transition-colors placeholder:text-brand-muted focus:border-brand-fg'
                />
              </label>

              <button type='submit' className='btn btn-primary mt-2 rounded-none'>
                Submit
              </button>

              <div className='hidden' aria-hidden='true'>
                <p>Thank you!</p>
                <p>We’ll be in touch soon</p>
                <p>Dismiss</p>
              </div>
              <div className='hidden' aria-hidden='true'>
                <p>Oops! Something went wrong while submitting the form.</p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
