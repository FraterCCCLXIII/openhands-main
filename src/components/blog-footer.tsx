import React, { useState } from 'react';
import { useActionData, useNavigation } from 'react-router';
import type { action } from '~/routes/blog.$slug';
import { BlogCard } from './blog-card';
import { NewsletterForm } from './newsletter-form';

interface BlogFooterProps {
  title?: string;
  authors?: Array<{ name: string; link?: string | null }>;
  date?: string;
  url?: string;
  articleHighlights?: Array<{
    title: string;
    cover: string | null;
    coverAlt?: string;
    href: string;
  }>;
}

export const BlogFooter: React.FC<BlogFooterProps> = ({
  title = 'OpenHands Blog',
  authors = [],
  date = new Date().toISOString(),
  url = '',
  articleHighlights = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigation = useNavigation();
  const data = useActionData<typeof action>();

  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = dateObj.toLocaleString('default', { month: 'short' });
  const day = dateObj.getDate();
  const firstAuthorLastName = authors[0]?.name.split(' ').pop() || 'Author';
  const citationKey = `${firstAuthorLastName.toLowerCase()}${year}-${title
    .split(' ')
    .slice(0, 3)
    .join('-')
    .toLowerCase()}`;
  const bibtex = `@online{${citationKey},\n  author = {${authors.map((author) => author.name).join(' and ')}},\n  title = {${title}},\n  year = {${year}},\n  month = {${month}},\n  day = {${day}},\n  url = {${url}},\n  note = {Blog post},\n  organization = {OpenHands Blog}\n}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='w-full'>
      <section data-wf-el='section' style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className='mx-auto w-full max-w-[860px] px-5 lg:px-0'>
          <div className='space-y-4 border-t border-black/10 pt-10'>
            <div className='flex items-center justify-between gap-0'>
              <button
                type='button'
                onClick={() => setExpanded((value) => !value)}
                title={expanded ? 'Collapse Citation' : 'Expand Citation'}
                className='relative flex h-12 w-full items-center gap-4 px-5 text-center text-[16px] leading-[22.4px] font-normal text-brand-fg'
                style={{ fontFamily: 'Sohne Buch, Sohne Kraftig, Inter, Arial, sans-serif' }}
              >
                Citation
                <img
                  src='/assets/webflow/icons/chevrondown.svg'
                  alt=''
                  className={`h-6 w-6 overflow-hidden rounded-[8px] object-cover transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>

              <button
                type='button'
                onClick={copyToClipboard}
                className='flex h-12 w-6 shrink-0 items-center justify-center text-[#5f5f5f] transition-colors hover:text-brand-brown'
                title='Copy Citation'
                aria-label='Copy Citation'
              >
                <img src='/assets/webflow/icons/copy.svg' alt='' className='h-6 w-6 overflow-hidden rounded-[8px] object-cover' />
                {copied && <span className='sr-only'>Copied!</span>}
              </button>
            </div>

            {expanded && (
              <pre className="overflow-x-auto rounded-[8px] bg-white/60 p-4 text-[12px] leading-[1.6] text-brand-fg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {bibtex}
              </pre>
            )}
          </div>
        </div>
      </section>
      {articleHighlights.length > 0 && (
        <section data-wf-el='section' style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <div className='mx-auto grid w-full max-w-[1238px] grid-cols-1 gap-x-10 gap-y-12 px-5 md:grid-cols-2 lg:px-0 xl:grid-cols-3'>
            {articleHighlights.map((highlight) => (
              <BlogCard
                key={highlight.href}
                href={highlight.href}
                title={highlight.title}
                img={highlight.cover ?? undefined}
                imgAlt={highlight.coverAlt ?? ''}
                showDate={false}
                titleLinkOnly
              />
            ))}
          </div>
        </section>
      )}

      <section data-wf-el='section' className='text-center' style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className='mx-auto flex w-full max-w-[1238px] flex-col items-center gap-4 px-5 lg:px-0'>
          <h1 className='w-full font-sohne text-[32px] leading-[1.1] font-medium tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
            Get useful insights in our blog
          </h1>
          <p className='w-full text-[20.8px] leading-[24.96px] font-medium text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: '20.8px' }}>
            Insights and updates from the OpenHands team
          </p>
          <p className='max-w-[560px] text-[16px] leading-[22.4px] text-[#22150d]' style={{ marginBottom: '16px' }}>
            Sign up for our newsletter for updates, events, and community insights.
          </p>
          <NewsletterForm
            centered
            error={data?.result === 'error' ? data.msg : undefined}
            success={data?.result === 'success' ? data.msg : undefined}
            disabled={navigation.state === 'submitting' || !!data}
          />
        </div>
      </section>
    </div>
  );
};
