import type { MetaFunction } from 'react-router';
import { ProductCanvasArchivedSections } from '~/components/product-canvas-archived-sections';

export const meta: MetaFunction = () => [
  { title: 'Internal Component Examples | OpenHands' },
  { name: 'description', content: 'Internal archive of removed marketing section examples. Not linked from site navigation.' },
  { name: 'robots', content: 'noindex, nofollow' },
];

export default function InternalComponentExamplesRoute() {
  return (
    <main data-wf-el='page-main' className='internal-component-examples-page'>
      <section
        data-wf-el='section'
        style={{
          display: 'block',
          backgroundColor: 'rgb(247, 243, 238)',
          paddingTop: '80px',
          paddingBottom: '40px',
          paddingLeft: '0px',
          paddingRight: '0px',
        }}
      >
        <div className='product-feature-container mx-auto w-full max-w-[1238px] px-5 md:px-10'>
          <p className='mb-4 font-mono text-sm font-normal uppercase tracking-[0.08em] text-brand-fg'>
            Internal reference
          </p>
          <h1 className='section-title max-w-[760px] text-brand-fg' style={{ marginBottom: '20px' }}>
            Removed Agent Canvas section examples
          </h1>
          <p className='fluid-body-lg max-w-[760px] text-brand-muted' style={{ margin: 0, textWrap: 'pretty' }}>
            These blocks are preserved for design and parity reference. This route is intentionally not linked from the
            public site navigation.
          </p>
        </div>
      </section>

      <ProductCanvasArchivedSections />
    </main>
  );
}
