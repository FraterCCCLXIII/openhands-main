import Markdown from 'react-markdown';

import privacyPolicy from '~/legal/privacy-policy.md?raw';

import type { Route } from './+types/privacy-policy';

const legalHeadingClass = 'font-medium leading-[1.15] tracking-normal text-brand-fg';
const legalDescription =
  'Learn how OpenHands and All Hands AI collect, use, and protect personal information across our website and services.';
const socialImage =
  'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png';

const shouldKeepPrivacyLink = (href?: string, text = '') => {
  const normalizedText = text.trim().toLowerCase();

  if (!href) {
    return false;
  }

  if (href.startsWith('mailto:')) {
    return false;
  }

  return normalizedText.startsWith('http://') || normalizedText.startsWith('https://');
};

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'Privacy Policy' },
    { name: 'description', content: legalDescription },
    { property: 'og:title', content: 'Privacy Policy' },
    { property: 'og:description', content: legalDescription },
    { property: 'og:image', content: socialImage },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Privacy Policy' },
    { name: 'twitter:description', content: legalDescription },
    { name: 'twitter:image', content: socialImage },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
};

function PrivacyPolicy() {
  return (
    <main data-wf-el='page-main' className='text-brand-fg' style={{ display: 'flex', flexDirection: 'column' }}>
      <section
        data-wf-el='section'
        style={{ display: 'block', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px' }}
      >
        <div data-wf-el='container' className='mx-auto max-w-[900px] px-5 lg:px-0'>
          <Markdown
            components={{
              h1: ({ children }) => (
                <h1 className={`${legalHeadingClass} mt-0 text-center fluid-h3`} style={{ width: '950px', maxWidth: 'calc(100vw - 40px)', lineHeight: '38.4px', marginLeft: '0px', marginRight: '0px', marginBottom: '48px', position: 'relative', left: '-25px' }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className={`${legalHeadingClass} mx-auto mb-2 mt-7 max-w-[900px] text-[20px] leading-[22px]`} style={{ letterSpacing: '-0.4px' }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className={`${legalHeadingClass} mx-auto mb-[6px] mt-[18px] max-w-[900px] text-[16px] leading-[1.2]`}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className='mx-auto mb-[14px] max-w-[900px] text-[14px] leading-[1.6] text-brand-fg'>{children}</p>
              ),
              ul: ({ children }) => (
                <ul className='mb-[14px] ml-5 list-disc p-0 text-[14px] leading-[1.6] text-brand-fg'>
                  {children}
                </ul>
              ),
              li: ({ children }) => <li className='mb-[6px]'>{children}</li>,
              strong: ({ children }) => <strong className='font-semibold text-brand-fg'>{children}</strong>,
              a: ({ children, href }) => {
                const text = Array.isArray(children)
                  ? children
                      .map((child) => (typeof child === 'string' ? child : ''))
                      .join('')
                  : typeof children === 'string'
                    ? children
                    : '';

                if (!shouldKeepPrivacyLink(href, text)) {
                  return <>{children}</>;
                }

                return (
                  <a
                    href={href}
                    target='_blank'
                    rel='noreferrer noopener'
                    className='text-[#8a5f45] underline underline-offset-2 transition-colors hover:text-[#6f4d37]'
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {privacyPolicy}
          </Markdown>
        </div>
      </section>
    </main>
  );
}

export default PrivacyPolicy;
