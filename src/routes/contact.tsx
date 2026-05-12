import type { FormEvent } from 'react';
import { CompanyPageShell } from '~/components/company-page-shell';
import type { Route } from './+types/contact';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'Get in Touch | OpenHands Sales & Support' },
    {
      name: 'description',
      content:
        "Connect with the OpenHands team to explore cloud coding agents, enterprise deployments, support, or partnerships. We're here to help.",
    },
    { property: 'og:title', content: 'Get in Touch | OpenHands Sales & Support' },
    {
      property: 'og:description',
      content:
        "Connect with the OpenHands team to explore cloud coding agents, enterprise deployments, support, or partnerships. We're here to help.",
    },
    {
      property: 'og:image',
      content:
        'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Get in Touch | OpenHands Sales & Support' },
    {
      name: 'twitter:description',
      content:
        "Connect with the OpenHands team to explore cloud coding agents, enterprise deployments, support, or partnerships. We're here to help.",
    },
    {
      name: 'twitter:image',
      content:
        'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const CHECK_ICON =
  '/assets/webflow/icons/690cb1513c759a7404df1ba1_check.svg';

const CONTACT_FEATURES = [
  'Containerized sandbox runtime for safe autonomy',
  'Model agnostic - use any LLM provider you want',
  "Self-hosted or private cloud deployments - 'fully air gapped'",
  'Open source and transparent by design',
  'Access to proprietary SDK kits and custom applications',
  'Designated support, training, and services offerings',
] as const;

const CUSTOMER_LOGOS = [
  '/assets/webflow/logos/6915b02ded45d0b434a0974d_flextract.png',
  '/assets/webflow/logos/69137f6974b71a1a4a932f82_TikTok_logo.svg',
  '/assets/webflow/logos/69137f523b08f91a5aa905b9_Vmware.svg',
  '/assets/webflow/logos/69137f2cb537758796a9dba1_Roche_Logo.svg',
  '/assets/webflow/logos/69137f10c3975e28b3932320_Amazon_logo1.svg',
  '/assets/webflow/misc/69137efe8466ac374a9bc8a1_idlJcLIGV__17611861580951.svg',
  '/assets/webflow/misc/69137eedd7c29cc9046de43f_Group.svg',
  '/assets/webflow/logos/69137ec5a6f77dd174e557ce_C3ai_logo1.svg',
  '/assets/webflow/logos/69137eac8f27ca27f5e48420_Netflix_2015_logo1.svg',
  '/assets/webflow/misc/69137e8df2c028b9e1506ede_mastercard1.svg',
  '/assets/webflow/logos/69137e783790933dd06f9d59_Red_Hat_Logo_20191.svg',
  '/assets/webflow/logos/69137e5fa006d963a1d1904d_mongodb-ar211.svg',
  '/assets/webflow/logos/69137e47b45195da10c50f49_apple-111.svg',
  '/assets/webflow/logos/69137e34e3a5ab71e37082a7_NVIDIA_logo1.svg',
  '/assets/webflow/logos/69137e199ce2cb594b0210ab_google-ar211.svg',
  '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg',
] as const;

// Live's contact form labels use the lighter `Sohne Buch` (Webflow's
// default body font), not the page-wide `Sohne Kraftig` we inherit.
// Without `font-sohne-buch` here the parity audit flagged 12 form-
// label fontFamily mismatches.
// Live's Webflow form field labels are `<p>` with mb=7.2 (≈ 0.5em
// of 14.4) — restore via a class default so the parent's `space-y-1`
// (4px gap → 4px mt on input) can be dropped per-field.
const fieldLabelClass = 'font-sohne-buch text-[14.4px] leading-[21.6px] text-brand-fg field-label';
const textFieldClass =
  'block w-full rounded-[6.4px] border border-[#5f5f5f] bg-white/35 px-3 py-2 text-[14px] leading-[20px] text-[#333333] outline-none placeholder:text-[#5f5f5f] align-middle';

const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};

