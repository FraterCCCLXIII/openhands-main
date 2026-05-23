import tosHtml from '~/legal/tos-live.html?raw';
import { createSocialPreviewMeta } from '~/utils/seo';
import type { Route } from './+types/tos';

export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: 'Terms of Service',
    description: 'OpenHands Terms of Service',
    pathname: location.pathname,
    extra: [{ name: 'robots', content: 'noindex, nofollow' }],
  });

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
