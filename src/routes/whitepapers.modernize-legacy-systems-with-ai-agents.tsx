import { useEffect, useState } from 'react';
import { type MetaFunction } from 'react-router';
import { Footer } from '~/components/footer';

const WHITEPAPER_TITLE = 'Modernize Legacy Systems with AI Agents | OpenHands Whitepaper';
const WHITEPAPER_DESCRIPTION =
  '74% of legacy modernization projects fail. Learn how OpenHands uses AI agents and dependency-aware orchestration to safely migrate COBOL and large codebases at enterprise scale. Download the whitepaper and apply for the Q2 2026 PoC.';
const WHITEPAPER_PDF_URL =
  '/assets/webflow/whitepapers/openhands-whitepaper.pdf';
const WHITEPAPER_FORM_SUBMITTED_EVENT = 'openhands:whitepaper-form-submitted';

const WHITEPAPER_LEARNINGS = [
  'Why 74% of modernization projects fail (and what’s actually missing)',
  'How dependency-aware orchestration unlocks safe parallel refactoring',
  'How AI agents bridge the legacy + modern expertise gap',
  'Architecture of the OpenHands Large Codebase SDK',
  'Real-world workflows for migrating COBOL and large systems',
  'How to evaluate if your system is a fit',
] as const;

const HUBSPOT_FORM_FRAME_SRC_DOC = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: transparent;
      color: #212d3a;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 16px;
    }
    form {
      display: grid;
      grid-template-columns: 222px 222px;
      column-gap: 30px;
      row-gap: 20px;
      padding: 40px;
    }
    label {
      display: block;
      margin-bottom: 10px;
      font-size: 16px;
      font-weight: 400;
      line-height: normal;
    }
    input,
    select {
      display: block;
      width: 222px;
      height: 41px;
      border: 1px solid #cbd6e2;
      border-radius: 3px;
      background: #f5f8fa;
      color: #212d3a;
      font: inherit;
      padding: 9px 10px;
    }
    button {
      grid-column: 2;
      justify-self: end;
      width: 248px;
      height: 43px;
      margin-top: 20px;
      border: 0;
      border-radius: 3px;
      background: #ff7a59;
      color: #fff;
      cursor: pointer;
      font-size: 16px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <form>
    <div>
      <label for="firstname">First Name*</label>
      <input id="firstname" name="firstname" type="text" required />
    </div>
    <div>
      <label for="lastname">Last Name*</label>
      <input id="lastname" name="lastname" type="text" required />
    </div>
    <div>
      <label for="email">Company Email*</label>
      <input id="email" name="email" type="email" required />
    </div>
    <div>
      <label for="jobtitle">Role Title*</label>
      <input id="jobtitle" name="jobtitle" type="text" required />
    </div>
    <div>
      <label for="company">Company Name*</label>
      <input id="company" name="company" type="text" required />
    </div>
    <div>
      <label for="engineering-team-size">Engineering Team Size*</label>
      <select id="engineering-team-size" name="engineering_team_size" required>
        <option value=""></option>
        <option value="1-50">1-50</option>
        <option value="50-500">50-500</option>
        <option value="500+">500+</option>
      </select>
    </div>
    <button type="submit">Download Whitepaper</button>
  </form>
  <script>
    document.querySelector('form').addEventListener('submit', function (event) {
      event.preventDefault();
      window.parent.postMessage({ type: '${WHITEPAPER_FORM_SUBMITTED_EVENT}' }, '*');
    });
  </script>
</body>
</html>`;

const isWhitepaperFormSubmittedMessage = (data: unknown) => (
  typeof data === 'object' &&
  data !== null &&
  'type' in data &&
  data.type === WHITEPAPER_FORM_SUBMITTED_EVENT
);

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
  { tagName: 'link', rel: 'canonical', href: `https://openhands.dev${location.pathname}` },
];

export const handle = { hideGlobalFooter: true };

