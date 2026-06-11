import { useRef } from 'react';
import { domAnimation, LazyMotion, m } from 'framer-motion';
import { ProductCanvasBackendsFlowDivider } from '~/components/product-canvas-backends-flow-divider';
import { PRODUCT_CANVAS_BACKENDS } from '~/constants/product-canvas-backends';

const ROW_DIVIDER = 'border-[rgba(24,24,24,0.12)]';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: index * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function ProductCanvasBackendsSection() {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <section
      data-wf-el='section'
      className='product-canvas-backends-section'
      style={{
        display: 'block',
        backgroundColor: 'rgb(247, 243, 238)',
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: '0px',
        paddingRight: '0px',
      }}
    >
      <div data-wf-el='container' className='product-feature-container mx-auto w-full max-w-[1238px] px-5 md:px-10'>
        <p
          data-wf-el='eyebrow'
          className='mb-6 font-mono text-sm font-normal uppercase tracking-[0.08em] text-brand-fg'
        >
          Where your agents run
        </p>
        <h2 className='section-title max-w-[720px] text-brand-fg' style={{ marginBottom: '20px' }}>
          Local-first. Cloud-ready.
        </h2>
        <p
          data-wf-el='paragraph-lg'
          className='fluid-body-lg max-w-[760px] text-brand-muted'
          style={{ marginTop: 0, marginBottom: '40px', textWrap: 'pretty' }}
        >
          Your choice at every step. Agent Canvas starts on your laptop, but the execution environment can live anywhere. The interface never changes, you just unlock more backends as you scale.
        </p>

        <LazyMotion features={domAnimation}>
          <div
            ref={gridRef}
            className={`product-canvas-backends-list relative grid grid-cols-1 border-y ${ROW_DIVIDER} md:grid-cols-3`}
          >
            <ProductCanvasBackendsFlowDivider position={1 / 3} containerRef={gridRef} />
            <ProductCanvasBackendsFlowDivider position={2 / 3} containerRef={gridRef} />

            {PRODUCT_CANVAS_BACKENDS.map((backend, index) => {
              const Icon = backend.icon;
              const isDark = backend.variant === 'dark';
              const isLast = index === PRODUCT_CANVAS_BACKENDS.length - 1;

              return (
                <m.article
                  key={backend.title}
                  data-wf-el='card'
                  className={[
                    'flex min-h-full flex-col p-6 md:p-7',
                    !isLast ? `border-b ${ROW_DIVIDER}` : '',
                    'md:border-b-0',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  custom={index}
                  initial='hidden'
                  whileInView='visible'
                  viewport={{ once: true, margin: '-60px' }}
                  variants={cardVariants}
                >
                  <p
                    className='mb-5 font-mono text-xs font-normal uppercase tracking-[0.08em] text-brand-muted'
                    style={{ marginBottom: '20px' }}
                  >
                    {backend.label}
                  </p>

                  <div
                    className={
                      isDark
                        ? 'mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-fg text-brand-accent'
                        : 'mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent text-brand-fg'
                    }
                    style={{ marginBottom: '20px' }}
                    aria-hidden='true'
                  >
                    <Icon className='h-5 w-5' strokeWidth={1.75} />
                  </div>

                  <h3 className='fluid-h4 text-brand-fg' style={{ marginBottom: '12px' }}>
                    {backend.title}
                  </h3>

                  <p className='flex-1 text-base leading-[1.4] text-brand-muted' style={{ margin: 0 }}>
                    {backend.description}
                  </p>

                  <span
                    className='mt-6 inline-flex w-fit rounded-full border border-[rgba(24,24,24,0.1)] bg-[rgba(24,24,24,0.05)] px-3 py-1.5 text-xs font-medium text-brand-muted'
                    style={{ marginTop: '24px' }}
                  >
                    {backend.tag}
                  </span>
                </m.article>
              );
            })}
          </div>
        </LazyMotion>
      </div>
    </section>
  );
}
