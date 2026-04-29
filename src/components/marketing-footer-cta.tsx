interface MarketingFooterCtaProps {
  semanticHeading?: boolean;
}

export const MarketingFooterCta = ({ semanticHeading = false }: MarketingFooterCtaProps) => {
  const HeadingTag = semanticHeading ? 'h2' : 'div';

  return (
    <section className='px-10 py-20 text-center'>
      <div className='mx-auto flex max-w-3xl flex-col items-center gap-6'>
        <HeadingTag className='text-[44px] font-medium leading-[1.1] tracking-[-0.02em] text-brand-fg'>
          Building the open standard for autonomous software development.
        </HeadingTag>
        <p className='max-w-2xl text-[18px] leading-[1.6] text-brand-muted'>
          OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.
        </p>
        <div className='flex flex-wrap items-center justify-center gap-4'>
          <a
            href='https://docs.openhands.dev/sdk'
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-primary rounded-none'
          >
            Build with SDK
          </a>
          <a
            href='https://app.all-hands.dev/'
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-outline rounded-none'
          >
            Try it live
          </a>
        </div>
      </div>
    </section>
  );
};
