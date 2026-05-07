import React from 'react';

interface AnimatedHeaderLogoProps {
  renderText?: boolean;  // kept for API compatibility but ignored
}

// Match openhands.dev: live renders a single <img class="nav_logo_img"/> with
// computed display:inline, max-width:100%, vertical-align:baseline, and an
// auto-derived height from the SVG aspect ratio (192×26 at desktop).
// Wrapping the image in a <picture> element creates a redundant inline-block
// wrapper that mismatches the live nav_logo_img layout, so we render the img
// directly.
export const AnimatedHeaderLogo: React.FC<AnimatedHeaderLogoProps> = () => {
  return (
    <img
      data-wf-el='nav_logo_img'
      className='nav_logo_img'
      src='/assets/webflow/brand/logo.svg'
      alt=''
      style={{
        // Live computes: display: inline; width: 100%; height: auto;
        // max-width: 100%; vertical-align: baseline. The 192px width is
        // achieved by the parent .nav_logo_link being 192px wide and the
        // img filling its container.
        // Live's .nav_logo_img sits inside .nav_logo_link.w-inline-block
        // and Webflow's base.css forces images inside `.w-inline-block`
        // wrappers to `display: inline-block; vertical-align: middle;
        // max-width: 100%`.  Mirror those exactly.
        display: 'inline-block',
        width: '100%',
        height: 'auto',
        maxWidth: '100%',
        verticalAlign: 'middle',
      }}
    />
  );
};
