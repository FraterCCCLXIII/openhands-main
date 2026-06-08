import React from 'react';
import { useMarqueeTiming } from '~/hooks/use-marquee-timing';

export type DeveloperQuote = {
  name: string;
  title: string;
  avatar: string;
  lines: string[];
};

type HomeLovewallMarqueeRowProps = {
  quotes: readonly DeveloperQuote[];
  direction: 'ltr' | 'rtl';
};

function renderQuoteLine(line: string, lineIdx: number, totalLines: number) {
  const isLast = lineIdx === totalLines - 1;

  return (
    <p
      key={`${lineIdx}-${line}`}
      className='text-base leading-[1.4] text-brand-fg'
      style={{ marginBottom: isLast ? '0px' : '16px' }}
    >
      {line.includes('@allhands_ai') ? (
        <>
          I love using autonomous agents like <strong style={{ fontWeight: 400, color: '#565656' }}>@allhands_ai</strong> OpenHands for 80% of the work (esp. backend), and then an interactive IDE like <strong style={{ fontWeight: 400, color: '#565656' }}>@windsurf</strong> or <strong style={{ fontWeight: 400, color: '#565656' }}>@zeddotdev</strong> for debugging, refinement, and UI work.
        </>
      ) : (
        line
      )}
    </p>
  );
}

function LovewallQuoteCard({ quote, isDuplicate = false }: { quote: DeveloperQuote; isDuplicate?: boolean }) {
  return (
    <article
      {...(isDuplicate ? {} : { 'data-wf-el': 'lovewall_cms_item' })}
      className='lovewall-marquee-card relative flex flex-col overflow-hidden rounded-lg border border-[#b3a88c] bg-white'
      style={{ justifyContent: 'flex-start' }}
    >
      <div
        {...(isDuplicate ? {} : { 'data-wf-el': 'card-body' })}
        className='relative flex-1 p-6'
        style={{ display: 'block', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}
      >
        <div
          {...(isDuplicate ? {} : { 'data-wf-el': 'lovewall_cms_item_top' })}
          className='mb-4 flex items-center gap-3'
          style={{ justifyContent: 'flex-start' }}
        >
          <img
            {...(isDuplicate ? {} : { 'data-wf-el': 'lovewall_cms_item_avatar' })}
            src={quote.avatar}
            alt={isDuplicate ? '' : quote.name}
            className='h-12 w-12 object-cover'
            style={{ aspectRatio: '1 / 1', borderRadius: '100%' }}
          />
          <div {...(isDuplicate ? {} : { 'data-wf-el': 'lovewall_cms_item_top_meta' })}>
            <div
              {...(isDuplicate ? {} : { 'data-wf-el': 'lovewall_cms_item_top_name' })}
              className='font-normal'
              style={{ color: 'rgb(24, 24, 24)', fontSize: '14.08px' }}
            >
              {quote.name}
            </div>
            <div
              {...(isDuplicate ? {} : { 'data-wf-el': 'lovewall_cms_item_top_name' })}
              className='font-normal'
              style={{ color: 'rgb(95, 95, 95)', fontSize: '14.08px' }}
            >
              {quote.title}
            </div>
          </div>
        </div>
        <div {...(isDuplicate ? {} : { 'data-wf-el': 'lovewall_cms_rt' })}>
          {quote.lines.map((line, lineIdx) => renderQuoteLine(line, lineIdx, quote.lines.length))}
        </div>
      </div>
    </article>
  );
}

function HomeLovewallMarqueeRow({ quotes, direction }: HomeLovewallMarqueeRowProps) {
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const groupRef = React.useRef<HTMLDivElement>(null);

  useMarqueeTiming(marqueeRef, trackRef, groupRef, {
    pixelsPerSecond: 32,
    distanceProperty: '--lovewall-marquee-distance',
    durationProperty: '--lovewall-marquee-duration',
  });

  return (
    <div
      ref={marqueeRef}
      className={`lovewall-marquee lovewall-marquee--${direction}`}
      data-lovewall-direction={direction}
    >
      <div ref={trackRef} className='lovewall-marquee-track'>
        <div ref={groupRef} className='lovewall-marquee-group'>
          {quotes.map((quote) => (
            <LovewallQuoteCard key={quote.name} quote={quote} />
          ))}
        </div>
        <div className='lovewall-marquee-group' aria-hidden='true'>
          {quotes.map((quote) => (
            <LovewallQuoteCard key={`duplicate-${quote.name}`} quote={quote} isDuplicate />
          ))}
        </div>
      </div>
    </div>
  );
}

type HomeLovewallMarqueeProps = {
  topRowQuotes: readonly DeveloperQuote[];
  bottomRowQuotes: readonly DeveloperQuote[];
};

export function HomeLovewallMarquee({ topRowQuotes, bottomRowQuotes }: HomeLovewallMarqueeProps) {
  return (
    <div data-wf-el='lovewall_cms_list' data-splide='lovewall' className='lovewall-marquee-rows'>
      <HomeLovewallMarqueeRow quotes={topRowQuotes} direction='ltr' />
      <HomeLovewallMarqueeRow quotes={bottomRowQuotes} direction='rtl' />
    </div>
  );
}
