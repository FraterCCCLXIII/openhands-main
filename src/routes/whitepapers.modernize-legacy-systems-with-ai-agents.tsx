import { type FormEvent, useState } from 'react';
import { Link, type MetaFunction } from 'react-router';
import { ProductPageFooterCta } from '~/components/product-feature-page';

const WHITEPAPER_TITLE = 'Modernize Legacy Systems with AI Agents | OpenHands Whitepaper';
const WHITEPAPER_DESCRIPTION =
  '74% of legacy modernization projects fail. Learn how OpenHands uses AI agents and dependency-aware orchestration to safely migrate COBOL and large codebases at enterprise scale. Download the whitepaper and apply for the Q2 2026 PoC.';
const WHITEPAPER_PDF_URL =
  'https://cdn.prod.website-files.com/68ff4057b35616cdd47d5ac7/69d3bc19b5bb78ea951cc08c_openhands-whitepaper.pdf';

const WHITEPAPER_LEARNINGS = [
  'Why 74% of modernization projects fail (and what’s actually missing)',
  'How dependency-aware orchestration unlocks safe parallel refactoring',
  'How AI agents bridge the legacy + modern expertise gap',
  'Architecture of the OpenHands Large Codebase SDK',
  'Real-world workflows for migrating COBOL and large systems',
  'How to evaluate if your system is a fit',
] as const;

const TEAM_SIZE_OPTIONS = ['1-50', '50-500', '500+'] as const;

export const meta: MetaFunction = ({ location }) => [
  { title: WHITEPAPER_TITLE },
  { name: 'description', content: WHITEPAPER_DESCRIPTION },
  { property: 'og:title', content: WHITEPAPER_TITLE },
  { property: 'og:description', content: WHITEPAPER_DESCRIPTION },
  {
    property: 'og:image',
    content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
  },
  { property: 'og:url', content: `https://openhands.dev${location.pathname}` },
  { property: 'og:type', content: 'website' },
  { property: 'og:site_name', content: 'OpenHands' },
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:title', content: WHITEPAPER_TITLE },
  { name: 'twitter:description', content: WHITEPAPER_DESCRIPTION },
  {
    name: 'twitter:image',
    content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
  },
  { rel: 'canonical', href: `https://openhands.dev${location.pathname}` },
];

