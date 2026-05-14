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

const normalizeRawPreBlocks = (content: string) =>
  content.replace(
    /<pre\b([^>]*)>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/g,
    (_match, preAttributes: string, codeAttributes: string, codeContent: string) => {
      const trimmedCodeContent = codeContent.replace(/^\n+|\n+$/g, '');
      return `\n\n<pre${preAttributes}><code${codeAttributes}>${trimmedCodeContent}</code></pre>\n\n`;
    }
  );

type BlogImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  isBlog: boolean;
};

const BlogImage: React.FC<BlogImageProps> = ({ isBlog: _isBlog, ...props }) => <img {...props} />;


export const CMarkdown: React.FC<CMarkdownProps> = ({
  children,
  variant = 'default',
  codeElementWidth,
}) => {
  const isBlog = variant === 'blog';
  const codeStyle = codeElementWidth
    ? { maxWidth: codeElementWidth }
    : undefined;
  const normalizedChildren = React.useMemo(
    () => normalizeRawPreBlocks(children),
    [children]
  );

  return (
    <div className={isBlog ? undefined : 'flex flex-col gap-4'} style={isBlog ? { fontFamily: 'Sohne Buch, Sohne Kraftig, Inter, Arial, sans-serif' } : undefined}>
      <Markdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          a: ({ children: linkChildren, ...props }) => (
            <a
              rel='noreferrer'
              target='_blank'
              className={clsx(
                'underline transition-colors',
                isBlog
                  ? 'font-[Sohne_Buch] text-[16px] leading-[22.4px] text-brand-brown hover:text-brand-fg'
                  : 'text-blue-600 decoration-[1px] underline-offset-[0.18em]'
              )}
              {...props}
            >
              {linkChildren}
            </a>
          ),
          h1: ({ children: headingChildren, ...props }) => (
            <h1
              className={clsx(
                isBlog ? 'mb-[8.8px] mt-[44px] first:mt-0' : 'mb-4 mt-12 first:mt-0',
                isBlog
                  ? 'font-sohne text-[32px] leading-[1.1] font-medium tracking-[-0.02em] text-brand-fg lg:text-[44px]'
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
                isBlog ? 'mb-[8.8px] mt-[44px] first:mt-0' : 'mb-4 mt-12 first:mt-0',
                isBlog
                  ? 'font-sohne text-[32px] leading-[1.1] font-medium tracking-[-0.02em] text-brand-fg lg:text-[44px]'
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
                isBlog ? 'mb-[9.6px] mt-8' : 'mb-4 mt-10',
                isBlog
                  ? 'font-sohne text-[24px] leading-[1.2] font-medium text-brand-fg lg:text-[32px]'
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
                isBlog ? 'mb-[9.6px] mt-8' : 'mb-4 mt-8',
                isBlog
                  ? 'font-sohne text-[20px] leading-[1.3] font-medium text-brand-fg lg:text-[24px]'
                  : 'font-quincy text-2xl'
              )}
              {...props}
            >
              {headingChildren}
            </h4>
          ),
          ul: ({ children: listChildren, ...props }) => (
            <ul className={clsx('mb-4 list-disc pl-5', isBlog ? undefined : 'space-y-1')} {...props}>
              {listChildren}
            </ul>
          ),
          ol: ({ children: listChildren, ...props }) => (
            <ol className={clsx('mb-4 list-decimal pl-5', isBlog ? undefined : 'space-y-1')} {...props}>
              {listChildren}
            </ol>
          ),
          li: ({ children: listChildren, ...props }) => (
            <li
              className={clsx(
                isBlog
                  ? 'mb-[4.8px] font-[Sohne_Buch] text-[16px] leading-[22.4px] text-[#5f5f5f] marker:text-brand-fg last:mb-0'
                  : 'ml-5 list-disc'
              )}
              {...props}
            >
              {listChildren}
            </li>
          ),
          img: ({ alt, className, ...props }) => (
            <BlogImage
              isBlog={isBlog}
              className={clsx(
                isBlog ? 'w-full rounded-none object-cover leading-[22.4px]' : 'rounded-lg',
                className
              )}
              {...props}
              alt={alt}
            />
          ),
          figure: ({ children: figureChildren, className, ...props }) => {
            const isFullWidthFigure =
              typeof className === 'string' && className.includes('w-richtext-align-fullwidth');

            return (
              <figure
                className={clsx(
                  isBlog && 'mx-auto my-[3em] overflow-hidden rounded-[8px]',
                  isBlog && isFullWidthFigure
                    ? 'w-full max-w-full [&_img]:max-w-full [&_img]:w-full [&_img]:text-[0px] [&_img]:leading-[0] [&_img]:text-transparent'
                    : undefined,
                  isBlog && !isFullWidthFigure ? 'max-w-full [&_img]:max-w-full [&_img]:w-auto' : undefined,
                  className
                )}
                {...props}
              >
                {figureChildren}
              </figure>
            );
          },
          pre: ({ children: preChildren, style, ...props }) => (
            <pre
              className={clsx(isBlog ? 'my-[15px] overflow-x-auto [&_code]:!inline-block' : undefined)}
              style={isBlog ? {
                ...style,
                display: 'block',
                overflowX: 'auto',
                backgroundColor: 'rgb(34, 21, 13)',
                color: 'rgb(248, 248, 242)',
                borderRadius: '6.4px',
                padding: '1.5em 0.5em',
                marginTop: '15px',
                marginBottom: '15px',
                fontFamily: 'monospace',
                fontSize: '15px',
                lineHeight: '21px',
              } : style}
              {...props}
            >
              {preChildren}
            </pre>
          ),
          p: ({ children: paragraphChildren, node, ...props }) => {
            const onlyChild = node?.children?.length === 1 ? node.children[0] : null;
            const isImageOnlyParagraph =
              isBlog &&
              onlyChild?.type === 'element' &&
              onlyChild.tagName === 'img';

            if (isImageOnlyParagraph) {
              return (
                <figure
                  className='mx-auto my-[3em] max-w-full overflow-hidden rounded-[8px] [&_img]:max-w-full [&_img]:w-auto'
                  {...props}
                >
                  {paragraphChildren}
                </figure>
              );
            }

            return (
              <p
                className={clsx(
                  isBlog
                    ? 'mb-4 mt-0 font-[Sohne_Buch] text-[16px] leading-[22.4px] text-[#5f5f5f]'
                    : 'text-description'
                )}
                {...props}
              >
                {paragraphChildren}
              </p>
            );
          },
          strong: ({ children: strongChildren, ...props }) => (
            <strong className={isBlog ? 'font-bold text-brand-fg' : undefined} {...props}>
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
              const { style, ...codeProps } = props;
              return (
                <code
                  className={clsx(
                    'rounded-[6px] font-mono',
                    isBlog
                      ? 'bg-brand-fg px-[7.5px] py-0 text-brand-bg'
                      : 'bg-black/10 px-2 py-1 text-[0.95em] text-brand-fg'
                  )}
                  style={isBlog ? {
                    ...style,
                    display: 'inline-block',
                    fontFamily: 'monospace',
                    fontSize: '14.4px',
                    lineHeight: '20.16px',
                  } : style}
                  {...codeProps}
                >
                  {codeChildren}
                </code>
              );
            }

            if (isBlog) {
              const { style, ...codeProps } = props;
              return (
                <code
                  className={className}
                  style={{
                    ...style,
                    display: 'block',
                    overflow: 'auto',
                    backgroundColor: 'rgb(34, 21, 13)',
                    borderRadius: '6.4px',
                    fontFamily: 'monospace',
                    fontSize: '15px',
                    lineHeight: '21px',
                  }}
                  {...codeProps}
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
                  ? 'text-[16px] leading-[22.4px] text-[#5f5f5f]'
                  : 'border border-gray-300 px-4'
              )}
              {...props}
            >
              {tableChildren}
            </td>
          ),
        }}
      >
        {normalizedChildren}
      </Markdown>
    </div>
  );
};

function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}
