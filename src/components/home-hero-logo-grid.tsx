import React from 'react';
import { HOME_CUSTOMER_LOGOS } from '~/constants/customer-logos';

type HomeHeroLogoGridProps = {
  logoMarqueeRef: React.RefObject<HTMLDivElement | null>;
  logoMarqueeTrackRef: React.RefObject<HTMLDivElement | null>;
  logoMarqueeGroupRef: React.RefObject<HTMLDivElement | null>;
};

export function HomeHeroLogoGrid({
  logoMarqueeRef,
  logoMarqueeTrackRef,
  logoMarqueeGroupRef,
}: HomeHeroLogoGridProps) {
  return (
    <div data-wf-el='logo-grid-component_wrap' className='w-full' style={{ paddingTop: '80px', paddingBottom: '80px' }}>
      <div data-wf-el='logo-grid-component_heading_container' className='mx-auto max-w-[1238px]' style={{ textAlign: 'center' }}>
        <div
          data-wf-el='logo-grid-component_heading_heading'
          className='fluid-h4 w-full text-center font-medium text-brand-fg'
          style={{ letterSpacing: '-0.02em', marginBottom: '9.6px' }}
        >
          Trusted by engineers at
        </div>
      </div>
      <div data-wf-el='logo-grid-component_container' className='mx-auto max-w-[1238px]'>
        <div data-wf-el='logo-grid-component_cms_wrap' style={{ paddingTop: '24px' }}>
          <div data-wf-el='logo-grid-component_cms_list' className='logo-grid logo-marquee' ref={logoMarqueeRef}>
            <div className='logo-marquee-track' ref={logoMarqueeTrackRef}>
              <div className='logo-marquee-group' ref={logoMarqueeGroupRef}>
                {HOME_CUSTOMER_LOGOS.map((logo) => (
                  <img key={logo.name} src={logo.src} alt={logo.alt} />
                ))}
              </div>
              <div className='logo-marquee-group' aria-hidden='true'>
                {HOME_CUSTOMER_LOGOS.map((logo) => (
                  <img key={`duplicate-${logo.name}`} src={logo.src} alt='' />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