export default function WhitepaperModernizeLegacySystemsWithAiAgents() {
  const [isDownloadReady, setIsDownloadReady] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsDownloadReady(true);
  };

  return (
    <main className='bg-brand-bg pt-[100px]'>
      <section className='px-6 pb-16 pt-10 lg:px-10 lg:pb-20 lg:pt-14'>
        <div className='mx-auto max-w-[1260px]'>
          <div className='mx-auto max-w-[920px] text-center'>
            <h1 className='text-[40px] font-medium leading-[1.02] tracking-[-0.04em] text-brand-fg lg:text-[60px]'>
              Whitepaper: Modernize legacy systems before your expertise disappears
            </h1>
            <p className='mx-auto mt-4 max-w-[820px] text-[18px] leading-[1.45] text-brand-fg/70 lg:text-[20px]'>
              Legacy modernization projects fail 74% of the time and the engineers who understand your COBOL, mainframe, and legacy systems are retiring faster than you can replace them.
            </p>
          </div>

          <div className='mt-14 grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start'>
            <div>
              <p className='max-w-[700px] text-[18px] font-medium leading-[1.6] text-brand-fg'>
                The Large Codebase SDK from OpenHands fills that gap. By combining AI coding agents with static analysis, it maps the full dependency structure of your codebase and orchestrates migration work in the right order so agents can run in parallel without producing conflicting changes, making enterprise-scale refactors practical for the first time. Model-agnostic and deployable on-prem or in the cloud, it&apos;s built for organizations where data sensitivity and regulatory compliance aren&apos;t optional.
              </p>

              <div className='mt-12'>
                <h2 className='text-[28px] font-medium leading-[1.18] tracking-[-0.03em] text-brand-fg lg:text-[32px]'>
                  What you&apos;ll learn in the whitepaper:
                </h2>
                <div className='mt-8 border-t border-brand-fg/15'>
                  {WHITEPAPER_LEARNINGS.map((item) => (
                    <div key={item} className='border-b border-brand-fg/15 py-5'>
                      <p className='text-[18px] leading-[1.45] text-brand-fg/72'>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='rounded-[12px] border border-brand-fg/20 bg-brand-bg/60 p-6 shadow-[0_20px_60px_rgba(34,21,13,0.05)] backdrop-blur-sm lg:p-8'>
              <h2 className='max-w-[600px] text-[32px] font-medium leading-[1.18] tracking-[-0.03em] text-brand-fg'>
                Download the whitepaper to learn how it works and to apply for our Q2 2026 Proof-of-Concept program.
              </h2>

              <form className='mt-10 space-y-5' onSubmit={handleSubmit}>
                <div className='grid gap-5 md:grid-cols-2'>
                  <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                    <span>First Name*</span>
                    <input
                      type='text'
                      name='firstname'
                      required
                      className='rounded-none border border-brand-fg/25 bg-white/60 px-4 py-3 text-base text-brand-fg outline-none transition-colors focus:border-brand-fg'
                    />
                  </label>
                  <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                    <span>Last Name*</span>
                    <input
                      type='text'
                      name='lastname'
                      required
                      className='rounded-none border border-brand-fg/25 bg-white/60 px-4 py-3 text-base text-brand-fg outline-none transition-colors focus:border-brand-fg'
                    />
                  </label>
                  <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                    <span>Company Email*</span>
                    <input
                      type='email'
                      name='email'
                      required
                      className='rounded-none border border-brand-fg/25 bg-white/60 px-4 py-3 text-base text-brand-fg outline-none transition-colors focus:border-brand-fg'
                    />
                  </label>
                  <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                    <span>Role Title*</span>
                    <input
                      type='text'
                      name='jobtitle'
                      required
                      className='rounded-none border border-brand-fg/25 bg-white/60 px-4 py-3 text-base text-brand-fg outline-none transition-colors focus:border-brand-fg'
                    />
                  </label>
                  <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                    <span>Company Name*</span>
                    <input
                      type='text'
                      name='company'
                      required
                      className='rounded-none border border-brand-fg/25 bg-white/60 px-4 py-3 text-base text-brand-fg outline-none transition-colors focus:border-brand-fg'
                    />
                  </label>
                  <label className='flex flex-col gap-2 text-sm font-medium text-brand-fg'>
                    <span>Engineering Team Size*</span>
                    <select
                      name='engineering_team_size'
                      defaultValue=''
                      required
                      className='rounded-none border border-brand-fg/25 bg-white/60 px-4 py-3 text-base text-brand-fg outline-none transition-colors focus:border-brand-fg'
                    >
                      <option value='' disabled>
                        Select one...
                      </option>
                      {TEAM_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className='pt-2'>
                  <button type='submit' className='btn btn-primary rounded-none'>
                    Download Whitepaper
                  </button>
                </div>

                {isDownloadReady ? (
                  <div role='status' className='rounded-[8px] border border-brand-fg/15 bg-white/75 p-4 text-brand-fg'>
                    <p className='text-base font-medium'>Your whitepaper is ready.</p>
                    <p className='mt-1 text-sm leading-[1.6] text-brand-fg/75'>
                      Download the PDF now, then contact our team if you&apos;d like to apply for the Q2 2026 Proof-of-Concept program.
                    </p>
                    <div className='mt-4 flex flex-wrap gap-3'>
                      <a
                        href={WHITEPAPER_PDF_URL}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='btn btn-primary rounded-none'
                      >
                        Download now
                      </a>
                      <Link to='/contact' className='btn btn-outline rounded-none'>
                        Talk to the team
                      </Link>
                    </div>
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </section>

      <ProductPageFooterCta
        title='Bring your team into the loop.'
        description='Use the OpenHands Web GUI to collaborate with agents.'
        actions={[
          { label: 'Try it live', href: 'https://app.all-hands.dev/' },
          {
            label: 'Download Local GUI',
            href: 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup',
            variant: 'outline',
          },
        ]}
      />
    </main>
  );
}
