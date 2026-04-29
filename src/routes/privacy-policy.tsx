import Markdown from 'react-markdown';

import { MarketingFooterCta } from '~/components/marketing-footer-cta';
import privacyPolicy from '~/legal/privacy-policy.md?raw';

import type { Route } from './+types/privacy-policy';

const legalHeadingClass = 'font-medium leading-[1.15] tracking-[-0.02em] text-brand-fg';
const legalDescription =
  'Learn how OpenHands and All Hands AI collect, use, and protect personal information across our website and services.';
const socialImage =
  'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png';

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
    <>
      <main className='px-6 pb-20 pt-12 text-brand-fg lg:px-10 lg:pt-16'>
        <div className='mx-auto max-w-[720px]'>
          <Markdown
            components={{
              h1: ({ children }) => (
                <h1 className={`${legalHeadingClass} mb-3 text-center text-[28px] lg:text-[32px]`}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className={`${legalHeadingClass} mt-7 text-[20px] leading-[22px] lg:text-[22px]`}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className={`${legalHeadingClass} mt-[18px] text-[16px]`}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className='mb-[14px] text-[14px] leading-[1.55] text-brand-fg/90'>{children}</p>
              ),
              ul: ({ children }) => (
                <ul className='mb-[14px] ml-5 list-disc space-y-1 text-[14px] leading-[1.55] text-brand-fg/90'>
                  {children}
                </ul>
              ),
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong className='font-semibold text-brand-fg'>{children}</strong>,
              a: ({ children, href }) => {
                const isHttpLink = href?.startsWith('http');

                return (
                  <a
                    href={href}
                    target={isHttpLink ? '_blank' : undefined}
                    rel={isHttpLink ? 'noreferrer noopener' : undefined}
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
      </main>
      <MarketingFooterCta />
    </>
  );
}

export default PrivacyPolicy;