const Contact = () => {
  return (
    <CompanyPageShell>
      <section
        data-wf-el='section-hero'
        className='px-6 pb-0 pt-0 lg:px-10'
        style={{ marginTop: '0px', height: '266px', paddingTop: '0px', paddingLeft: '0px', paddingRight: '0px' }}
      >
        <div className='mx-auto flex max-w-[720px] flex-col items-center text-center' style={{ paddingTop: '56px' }}>
          <h1 className='h1-flow-root max-w-[560px] fluid-h1 text-brand-fg'>
            Talk to the OpenHands Team
          </h1>
          <p className='max-w-[560px] fluid-body-lg font-medium text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: '20.8px' }}>
            Get a custom demo and explore pricing, private deployments, and white-glove training, support and services for your org
          </p>
        </div>
      </section>

      <section
        data-wf-el='section'
        className='px-6 pb-16 pt-0 lg:px-10 lg:pb-20'
        style={{ marginTop: '0px', height: '821.359px', paddingTop: '80px', paddingLeft: '0px', paddingRight: '0px' }}
      >
        <div className='mx-auto max-w-[1238px]' style={{ marginTop: '50px' }}>
          <div className='grid gap-0 lg:grid-cols-2 lg:items-start'>
            <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
              <div className='fluid-h3 text-brand-fg'>
                Why enterprises <br />choose OpenHands
              </div>

              <div className='mt-6 space-y-6'>
                {CONTACT_FEATURES.map((feature) => (
                  <div key={feature} className='grid grid-cols-[20px_1fr] items-start gap-3'>
                    {/* Live's check icon has margin: 0; we previously used
                        `mt-1` (4px), giving 6 IMG marginTop mismatches. */}
                    <img src={CHECK_ICON} alt='' className='h-5 w-5' style={{ marginTop: '0px' }} />
                    {/* Live's enterprise feature paragraphs use Sohne Buch
                        (the body font) at 20px; the inherited Sohne Kraftig
                        was flagged in 6 fontFamily mismatches.  Margin:0
                        keeps the live `u-m-0` analog. */}
                    <p className='font-sohne-buch text-[20px] leading-[28px] text-[#5f5f5f]' style={{ marginTop: '0px', marginBottom: '0px' }}>{feature}</p>
                  </div>
                ))}
              </div>

              <div className='font-medium tracking-[-0.02em] text-brand-fg' style={{ marginTop: '76px', fontSize: '24px', lineHeight: '33.6px' }}>
                Trusted by engineers at
              </div>

              <div className='eyebrow-slider w-dyn-list' style={{ marginTop: '10.4px', overflow: 'hidden', width: '579px', height: '75px' }}>
                <div role='list' className='track w-dyn-items' style={{ display: 'flex', alignItems: 'center', width: '1840px', height: '35px', transform: 'translateX(-652px)', marginTop: '20px' }}>
                  {CUSTOMER_LOGOS.map((logo) => (
                    <div role='listitem' key={logo} className='track-item w-dyn-item' style={{ flex: '0 0 115px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className='standard-media contain-center inline-block' style={{ display: 'inline-block' }}>
                        <img src={logo} alt='' className='standard-media-img' style={{ maxWidth: '100px', maxHeight: '35px', width: 'auto', height: 'auto', verticalAlign: 'middle', objectFit: 'scale-down' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
              <div className='rounded-[8px] border border-brand-fg/25 bg-transparent' style={{ padding: '24px' }}>
                <form className='space-y-5' onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
                {/* Live wraps each field in a Webflow row that resolves
                    to label-with-mb-7.2 + input-with-mb-21 (and no
                    inter-element gap from a space-y wrapper). */}
                <div className='grid gap-5 md:grid-cols-2'>
                  <div>
                    <div>
                      <p className={fieldLabelClass}>First Name *</p>
                      <input type='text' name='firstname' placeholder='James' required className={`${textFieldClass} field-input`} />
                    </div>
                    <div>
                      <p className={fieldLabelClass}>Company email *</p>
                      <input type='email' name='Email' placeholder='email@company.com' required className={`${textFieldClass} field-input field-input--last`} />
                    </div>
                  </div>

                  <div>
                    <div>
                      <p className={fieldLabelClass}>Last name *</p>
                      <input type='text' name='lastname' placeholder='Smith' required className={`${textFieldClass} field-input`} />
                    </div>
                    <div>
                      <p className={fieldLabelClass}>Company name *</p>
                      <input type='text' name='company' placeholder='Acme' required className={`${textFieldClass} field-input field-input--last`} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className={fieldLabelClass}>Engineering team size*</p>
                  <select name='Engineering-size' defaultValue='' required className={`${textFieldClass} field-input field-input--last`}>
                    <option value=''>Select one...</option>
                    <option value='51-500'>1-50</option>
                    <option value='50-100'>50-100</option>
                    <option value='501+'>501+</option>
                  </select>
                </div>

                <div>
                  <p className={fieldLabelClass}>Message *</p>
                  <textarea
                    name='Message-comments'
                    placeholder='Send us a note here....'
                    required
                    rows={6}
                    className={`${textFieldClass} field-input field-input--last min-h-[160px] resize-y`}
                  />
                </div>

                <input type='submit' value='Submit' className='btn-primary w-fit field-submit' style={{ position: 'relative', display: 'inline-flex', borderRadius: '8px', padding: '14.4px 30.4px', fontSize: '16px', fontWeight: 500, lineHeight: 1.3, cursor: 'pointer', border: '1px solid transparent', marginTop: '24px', marginBottom: '10px', boxShadow: 'rgba(0,0,0,0) 0px 0px 0px 0px inset' }} />

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
        </div>
      </section>
    </CompanyPageShell>
  );
};

export default Contact;
