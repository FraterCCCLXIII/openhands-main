import React from 'react';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { LazyCode } from './lazy-code';

type CMarkdownVariant = 'default' | 'blog';

interface CMarkdownProps {
  children: string;
  variant?: CMarkdownVariant;
  codeElementWidth?: number;
}

export const CMarkdown: React.FC<CMarkdownProps> = ({
  children,
  variant = 'default',
  codeElementWidth,
}) => {
  const isBlog = variant === 'blog';
  const codeStyle = codeElementWidth
    ? { maxWidth: codeElementWidth }
    : undefined;

  return (
    <div className={isBlog ? 'flex flex-col gap-6' : 'flex flex-col gap-4'}>
      <Markdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          a: ({ children: linkChildren, ...props }) => (
            <a
              rel='noreferrer'
              target='_blank'
              className={clsx(
                'underline decoration-[1px] underline-offset-[0.18em] transition-colors',
                isBlog
                  ? 'font-medium leading-[22.4px] text-brand-brown hover:text-brand-fg'
                  : 'text-blue-600'
              )}
              {...props}
            >
              {linkChildren}
            </a>
          ),
          h1: ({ children: headingChildren, ...props }) => (
            <h1
              className={clsx(
                'mb-4 mt-12 first:mt-0',
                isBlog
                  ? 'font-inter text-[32px] leading-[1.1] font-medium tracking-[-0.03em] text-brand-fg lg:text-[44px]'
                  : 'font-quincy text-5xl'
              )}
              {...props}
            >
              {headingChildren}
            </h1>
          ),
          h2: ({ children: headingChildren, ...props }) => (
            <h2
              className={clsx(
                'mb-4 mt-12 first:mt-0',
                isBlog
                  ? 'font-inter text-[32px] leading-[1.1] font-medium tracking-[-0.03em] text-brand-fg lg:text-[44px]'
                  : 'font-quincy text-5xl'
              )}
              {...props}
            >
              {headingChildren}
            </h2>
          ),
          h3: ({ children: headingChildren, ...props }) => (
            <h3
              className={clsx(
                'mb-4 mt-10',
                isBlog
                  ? 'font-inter text-[24px] leading-[1.2] font-medium tracking-[-0.02em] text-brand-fg lg:text-[32px]'
                  : 'font-quincy text-3xl'
              )}
              {...props}
            >
              {headingChildren}
            </h3>
          ),
          h4: ({ children: headingChildren, ...props }) => (
            <h4
              className={clsx(
                'mb-4 mt-8',
                isBlog
                  ? 'font-inter text-[20px] leading-[1.3] font-medium text-brand-fg lg:text-[24px]'
                  : 'font-quincy text-2xl'
              )}
              {...props}
            >
              {headingChildren}
            </h4>
          ),
          ul: ({ children: listChildren, ...props }) => (
            <ul
              className={clsx(
                'mb-6 list-disc pl-5',
                isBlog ? 'space-y-3' : 'space-y-1'
              )}
              {...props}
            >
              {listChildren}
            </ul>
          ),
          ol: ({ children: listChildren, ...props }) => (
            <ol
              className={clsx(
                'mb-6 list-decimal pl-5',
                isBlog ? 'space-y-3' : 'space-y-1'
              )}
              {...props}
            >
              {listChildren}
            </ol>
          ),
          li: ({ children: listChildren, ...props }) => (
            <li
              className={clsx(
                isBlog
                  ? 'text-[18px] leading-[1.5] text-[#5f5f5f] marker:text-brand-fg'
                  : 'ml-5 list-disc'
              )}
              {...props}
            >
              {listChildren}
            </li>
          ),
          img: ({ alt, ...props }) => (
            <img
              className={clsx(
                isBlog ? 'my-10 w-full rounded-[8px] object-cover leading-[22.4px]' : 'rounded-lg'
              )}
              {...props}
              alt={alt}
            />
          ),
          p: ({ children: paragraphChildren, ...props }) => (
            <p
              className={clsx(
                isBlog
                  ? 'mb-6 mt-0 text-[18px] leading-[1.5] text-[#5f5f5f]'
                  : 'text-description'
              )}
              {...props}
            >
              {paragraphChildren}
            </p>
          ),
          strong: ({ children: strongChildren, ...props }) => (
            <strong className={isBlog ? 'font-medium text-brand-fg' : undefined} {...props}>
              {strongChildren}
            </strong>
          ),
          blockquote: ({ children: quoteChildren, ...props }) => (
            <blockquote
              className={clsx(
                'my-8 border-l-2 pl-5',
                isBlog
                  ? 'border-brand-fg text-[22px] leading-[1.5] text-brand-fg'
                  : 'border-black/20 text-description'
              )}
              {...props}
            >
              {quoteChildren}
            </blockquote>
          ),
          code: ({ children: codeChildren, className, ...props }) => {
            if (!className) {
              return (
                <code
                  className={clsx(
                    'rounded-[6px] px-2 py-1 font-mono text-[0.95em]',
                    isBlog
                      ? 'bg-brand-fg text-brand-bg'
                      : 'bg-black/10 text-brand-fg'
                  )}
                  {...props}
                >
                  {codeChildren}
                </code>
              );
            }

            return (
              <LazyCode className={className} customStyle={codeStyle}>
                {codeChildren}
              </LazyCode>
            );
          },
          iframe: ({ node, ...props }) => (
            <div className='my-6 flex justify-center overflow-hidden rounded-[16px]'>
              <iframe {...props} />
            </div>
          ),
          table: ({ children: tableChildren, ...props }) => (
            <div className='my-6 overflow-x-auto'>
              <table
                className={clsx(
                  'w-full min-w-[480px] border-collapse',
                  isBlog ? 'text-left' : 'border border-gray-300'
                )}
                {...props}
              >
                {tableChildren}
              </table>
            </div>
          ),
          thead: ({ children: tableChildren, ...props }) => (
            <thead className={isBlog ? 'border-b border-black/10' : 'bg-gray-50'} {...props}>
              {tableChildren}
            </thead>
          ),
          tr: ({ children: tableChildren, ...props }) => (
            <tr className={isBlog ? 'border-b border-black/10 last:border-b-0' : 'border-b border-gray-200'} {...props}>
              {tableChildren}
            </tr>
          ),
          th: ({ children: tableChildren, ...props }) => (
            <th
              className={clsx(
                'py-3 pr-10 text-left',
                isBlog
                  ? 'font-medium text-brand-fg'
                  : 'border border-gray-300 bg-gray-100 px-4 font-semibold'
              )}
              {...props}
            >
              {tableChildren}
            </th>
          ),
          td: ({ children: tableChildren, ...props }) => (
            <td
              className={clsx(
                'py-3 pr-10 align-top',
                isBlog
                  ? 'text-[18px] leading-[1.5] text-[#5f5f5f]'
                  : 'border border-gray-300 px-4'
              )}
              {...props}
            >
              {tableChildren}
            </td>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
};

function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}
