import tosHtml from '~/legal/tos-live.html?raw';
import type { Route } from './+types/tos';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'Terms of Service' },
    { name: 'description', content: 'OpenHands Terms of Service' },
    { property: 'og:title', content: 'Terms of Service' },
    { property: 'og:description', content: 'OpenHands Terms of Service' },
    { property: 'og:image', content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Terms of Service' },
    { name: 'twitter:description', content: 'OpenHands Terms of Service' },
    { name: 'twitter:image', content: 'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png' },
    { tagName: 'link', rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
};

function TOS() {
  return (
    <main data-wf-el='page-main' className='text-brand-fg' style={{ display: 'flex', flexDirection: 'column' }}>
      <section
        data-wf-el='section'
        style={{ display: 'block', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}
      >
        <style>{`
          .tos-legal h1 { font-size: 28px; margin-top: 0; }
          .tos-legal h2 { font-size: 22px; margin-top: 32px; }
          .tos-legal h3 { font-size: 18px; margin-top: 24px; }
          .tos-legal p { margin-bottom: 16px; }
        `}</style>
        <div data-wf-el='container' className='mx-auto max-w-[900px] px-5 lg:px-0'>
          <h1 className='h3 mb-6 mt-0 text-center text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-brand-fg'>
            Terms of Service
          </h1>
          <div
            className='tos-legal text-[16px] leading-[22.4px] tracking-[-0.015em] text-brand-fg'
            dangerouslySetInnerHTML={{ __html: tosHtml }}
          />
        </div>
      </section>
    </main>
  );
}

export default TOS;
