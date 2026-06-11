import { domAnimation, LazyMotion, m } from 'framer-motion';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { PRODUCT_CANVAS_GET_STARTED_STEPS } from '~/constants/product-canvas-get-started';

const STEP_DIVIDER = 'border-[rgba(24,24,24,0.12)]';

const stepVariants = {
  hidden: { opacity: 0, y: 16 },
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

export function ProductCanvasGetStartedSection() {
  return (
    <section
      data-wf-el='section'
      className='product-canvas-get-started-section'
      style={{
        display: 'block',
        backgroundColor: 'rgba(0, 0, 0, 0)',
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
          Get started
        </p>
        <h2 className='section-title max-w-[720px] text-brand-fg' style={{ marginBottom: '20px' }}>
          Running in under 5 minutes.
        </h2>
        <p
          data-wf-el='paragraph-lg'
          className='fluid-body-lg max-w-[760px] text-brand-muted'
          style={{ marginTop: 0, marginBottom: '48px', textWrap: 'pretty' }}
        >
          No Docker. No complex setup. Download the app, connect the agent you already use, and start.
        </p>

        <LazyMotion features={domAnimation}>
          <div className={`product-canvas-get-started-steps border-t ${STEP_DIVIDER}`}>
            {PRODUCT_CANVAS_GET_STARTED_STEPS.map((step, index) => {
              const isLast = index === PRODUCT_CANVAS_GET_STARTED_STEPS.length - 1;

              return (
              <m.article
                key={step.title}
                data-wf-el='card'
                className={[
                  'flex flex-col gap-4 py-6 md:flex-row md:items-center md:gap-8 md:py-7',
                  !isLast ? `border-b ${STEP_DIVIDER}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                custom={index}
                initial='hidden'
                whileInView='visible'
                viewport={{ once: true, margin: '-60px' }}
                variants={stepVariants}
              >
                <div className='flex min-w-0 flex-1 gap-4 md:contents'>
                  <div className='flex shrink-0 md:w-12 md:justify-center'>
                    <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent text-sm font-medium text-brand-fg'>
                      {step.step}
                    </span>
                  </div>

                  <div className='min-w-0 flex-1'>
                    <h3 className='fluid-h4 text-brand-fg' style={{ marginBottom: '8px' }}>
                      {step.title}
                    </h3>
                    <p className='max-w-[640px] text-base leading-[1.45] text-brand-muted' style={{ margin: 0 }}>
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className='flex flex-col items-start gap-2 pl-14 md:min-w-[220px] md:shrink-0 md:items-end md:pl-0 md:text-right'>
                  {step.footnote ? (
                    <p className='text-sm italic leading-[19.6px] text-brand-muted' style={{ margin: 0 }}>
                      {step.footnote}
                    </p>
                  ) : null}
                  <OverlayLinkButton
                    href={step.cta.href}
                    label={step.cta.label}
                    variant={step.cta.variant}
                    wfEl='button'
                    textWfEl='btn-text'
                    wrapperStyle={{ marginBottom: 0 }}
                  />
                </div>
              </m.article>
              );
            })}
          </div>
        </LazyMotion>
      </div>
    </section>
  );
}
