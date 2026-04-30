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

const CHECK_ICON = 'https://cdn.prod.website-files.com/68ff4057b35616cdd47d5ac7/690cb1513c759a7404df1ba1_check.svg';

const CONTACT_FEATURES = [
  'Containerized sandbox runtime for safe autonomy',
  'Model agnostic - use any LLM provider you want',
  "Self-hosted or private cloud deployments - 'fully air gapped'",
  'Open source and transparent by design',
  'Access to proprietary SDK kits and custom applications',
  'Designated support, training, and services offerings',
] as const;

const CUSTOMER_LOGOS = [
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6915b02ded45d0b434a0974d_flextract.png',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137f6974b71a1a4a932f82_TikTok_logo.svg',
  'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69137f523b08f91a5aa905b9_Vmware.svg',
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
] as const;

const fieldLabelClass = 'text-[14.4px] leading-[21.6px] text-brand-fg';
const textFieldClass =
  'block w-full rounded-[6.4px] border border-[#5f5f5f] bg-white/35 px-3 py-2 text-[14px] leading-[20px] text-[#333333] outline-none placeholder:text-[#5f5f5f]';

const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};

const Contact = () => {
  return (
    <main>
      <section className='px-6 pb-24 pt-12 lg:px-10 lg:pb-24 lg:pt-12'>
        <div className='mx-auto flex max-w-[720px] flex-col items-center text-center'>
          <h1 className='max-w-[560px] text-[37px] font-medium leading-[40.7px] tracking-[-0.03em] text-brand-fg lg:text-[44px] lg:leading-[48.4px]'>
            Talk to the OpenHands Team
          </h1>
          <p className='mt-4 max-w-[560px] text-[20.8px] font-medium leading-[24.96px] text-[#5f5f5f]'>
            Get a custom demo and explore pricing, private deployments, and white-glove training, support and services for your org
          </p>
        </div>
      </section>

      <section className='px-6 pb-16 pt-12 lg:px-10 lg:pb-24 lg:pt-16'>
        <div className='mx-auto max-w-[1238px]'>
          <div className='grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start'>
            <div>
              <div className='text-[28px] font-medium leading-[33.6px] tracking-[-0.02em] text-brand-fg lg:text-[32px] lg:leading-[38.4px]'>
                Why enterprises <br />choose OpenHands
              </div>

              <div className='mt-6 space-y-4'>
                {CONTACT_FEATURES.map((feature) => (
                  <div key={feature} className='grid grid-cols-[20px_1fr] items-start gap-3'>
                    <img src={CHECK_ICON} alt='' className='mt-1 h-5 w-5' />
                    <p className='m-0 text-[16px] leading-[22.4px] text-[#5f5f5f]'>{feature}</p>
                  </div>
                ))}
              </div>

              <div className='mt-8 text-[22px] font-medium leading-[28px] tracking-[-0.02em] text-brand-fg'>
                Trusted by engineers at
              </div>

              <div className='mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
                {CUSTOMER_LOGOS.map((logo) => (
                  <div key={logo} className='flex min-h-[56px] items-center justify-center'>
                    <img src={logo} alt='' className='max-h-[32px] w-auto max-w-full object-contain' />
                  </div>
                ))}
              </div>
            </div>

            <div className='rounded-[8px] border border-brand-fg/25 bg-transparent p-6 lg:p-8'>
              <form className='space-y-5' onSubmit={handleSubmit}>
                <div className='grid gap-5 md:grid-cols-2'>
                  <div className='space-y-5'>
                    <div className='space-y-1'>
                      <p className={fieldLabelClass}>First Name *</p>
                      <input type='text' name='firstname' placeholder='James' required className={textFieldClass} />
                    </div>
                    <div className='space-y-1'>
                      <p className={fieldLabelClass}>Company email *</p>
                      <input type='email' name='Email' placeholder='email@company.com' required className={textFieldClass} />
                    </div>
                  </div>

                  <div className='space-y-5'>
                    <div className='space-y-1'>
                      <p className={fieldLabelClass}>Last name *</p>
                      <input type='text' name='lastname' placeholder='Smith' required className={textFieldClass} />
                    </div>
                    <div className='space-y-1'>
                      <p className={fieldLabelClass}>Company name *</p>
                      <input type='text' name='company' placeholder='Acme' required className={textFieldClass} />
                    </div>
                  </div>
                </div>

                <div className='space-y-1'>
                  <p className={fieldLabelClass}>Engineering team size*</p>
                  <select name='Engineering-size' defaultValue='' required className={textFieldClass}>
                    <option value=''>Select one...</option>
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

                <div className='hidden'>
                  <p>Thank you!</p>
                  <p>We’ll be in touch soon</p>
                  <a href='#'>Dismiss</a>
                </div>
                <div className='hidden'>
                  <p>Oops! Something went wrong while submitting the form.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
