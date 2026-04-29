import { Link } from 'react-router';
import type { ProductFeaturePageData } from '~/data/product-feature-pages';

const COMPARISON_ROWS = [
  'Open-source',
  'Model-agnostic',
  'Sandbox runtime',
  'Self-hosted',
  'Coding Agent SDK',
] as const;

const isExternalHref = (href: string) => href.startsWith('http');

const CTAButton = ({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: 'primary' | 'outline';
}) => {
  const className = `btn btn-${variant}`;

  if (isExternalHref(href)) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
};

export const ProductFeaturePage = ({ page }: { page: ProductFeaturePageData }) => {
  return (
    <main className='bg-brand-bg pt-[100px] text-brand-fg'>
      <section className='px-6 py-16 lg:px-10 lg:py-24'>
        <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]'>
          <div>
            <p className='mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-brand-muted'>
              {page.eyebrow}
            </p>
            <h1 className='mb-6 max-w-3xl text-[44px] font-bold leading-[1.02] lg:text-[72px]'>
              {page.heading}
            </h1>
            <p className='paragraph mb-8 max-w-2xl text-brand-muted'>{page.description}</p>
            <div className='flex flex-wrap gap-4'>
              <CTAButton {...page.primaryCta} variant='primary' />
              <CTAButton {...page.secondaryCta} variant='outline' />
            </div>
          </div>
          <div className='overflow-hidden rounded-[28px] border border-brand-fg/10 bg-[#16110d] p-3 shadow-[0_30px_80px_rgba(34,21,13,0.12)]'>
            <img
              src={page.heroImage.src}
              alt={page.heroImage.alt}
              className='w-full rounded-[20px] object-cover'
            />
          </div>
        </div>
      </section>

      <section className='px-6 py-12 lg:px-10 lg:py-16'>
        <div className='mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]'>
          <div>
            <h2 className='section-title mb-5 max-w-3xl'>{page.introTitle}</h2>
            <p className='paragraph max-w-2xl text-brand-muted'>{page.introDescription}</p>
          </div>
          <div className='overflow-hidden rounded-[28px] bg-[#16110d] p-4 shadow-[0_24px_60px_rgba(34,21,13,0.12)]'>
            <img
              src={page.accentImage.src}
              alt={page.accentImage.alt}
              className='w-full rounded-[20px] object-cover'
            />
          </div>
        </div>
      </section>

      <section className='px-6 py-12 lg:px-10 lg:py-16'>
        <div className='mx-auto max-w-6xl rounded-[32px] bg-[#efe6d1] p-8 lg:p-12'>
          <h2 className='section-title mb-5 max-w-3xl'>{page.proofTitle}</h2>
          <p className='paragraph max-w-3xl text-brand-muted'>{page.proofDescription}</p>
        </div>
      </section>

      <section className='px-6 py-12 lg:px-10 lg:py-16'>
        <div className='mx-auto max-w-6xl rounded-[32px] border border-brand-fg/10 bg-white/55 p-8 lg:p-10'>
          <h2 className='section-title mb-8'>Key capabilities</h2>
          <ul className='space-y-4'>
            {page.capabilities.map((capability) => (
              <li key={capability} className='flex items-start gap-3 text-[18px] leading-[1.45] text-brand-fg'>
                <span className='mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-fg text-brand-bg'>
                  ✓
                </span>
                <span>{capability}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className='px-6 py-12 lg:px-10 lg:py-16'>
        <div className='mx-auto max-w-6xl space-y-8'>
          <div className='grid gap-6 md:grid-cols-2'>
            {page.showcaseImages.map((image) => (
              <div
                key={image.src}
                className='overflow-hidden rounded-[28px] bg-[#16110d] p-3 shadow-[0_24px_60px_rgba(34,21,13,0.12)]'
              >
                <img src={image.src} alt={image.alt} className='w-full rounded-[20px] object-cover' />
              </div>
            ))}
          </div>
          <div className='rounded-[32px] border border-brand-fg/10 bg-[#16110d] p-8 text-brand-bg lg:p-10'>
            <h2 className='section-title mb-8 text-brand-bg'>How teams use it</h2>
            <ul className='space-y-4'>
              {page.useCases.map((useCase) => (
                <li key={useCase} className='flex items-start gap-3 text-[18px] leading-[1.45] text-brand-bg/90'>
                  <span className='mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-accent text-brand-fg'>
                    →
                  </span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className='px-6 py-12 lg:px-10 lg:py-16'>
        <div className='mx-auto max-w-6xl rounded-[32px] bg-white/45 p-8 lg:p-12'>
          <div className='section-title mb-8 max-w-3xl'>
            The only open, secure, and scalable agent platform built for real engineering work
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[640px] border-collapse text-left'>
              <thead>
                <tr className='border-b border-brand-fg/15'>
                  <th className='px-4 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand-muted'>
                    Feature
                  </th>
                  <th className='px-4 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand-muted'>
                    OpenHands
                  </th>
                  <th className='px-4 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand-muted'>
                    Devin
                  </th>
                  <th className='px-4 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand-muted'>
                    Claude Code
                  </th>
                  <th className='px-4 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand-muted'>
                    Factory
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row} className='border-b border-brand-fg/10 last:border-b-0'>
                    <td className='px-4 py-4 text-[18px] font-medium'>{row}</td>
                    <td className='px-4 py-4 text-[18px] font-semibold'>✓</td>
                    <td className='px-4 py-4 text-[18px] text-brand-muted'>—</td>
                    <td className='px-4 py-4 text-[18px] text-brand-muted'>—</td>
                    <td className='px-4 py-4 text-[18px] text-brand-muted'>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className='bg-brand-accent px-6 py-16 lg:px-10 lg:pb-10 lg:pt-20'>
        <div className='mx-auto max-w-4xl text-center'>
          <p className='mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-brand-fg/70'>
            Try it live
          </p>
          <p className='section-title mb-4'>{page.closingTitle}</p>
          <p className='paragraph mx-auto mb-8 max-w-2xl text-brand-muted'>
            {page.closingDescription}
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            <CTAButton {...page.closingPrimaryCta} variant='primary' />
            <CTAButton {...page.closingSecondaryCta} variant='outline' />
          </div>
        </div>
      </section>
    </main>
  );
};
