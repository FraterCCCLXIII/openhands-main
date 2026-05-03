import React, { useState } from 'react';
import { useActionData, useNavigation } from 'react-router';
import type { action } from '~/routes/blog.$slug';
import { BlogCard } from './blog-card';
import { NewsletterForm } from './newsletter-form';

interface BlogFooterProps {
  title: string;
  authors: Array<{ name: string; link?: string | null }>;
  date: string;
  url: string;
  articleHighlights?: Array<{
    title: string;
    cover: string | null;
    coverAlt?: string;
    href: string;
  }>;
}

export const BlogFooter: React.FC<BlogFooterProps> = ({
  title,
  authors,
  date,
  url,
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

  const generateBibTeX = () => {
    const firstAuthorLastName = authors[0].name.split(' ').pop() || 'Author';
    const citationKey = `${firstAuthorLastName.toLowerCase()}${year}-${title
      .split(' ')
      .slice(0, 3)
      .join('-')
      .toLowerCase()}`;

    return `@online{${citationKey},
  author = {${authors.map((author) => author.name).join(' and ')}},
  title = {${title}},
  year = {${year}},
  month = {${month}},
  day = {${day}},
  url = {${url}},
  note = {Blog post},
  organization = {OpenHands Blog}
}`;
  };

  const bibtex = generateBibTeX();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='mt-16 flex w-full flex-col gap-14 border-t border-black/10 pt-10'>
      <section className='space-y-4'>
        <div className='flex items-center justify-between gap-4'>
          <button
            type='button'
            onClick={() => setExpanded((value) => !value)}
            title={expanded ? 'Collapse Citation' : 'Expand Citation'}
            className='inline-flex items-center gap-2 text-[18px] leading-[1.2] font-medium text-brand-fg'
          >
            Citation
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>

          <button
            type='button'
            onClick={copyToClipboard}
            className='flex items-center gap-1 text-[#5f5f5f] transition-colors hover:text-brand-brown'
            title='Copy BibTeX'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
              />
            </svg>
            {copied && <span className='text-[14px] text-[#259d4d]'>Copied!</span>}
          </button>
        </div>

        {expanded && (
          <pre className="overflow-x-auto rounded-[8px] bg-white/60 p-4 text-[12px] leading-[1.6] text-brand-fg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {bibtex}
          </pre>
        )}
      </section>

      {articleHighlights.length > 0 && (
        <section className='grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3'>
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
        </section>
      )}

      <section className='flex flex-col items-center gap-4 text-center'>
        <h1 className='font-sohne text-[32px] leading-[1.1] font-medium tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
          Get useful insights in our blog
        </h1>
        <p className='max-w-[560px] text-[18px] leading-[1.2] font-medium text-[#5f5f5f] lg:text-[20px]'>
          Insights and updates from the OpenHands team
        </p>
        <p className='max-w-[560px] text-[18px] leading-[1.5] text-[#22150d]'>
          Sign up for our newsletter for updates, events, and community insights.
        </p>
        <NewsletterForm
          centered
          error={data?.result === 'error' ? data.msg : undefined}
          success={data?.result === 'success' ? data.msg : undefined}
          disabled={navigation.state === 'submitting' || !!data}
        />
      </section>
    </div>
  );
};
