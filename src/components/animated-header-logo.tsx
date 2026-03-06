import React from 'react';

interface AnimatedHeaderLogoProps {
  renderText?: boolean;  // kept for API compatibility but ignored
}

// Match openhands.dev: single combined logo image, always shows full "OpenHands" text
export const AnimatedHeaderLogo: React.FC<AnimatedHeaderLogoProps> = () => {
  return (
    // Match openhands.dev nav_logo_link: width 12rem (192px)
    <picture className='nav_logo_img' style={{ width: '192px', height: '29.5px' }}>
      {/* Mobile: smaller logo for narrow screens */}
      <source
        media='(max-width: 85rem)'
        srcSet='/assets/webflow/brand/openhands-logo-mobile.svg'
      />
      {/* Desktop: full logo with text */}
      <img
        src='/assets/webflow/brand/openhands-logo-full.svg'
        alt='OpenHands'
        className='h-full w-auto'
        style={{ height: '29.5px' }}
      />
    </picture>
  );
};