export default function WhitepaperModernizeLegacySystemsWithAiAgents() {
  const [isDownloadReady, setIsDownloadReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (isWhitepaperFormSubmittedMessage(event.data)) {
        setIsDownloadReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <main data-wf-el='page-main' className='page-main' style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 84px)', backgroundColor: 'rgba(0, 0, 0, 0)' }}>
      <section data-wf-el='section' className='section cc-themed' style={{ position: 'relative', padding: '80px 0px', backgroundColor: 'rgb(249, 240, 217)' }}>
        <div data-wf-el='container' className='container' style={{ width: '100%', maxWidth: '1238px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div
            data-wf-el='whitepaper_heading-stack'
            className='whitepaper_heading-stack heading-stack is-center'
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '32px', textAlign: 'center' }}
          >
            <h1 data-wf-el='whitepaper_heading' className='whitepaper_heading h2 fluid-h1 text-brand-fg' style={{ width: '834px', maxWidth: '834px', marginBottom: '8.8px', letterSpacing: '-0.02em', textAlign: 'center' }}>
              Whitepaper: Modernize legacy systems before your expertise disappears
            </h1>
            <p data-wf-el='whitepaper_paragraph' className='whitepaper_paragraph u-text-darkgray font-medium text-[#5f5f5f]' style={{ width: '657px', maxWidth: '657px', marginTop: '0px', marginBottom: '20.8px', fontSize: '20.8px', lineHeight: '24.96px', textAlign: 'center' }}>
              Legacy modernization projects fail 74% of the time and the engineers who understand your COBOL, mainframe, and legacy systems are retiring faster than you can replace them.
            </p>
          </div>

          <div data-wf-el='whitepaper_layout' className='whitepaper_layout' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div data-wf-el='whitepaper_content' className='whitepaper_content' style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '24px', maxWidth: '52ch' }}>
              <p className='text-[16px] leading-[22.4px] text-brand-fg' style={{ marginBottom: '16px' }}>
                The Large Codebase SDK from OpenHands fills that gap. By combining AI coding agents with static analysis, it maps the full dependency structure of your codebase and orchestrates migration work in the right order so agents can run in parallel without producing conflicting changes, making enterprise-scale refactors practical for the first time. Model-agnostic and deployable on-prem or in the cloud, it&apos;s built for organizations where data sensitivity and regulatory compliance aren&apos;t optional.
              </p>

              <div data-wf-el='whitepaper_list_wrap' className='whitepaper_list_wrap'>
                <h3 data-wf-el='whitepaper_list_heading' className='whitepaper_list_heading font-medium text-brand-fg' style={{ marginBottom: '20.8px', fontSize: '20.8px', lineHeight: '24.96px' }}>
                  What you&apos;ll learn in the whitepaper:
                </h3>
                <ul data-wf-el='product-list_ul' className='product-list_ul' style={{ width: '100%', margin: '0px', paddingLeft: '0px' }}>
                  {WHITEPAPER_LEARNINGS.map((item) => (
                    <li key={item} data-wf-el='product-list_element' className='product-list_element u-text-darkgray u-mb-0 list-none text-[16px] leading-[22.4px] text-[#5f5f5f]' style={{ paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(95, 95, 95, 0.5)' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div data-wf-el='card' className='card u-border-dark' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignSelf: 'start', position: 'relative', overflow: 'hidden', border: '1px solid rgb(34, 21, 13)', borderRadius: '8px' }}>
              <div data-wf-el='card-body' className='card-body' style={{ position: 'relative', padding: '24px', flex: '1 1 0%', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                {isDownloadReady ? (
                  <div role='status' className='whitepaper-link' style={{ textAlign: 'center', paddingTop: '16px', paddingBottom: '16px' }}>
                    <h3 className='fluid-h3 text-brand-fg'>Download the Whitepaper</h3>
                    <div className='mt-6 inline-flex rounded-[8px] bg-brand-fg px-5 py-3 text-[16px] font-medium leading-[20.8px] text-brand-bg'>
                      <a
                        href={WHITEPAPER_PDF_URL}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-brand-bg'
                      >
                        Download now
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 data-form='heading' className='h4 fluid-h4 text-brand-fg' style={{ marginBottom: '9.6px' }}>
                      <span style={{ display: 'block', width: '475px', maxWidth: '100%' }}>
                        Download the whitepaper to learn how it works and to apply for our Q2 2026 Proof-of-Concept program.
                      </span>
                    </h2>

                    <iframe
                      title='Download whitepaper form'
                      srcDoc={HUBSPOT_FORM_FRAME_SRC_DOC}
                      sandbox='allow-forms allow-scripts'
                      className='border-0'
                      style={{ display: 'inline', width: '100%', height: '413px', margin: '0px' }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer
        standalone
        showSocialLinks
        compactNav
        webflowLayout
        showCopyright
        marketingCtaTitle='Bring your team into the loop.'
        marketingCtaDescription='Use the OpenHands Web GUI to collaborate with agents.'
        marketingCtaPrimary={{ label: 'Try it live', href: 'https://app.all-hands.dev/' }}
        marketingCtaSecondary={{ label: 'Download Local GUI', href: 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup' }}
      />
    </main>
  );
}
