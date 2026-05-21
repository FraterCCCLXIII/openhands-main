import type { CSSProperties, FormEvent } from 'react';
import ASCIIAnimation from '~/components/ascii-animation';
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
  'block w-full rounded-[6.4px] border border-[#5f5f5f] bg-[rgba(255,255,255,0.34)] px-3 py-2 text-[14px] leading-[20px] text-[#333333] outline-none placeholder:text-[#5f5f5f] align-middle';

const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};

const Contact = () => {
  return (
    <CompanyPageShell>
      <section
        data-wf-el='section-hero'
        className='relative px-6 pb-0 pt-0 lg:px-10'
        style={{ marginTop: '0px', height: '266px', paddingTop: '0px', paddingLeft: '0px', paddingRight: '0px' }}
      >
        <div data-wf-el='asci-wrap' className='pointer-events-auto absolute inset-0 overflow-hidden' style={{ '--ascii-opacity': '0.12', maxHeight: '2400px', textAlign: 'center' } as CSSProperties} aria-hidden='true'>
          <ASCIIAnimation className='h-full w-full' />
        </div>
        <div data-wf-el='hero-content' className='relative flex w-full flex-col items-center justify-center text-center' style={{ height: '266.438px', paddingTop: '56px', paddingBottom: '56px' }}>
          <h1 className='h1-flow-root max-w-[560px] fluid-h1 text-brand-fg'>
            Talk to the OpenHands Team
          </h1>
          <p data-wf-el='paragraph-lg' className='max-w-[560px] fluid-body-lg font-medium text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: '20.8px' }}>
            Get a custom demo and explore pricing, private deployments, and white-glove training, support and services for your org
          </p>
        </div>
      </section>

      <section
        data-wf-el='section'
        className='px-6 pb-16 pt-0 lg:px-10 lg:pb-20'
        style={{ position: 'relative', marginTop: '0px', height: '821.359px', paddingTop: '80px', paddingLeft: '0px', paddingRight: '0px' }}
      >
        <div data-wf-el='container' className='mx-auto max-w-[1238px]' style={{ marginTop: '49.6px' }}>
          <div style={{ display: 'flex', margin: '0px', width: '1238px', height: '611.766px', rowGap: '40px' }}>
            <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '619px', maxWidth: '50%', paddingLeft: '20px', paddingRight: '20px' }}>
              <div className='fluid-h3 text-center text-brand-fg' style={{ marginBottom: '9.6px' }}>
                Why enterprises <br />choose OpenHands
              </div>

              {CONTACT_FEATURES.map((feature, index) => (
                <div key={feature} style={{ display: 'flex', marginTop: '24px', marginBottom: index === CONTACT_FEATURES.length - 1 ? '8px' : '0px', marginLeft: '-4px', marginRight: '-4px', width: '587px', height: '28px', rowGap: '8px' }}>
                  <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '28px', height: '28px', paddingLeft: '4px', paddingRight: '4px' }}>
                    <img data-wf-el='icon-media' src={CHECK_ICON} alt='' className='h-5 w-5' style={{ marginTop: '0px' }} />
                  </div>
                  <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '559px', height: '28px', paddingLeft: '4px', paddingRight: '4px' }}>
                    <p data-wf-el='paragraph-md' className='font-sohne-buch text-[20px] leading-[28px] text-[#5f5f5f]' style={{ marginTop: '0px', marginBottom: '0px' }}>{feature}</p>
                  </div>
                </div>
              ))}

              <div className='font-medium text-brand-fg' style={{ marginTop: '74.4px', marginBottom: '9.6px', fontSize: '24px', lineHeight: '33.6px', letterSpacing: 'normal' }}>
                Trusted by engineers at
              </div>

              <div style={{ display: 'flex', width: '619px', height: '74.7344px', marginLeft: '-20px', marginRight: '-20px', rowGap: '40px' }}>
                <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '619px', paddingLeft: '20px', paddingRight: '20px' }}>
                  <div data-wf-el='eyebrow-slider' className='eyebrow-slider w-dyn-list' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', width: '579px', height: '74.7344px', paddingTop: '20px', paddingBottom: '20px' }}>
                    <div role='list' className='track contact-logo-track w-dyn-items' style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '16px', width: '1840px', height: '34.7344px', transform: 'translateX(0px)' }}>
                      {CUSTOMER_LOGOS.map((logo) => (
                        <div data-wf-el='track-item' role='listitem' key={logo} className='track-item w-dyn-item' style={{ flex: '0 0 100px', width: '100px', minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div data-wf-el='standard-media' className='standard-media contain-center inline-block' style={{ display: 'block', justifyContent: 'center', alignItems: 'center', objectFit: 'contain' }}>
                            <img data-wf-el='standard-media-img' src={logo} alt='' className='standard-media-img' style={{ maxWidth: '100px', width: 'auto', height: 'auto', verticalAlign: 'middle', objectFit: 'scale-down', borderStyle: 'none' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '619px', paddingLeft: '20px', paddingRight: '20px' }}>
              <div data-wf-el='card' style={{ display: 'flex', position: 'relative', flexDirection: 'column', justifyContent: 'flex-start', overflow: 'hidden', width: '579px', height: '611.766px', border: '1px solid rgb(34, 21, 13)', borderRadius: '8px' }}>
                <div data-wf-el='card-body' style={{ display: 'block', position: 'relative', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', width: '577px', height: '609.766px', padding: '24px' }}>
                  <div data-wf-el='form-block' className='w-form' style={{ display: 'block', width: '529px', marginBottom: '15px' }}>
                    <form data-wf-el='form-block--form' onSubmit={handleSubmit} style={{ display: 'block', width: '529px', marginTop: '24px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', margin: '0px -12px', rowGap: '24px', width: '553px' }}>
                    <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '276.5px', paddingLeft: '12px', paddingRight: '12px' }}>
                      <div>
                        <p data-wf-el='paragraph-sm' className={fieldLabelClass}>First Name *</p>
                        <input data-wf-el='text-field' id='firstname' type='text' name='firstname' placeholder='James' required className={`${textFieldClass} field-input`} />
                      </div>
                      <div>
                        <p data-wf-el='paragraph-sm' className={fieldLabelClass}>Company email *</p>
                        <input data-wf-el='text-field' id='Email' type='email' name='Email' placeholder='email@company.com' required className={`${textFieldClass} field-input field-input--last`} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '276.5px', paddingLeft: '12px', paddingRight: '12px' }}>
                      <div>
                        <p data-wf-el='paragraph-sm' className={fieldLabelClass}>Last name *</p>
                        <input data-wf-el='text-field' id='lastname' type='text' name='lastname' placeholder='Smith' required className={`${textFieldClass} field-input`} />
                      </div>
                      <div>
                        <p data-wf-el='paragraph-sm' className={fieldLabelClass}>Company name *</p>
                        <input data-wf-el='text-field' id='company' type='text' name='company' placeholder='Acme' required className={`${textFieldClass} field-input field-input--last`} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '553px', maxWidth: '100%', paddingLeft: '12px', paddingRight: '12px' }}>
                      <p data-wf-el='paragraph-sm' className={fieldLabelClass}>Engineering team size*</p>
                      <select data-wf-el='select-field' id='Engineering-size' name='Engineering-size' defaultValue='' required className={`${textFieldClass} contact-select-field field-input field-input--last`} style={{ height: '38px', lineHeight: '20px' }}>
                        <option value=''>Select one...</option>
                        <option value='51-500'>1-50</option>
                        <option value='50-100'>50-100</option>
                        <option value='501+'>501+</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '553px', paddingLeft: '12px', paddingRight: '12px' }}>
                      <p data-wf-el='paragraph-sm' className={fieldLabelClass}>Message *</p>
                      <textarea
                        data-wf-el='text-area'
                        id='Message-comments'
                        name='Message-comments'
                        placeholder='Send us a note here....'
                        required
                        className={`${textFieldClass} resize-y`}
                        style={{ height: '120px', minHeight: '120px', marginTop: '0px', marginBottom: '10px' }}
                      />
                    </div>
                  </div>

                  <input data-wf-el='button' type='submit' value='Submit' className='btn-primary w-fit field-submit' style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '6.4px', borderRadius: '8px', padding: '14.4px 30.4px', fontSize: '16px', fontWeight: 500, lineHeight: '20.8px', cursor: 'pointer', border: '1px solid transparent', marginTop: '24px', marginBottom: '10px', boxShadow: 'rgba(0,0,0,0) 0px 0px 0px 0px inset' }} />

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
          </div>
        </div>
      </section>
    </CompanyPageShell>
  );
};

export default Contact;
