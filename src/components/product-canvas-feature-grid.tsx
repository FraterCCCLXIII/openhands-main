import { domAnimation, LazyMotion, m } from 'framer-motion';
import { PRODUCT_CANVAS_FEATURES } from '~/constants/product-canvas-features';

const FEATURE_DIVIDER = 'border-[rgba(24,24,24,0.12)]';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: index * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function ProductCanvasFeatureGrid() {
  return (
    <section
      data-wf-el='section'
      className='product-canvas-feature-grid'
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
          style={{ marginBottom: '32px' }}
        >
          More than a new UI
        </p>

        <LazyMotion features={domAnimation}>
          <div className={`grid grid-cols-1 border-t ${FEATURE_DIVIDER} md:grid-cols-2`}>
            {PRODUCT_CANVAS_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              const isLastItem = index === PRODUCT_CANVAS_FEATURES.length - 1;
              const isInDesktopLastRow = index >= PRODUCT_CANVAS_FEATURES.length - 2;

              return (
                <m.article
                  key={feature.title}
                  data-wf-el='card'
                  className={[
                    'flex gap-4 p-6 md:gap-5 md:p-7',
                    !isLastItem ? `border-b ${FEATURE_DIVIDER}` : '',
                    isInDesktopLastRow ? 'md:border-b-0' : '',
                    index % 2 === 0 ? `md:border-r ${FEATURE_DIVIDER}` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  custom={index}
                  initial='hidden'
                  whileInView='visible'
                  viewport={{ once: true, margin: '-50px' }}
                  variants={cardVariants}
                >
                  <div
                    className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-accent text-brand-fg'
                    aria-hidden='true'
                  >
                    <Icon className='h-5 w-5' strokeWidth={1.75} />
                  </div>

                  <div className='min-w-0'>
                    <h3 className='text-base font-medium leading-[22.4px] text-brand-fg' style={{ marginBottom: '8px' }}>
                      {feature.title}
                    </h3>
                    <p className='text-base leading-[1.45] text-brand-muted' style={{ margin: 0 }}>
                      {feature.description}
                    </p>
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
