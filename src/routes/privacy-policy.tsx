import Markdown from 'react-markdown';
import type { ReactNode } from 'react';

import privacyPolicy from '~/legal/privacy-policy.md?raw';

import type { Route } from './+types/privacy-policy';

const legalHeadingClass = 'font-medium leading-[1.15] tracking-normal text-brand-fg';
const legalDescription = 'OpenHands Privacy Policy';
const socialImage =
  'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png';
const privacyBody = privacyPolicy.replace(/^# Privacy Policy\s*/, '');

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

const getNodeText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }

  if (node && typeof node === 'object' && 'props' in node) {
    return getNodeText((node as { props?: { children?: ReactNode } }).props?.children);
  }

  return '';
};

const getPrivacyListItemStyle = (children: ReactNode) => {
  const text = getNodeText(children);

  if (text.startsWith('Marketing information,')) {
    return { maxWidth: '856px' };
  }

  if (text.startsWith('Communicate with you about our Services,')) {
    return { maxWidth: '787px' };
  }

  return undefined;
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
        style={{
          display: 'block',
          paddingTop: '80px',
          paddingBottom: '80px',
          paddingLeft: '0px',
          paddingRight: '0px',
          position: 'relative',
        }}
      >
        <div data-wf-el='container' className='mx-auto w-full max-w-[950.08px]'>
          <h1
            className={`${legalHeadingClass} mt-0 text-center fluid-h3`}
            style={{ lineHeight: '38.4px', marginBottom: '48px', position: 'relative' }}
          >
            Privacy Policy
          </h1>
          <div data-wf-el='ah-legal' className='ah-legal w-richtext mx-auto max-w-[900px] text-[14px] leading-[1.6] text-brand-fg'>
            <Markdown
              components={{
              h1: () => null,
              h2: ({ children }) => (
                <h2 className={`${legalHeadingClass} mb-2 mt-7 text-[20px] leading-[22px]`} style={{ letterSpacing: '-0.4px' }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className={`${legalHeadingClass} mb-[6px] mt-[18px] text-[16px] leading-[1.2]`}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className='mb-[14px] text-[14px] leading-[1.6] text-brand-fg'>{children}</p>
              ),
              ul: ({ children }) => (
                <ul role='list' className='mb-[14px] ml-5 list-disc p-0 pb-[6px] text-[14px] leading-[1.6] text-brand-fg [&>li:last-child]:mb-0'>
                  {children}
                </ul>
              ),
              li: ({ children }) => <li className='mb-[6px]' style={getPrivacyListItemStyle(children)}>{children}</li>,
              strong: ({ children }) => <strong className='font-bold text-black'>{children}</strong>,
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
                  <a href={href} className='text-brand-fg underline decoration-[1.4px] underline-offset-[1.4px]'>
                    {children}
                  </a>
                );
              },
            }}
          >
            {privacyBody}
          </Markdown>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PrivacyPolicy;
