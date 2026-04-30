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

const fieldLabelClass = 'text-[14.4px] leading-[21.6px] text-brand-fg';
const textFieldClass =
  'block w-full rounded-[6.4px] border border-[#5f5f5f] bg-white/35 px-3 py-2 text-[14px] leading-[20px] text-[#333333] outline-none placeholder:text-[#5f5f5f]';

const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};

const Contact = () => {
  return (
    <main className='pt-[100px]'>
      <section className='px-6 pt-16 lg:px-10 lg:pt-24'>
        <div className='mx-auto flex max-w-[720px] flex-col items-center text-center'>
          <h1 className='max-w-[560px] text-[37px] font-medium leading-[40.7px] tracking-[-0.03em] text-brand-fg lg:text-[44px] lg:leading-[48.4px]'>
            Talk to the OpenHands Team
          </h1>
          <p className='mt-4 max-w-[700px] text-[20.8px] font-medium leading-[24.96px] text-[#5f5f5f]'>
            Get a custom demo and explore pricing, private deployments, and white-glove training, support and services for your org
          </p>
        </div>
      </section>

      <section className='px-6 pb-16 pt-12 lg:px-10 lg:pb-24 lg:pt-16'>
        <div className='mx-auto flex max-w-[1238px] flex-col gap-10 lg:flex-row lg:items-start lg:gap-10'>
          <div className='lg:w-1/2'>
            <div className='grid gap-2'>
              {CONTACT_FEATURES.map((feature) => (
                <p key={feature} className='text-[20px] leading-[28px] text-[#5f5f5f]'>
                  {feature}
                </p>
              ))}
            </div>
          </div>

          <div className='lg:w-1/2'>
            <form className='space-y-5' onSubmit={handleSubmit}>
              <div className='grid gap-5 md:grid-cols-2'>
                <div className='space-y-1'>
                  <p className={fieldLabelClass}>First Name *</p>
                  <input
                    type='text'
                    name='firstname'
                    placeholder='James'
                    required
                    className={textFieldClass}
                  />
                </div>
                <div className='space-y-1'>
                  <p className={fieldLabelClass}>Company email *</p>
                  <input
                    type='email'
                    name='Email'
                    placeholder='email@company.com'
                    required
                    className={textFieldClass}
                  />
                </div>
                <div className='space-y-1'>
                  <p className={fieldLabelClass}>Last name *</p>
                  <input
                    type='text'
                    name='lastname'
                    placeholder='Smith'
                    required
                    className={textFieldClass}
                  />
                </div>
                <div className='space-y-1'>
                  <p className={fieldLabelClass}>Company name *</p>
                  <input
                    type='text'
                    name='company'
                    placeholder='Acme'
                    required
                    className={textFieldClass}
                  />
                </div>
              </div>

              <div className='space-y-1'>
                <p className={fieldLabelClass}>Engineering team size*</p>
                <select name='Engineering-size' defaultValue='' required className={textFieldClass}>
                  <option value='' disabled>
                    Select one...
                  </option>
                  <option value='51-500'>1-50</option>
                  <option value='50-100'>50-100</option>
                  <option value='501+'>501+</option>
                </select>
              </div>

              <div className='space-y-1'>
                <p className={fieldLabelClass}>Message *</p>
                <textarea
                  name='Message-comments'
                  placeholder='Send us a note here....'
                  required
                  rows={6}
                  className={`${textFieldClass} min-h-[160px] resize-y`}
                />
              </div>

              <input type='submit' value='Submit' className='btn btn-primary mt-2 w-fit' />

              <div className='hidden' aria-hidden='true'>
                <p>Thank you!</p>
                <p>We’ll be in touch soon</p>
                <a href='#'>Dismiss</a>
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
