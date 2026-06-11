import type { ComponentType, SVGProps } from 'react';
import { domAnimation, LazyMotion, m } from 'framer-motion';
import { ClaudeCodeIcon, CodexIcon, GeminiCliIcon } from '~/components/icons/agent-subscription-icons';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import {
  PRODUCT_CANVAS_ACP_AGENTS,
  PRODUCT_CANVAS_ACP_LEARN_MORE_URL,
  PRODUCT_CANVAS_ACP_SPEC_URL,
  type ProductCanvasAcpAgentIcon,
} from '~/constants/product-canvas-acp';

const ROW_DIVIDER = 'border-[rgba(24,24,24,0.12)]';

const AGENT_ICONS: Record<
  Exclude<ProductCanvasAcpAgentIcon, 'openhands'>,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  claude: ClaudeCodeIcon,
  codex: CodexIcon,
  gemini: GeminiCliIcon,
};

function AgentIcon({ type }: { type: ProductCanvasAcpAgentIcon }) {
  if (type === 'openhands') {
    return (
      <img
        src='/assets/webflow/brand/openhands-logo-mobile-mono.svg'
        alt=''
        className='h-5 w-auto'
        aria-hidden='true'
      />
    );
  }

  const Icon = AGENT_ICONS[type];
  return <Icon className='h-5 w-5' aria-hidden='true' />;
}

const listItemVariants = {
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

export function ProductCanvasAcpSection() {
  return (
    <section
      data-wf-el='section'
      className='product-canvas-acp-section'
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
        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16'>
          <div className='min-w-0'>
            <p
              data-wf-el='eyebrow'
              className='mb-6 font-mono text-sm font-normal uppercase tracking-[0.08em] text-brand-fg'
            >
              Agent Client Protocol
            </p>
            <h2 className='section-title text-brand-fg' style={{ marginBottom: '24px' }}>
              You don&apos;t have to switch to go further.
            </h2>
            <p data-wf-el='paragraph-lg' className='fluid-body-lg text-brand-muted' style={{ marginTop: 0, marginBottom: '20.8px', textWrap: 'pretty' }}>
              Agent Canvas connects to different agent harnesses through the open Agent Client Protocol (ACP). That means you keep your existing subscriptions, your familiar model, your existing workflows, and get everything those tools can&apos;t do natively.
            </p>
            <p data-wf-el='paragraph-lg' className='fluid-body-lg text-brand-muted' style={{ marginTop: 0, marginBottom: '32px', textWrap: 'pretty' }}>
              No migration. No new model to learn. OpenHands adds the system layer those tools are missing.
            </p>
            <OverlayLinkButton href={PRODUCT_CANVAS_ACP_LEARN_MORE_URL} label='Learn more' variant='outline' />
          </div>

          <LazyMotion features={domAnimation}>
            <m.div
              className={`product-canvas-acp-panel border-t ${ROW_DIVIDER}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className='flex flex-col'>
                {PRODUCT_CANVAS_ACP_AGENTS.map((agent, index) => {
                  const isLast = index === PRODUCT_CANVAS_ACP_AGENTS.length - 1;

                  return (
                    <m.article
                      key={agent.name}
                      data-wf-el='card'
                      className={[
                        'product-canvas-acp-agent-row flex items-center justify-between gap-4 py-5 md:py-6',
                        !isLast ? `border-b ${ROW_DIVIDER}` : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      custom={index}
                      initial='hidden'
                      whileInView='visible'
                      viewport={{ once: true, margin: '-40px' }}
                      variants={listItemVariants}
                    >
                      <div className='flex min-w-0 items-center gap-4'>
                        <div
                          className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-accent text-brand-fg'
                          aria-hidden='true'
                        >
                          <AgentIcon type={agent.icon} />
                        </div>
                        <div className='min-w-0'>
                          <div className='text-base font-medium leading-[22.4px] text-brand-fg'>{agent.name}</div>
                          <div className='text-sm leading-[19.6px] text-brand-muted'>
                            {agent.provider} · {agent.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className='flex-shrink-0 rounded-full border border-[rgba(24,24,24,0.1)] bg-[rgba(24,24,24,0.05)] px-3 py-1.5 text-xs font-medium text-brand-muted'>
                        Supported
                      </span>
                    </m.article>
                  );
                })}
              </div>

              <m.p
                className={`border-t ${ROW_DIVIDER} pt-5 text-sm leading-[19.6px] text-brand-muted`}
                style={{ marginBottom: 0 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                ACP is an open protocol. Any agent harness that implements it can connect to Agent Canvas. If you&apos;re building a harness,{' '}
                <a
                  href={PRODUCT_CANVAS_ACP_SPEC_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-brand-fg underline decoration-[1.6px] underline-offset-[3px] transition-opacity hover:opacity-80'
                >
                  read the spec →
                </a>
              </m.p>
            </m.div>
          </LazyMotion>
        </div>
      </div>
    </section>
  );
}
