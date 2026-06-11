import React from 'react';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import { Link, useLocation } from 'react-router';
import { AnimatedHeaderLogo } from './animated-header-logo';
import clsx from 'clsx';
import GitHubLogoBlack from '~/svgs/github-logo-black.svg?react';
import statistics from '~/data/statistics.json';
import {
  COMPACT_NAV_CTA_FONT_SIZE,
  COMPACT_NAV_CTA_PADDING,
  COMPACT_NAV_DROPDOWN_ICON_SIZE,
  COMPACT_NAV_LINK_CLASS,
  COMPACT_NAV_LINK_GAP,
  DESKTOP_NAV_ITEMS,
  HEADER_CENTER_NAV_LINK,
  GET_OPENHANDS_CTA,
  HEADER_GET_OPENHANDS_URL,
  RESOURCE_LINK_GROUPS,
  PRODUCT_DROPDOWN_ITEMS,
  type ProductDropdownIcon,
} from '~/constants/site-shell';
import { MARKETING_NEUTRAL } from '~/constants/marketing-neutral-colors';
import { formatThousands } from '~/utils/format-thousands';
import { isPathActive, normalizePathname } from '~/utils/normalize-pathname';

const NAV_DROPDOWN_WIDTH = '880px';
const SHOW_TRY_IT_LIVE_HEADER_BUTTON = false;
const HOME_HERO_SENTINEL_SELECTOR = '[data-wf-el="hero-top"]';
const HOME_NAV_CTA_FADE_START_PX = 96;
const HOME_NAV_CTA_FADE_DISTANCE_PX = 160;
const RESOURCE_DROPDOWN_COLUMN_COUNT = Math.max(
  ...RESOURCE_LINK_GROUPS.map((group) => group.links.length),
);

const PRODUCT_ICON_WF_EL: Record<ProductDropdownIcon, string> = {
  canvas: 'bi-terminal',
  controlPlane: 'bi-box-seam',
};

function ProductDropdownIcon({ type }: { type: ProductDropdownIcon }) {
  const wfEl = PRODUCT_ICON_WF_EL[type];
  switch (type) {
    case 'canvas':
      return (
        <svg data-wf-el={wfEl} xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' viewBox='0 0 16 16'>
          <path d='M6 9a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9M3.854 4.146a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708z' />
          <path d='M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z' />
        </svg>
      );
    case 'controlPlane':
      return (
        <svg data-wf-el={wfEl} xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' viewBox='0 0 16 16'>
          <path d='M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z' />
        </svg>
      );
  }
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  Docs: <svg data-wf-el='bi-folder' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' viewBox='0 0 16 16'><path d='M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139q.323-.119.684-.12h5.396z' /></svg>,
  Manifesto: <svg data-wf-el='bi-file-text' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' viewBox='0 0 16 16'><path d='M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z' /><path d='M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1' /></svg>,
  Blog: <svg data-wf-el='bi-card-text' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' viewBox='0 0 16 16'><path d='M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z' /><path d='M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8m0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5' /></svg>,
  Press: <svg data-wf-el='bi-briefcase' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' viewBox='0 0 16 16'><path d='M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5m1.886 6.914L15 7.151V12.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V7.15l6.614 1.764a1.5 1.5 0 0 0 .772 0M1.5 4h13a.5.5 0 0 1 .5.5v1.616L8.129 7.948a.5.5 0 0 1-.258 0L1 6.116V4.5a.5.5 0 0 1 .5-.5' /></svg>,
  Careers: <svg data-wf-el='bi-search' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' viewBox='0 0 16 16'><path d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0' /></svg>,
  About: <svg data-wf-el='bi-info-circle' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' viewBox='0 0 16 16'><path d='M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16' /><path d='m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0' /></svg>,
  Contact: <svg data-wf-el='bi-envelope' xmlns='http://www.w3.org/2000/svg' width='100%' fill='currentColor' viewBox='0 0 16 16'><path d='M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z' /></svg>,
};

function ResourceDropdownIcon({ name }: { name: string }) {
  return <>{RESOURCE_ICONS[name] ?? null}</>;
}

const NAV_LINK_STYLE: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  height: '100%',
  padding: '0 8px',
};

const NAV_CTA_BASE_STYLE: React.CSSProperties = {
  padding: '0.9em 1.9em',
  margin: 0,
  borderRadius: '8px',
  textDecoration: 'none',
  textDecorationThickness: 'auto',
  textUnderlineOffset: 'auto',
  cursor: 'auto',
  gap: '6.4px',
};


const NAV_DROPDOWN_LINK_CLASS = 'nav_links_link is-dropdown nav-dropdown-link';

const NAV_DROPDOWN_LINK_STYLE: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  gap: '8px',
  width: '100%',
  height: '100%',
  minHeight: '100%',
  flex: '1 1 auto',
  color: 'rgb(247, 243, 238)',
  fontSize: '16px',
  lineHeight: '22.4px',
  textDecoration: 'none',
};

const NAV_DROPDOWN_ITEM_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  height: '100%',
  minHeight: '100%',
};

const NAV_DROPDOWN_WRAP_CLASS =
  'absolute top-full z-50 origin-top-left scale-95 opacity-0 pointer-events-none transition data-[open=true]:scale-100 data-[open=true]:opacity-100 data-[open=true]:pointer-events-auto';

const NAV_DROPDOWN_PANEL_STYLE: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
  backgroundColor: MARKETING_NEUTRAL.dropdownBg,
  color: 'rgb(247, 243, 238)',
  borderRadius: '16px',
  padding: '23px',
  boxShadow: 'none',
  width: NAV_DROPDOWN_WIDTH,
};

const PRODUCT_DROPDOWN_LINK_STYLE: React.CSSProperties = {
  ...NAV_DROPDOWN_LINK_STYLE,
  width: '100%',
  height: '100%',
  minHeight: 0,
  flex: '1 1 auto',
};

const PRODUCT_DROPDOWN_ITEM_STYLE: React.CSSProperties = {
  ...NAV_DROPDOWN_ITEM_STYLE,
  width: '100%',
  minWidth: 0,
  height: 'auto',
  minHeight: 0,
};

const PRODUCT_DROPDOWN_PANEL_STYLE: React.CSSProperties = {
  ...NAV_DROPDOWN_PANEL_STYLE,
  width: 'max-content',
  gap: 0,
};

function NavHeaderCtaButton({
  label,
  href,
  variant,
  blend,
  compact = false,
}: {
  label: string;
  href: string;
  variant: 'primary' | 'outline';
  blend?: number;
  compact?: boolean;
}) {
  const isOutline = variant === 'outline';
  const useScrollBlend = blend !== undefined;
  const resolvedBlend = blend ?? (variant === 'primary' ? 1 : 0);

  return (
    <div
      data-wf-el='button'
      className={clsx(
        'btn relative',
        useScrollBlend ? 'nav-header-cta' : isOutline ? 'btn-outline' : 'btn-primary',
      )}
      style={{
        ...NAV_CTA_BASE_STYLE,
        ...(compact
          ? {
              padding: COMPACT_NAV_CTA_PADDING,
              fontSize: COMPACT_NAV_CTA_FONT_SIZE,
              alignSelf: 'center',
            }
          : {}),
        ...(useScrollBlend
          ? ({ '--nav-cta-blend': resolvedBlend } as React.CSSProperties)
          : isOutline
            ? {
                backgroundColor: 'rgba(255,255,255,0.34)',
                borderColor: 'rgba(24, 24, 24, 0.12)',
                backdropFilter: 'blur(5px)',
              }
            : {}),
      }}
    >
      <div data-wf-el='btn-text' aria-hidden='true' style={{ whiteSpace: 'nowrap', cursor: 'auto', textUnderlineOffset: 'auto', pointerEvents: 'none', fontSize: compact ? COMPACT_NAV_CTA_FONT_SIZE : undefined }}>
        {label}
      </div>
      <a href={href} target='_blank' rel='noopener noreferrer' className='absolute inset-0' style={{ textDecoration: 'underline', textDecorationThickness: '1.6px' }}>
        <span className='sr-only'>{label}</span>
      </a>
    </div>
  );
}

interface HeaderProps {
  onClickMenuButton: () => void;
  onClickCloseMenuButton?: () => void;
  showMenuIcon?: boolean;
  width?: number;
  onClickGitHubButton?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showMenuIcon,
  onClickMenuButton,
  onClickCloseMenuButton,
  width = 1024,
}) => {
  const { scrollY } = useScroll();
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);
  const [textIsVisible, setTextIsVisible] = React.useState(true);
  const [resourcesOpen, setResourcesOpen] = React.useState(false);
  const [productOpen, setProductOpen] = React.useState(false);
  const isMobile = width < 768;
  const isCompact = width <= 1360;
  const menuOpen = showMenuIcon === false;
  const isHomePage = pathname === '/';
  const navLinkClass = COMPACT_NAV_LINK_CLASS;
  const navLinkGap = COMPACT_NAV_LINK_GAP;
  const navDropdownIconSize = COMPACT_NAV_DROPDOWN_ICON_SIZE;
  const navLinkStyle: React.CSSProperties = { ...NAV_LINK_STYLE, height: 'auto' };
  const navGitHubClass = clsx(
    'flex items-center gap-[4px] hover:opacity-80',
    COMPACT_NAV_LINK_CLASS,
  );
  const [homeNavCtaBlend, setHomeNavCtaBlend] = React.useState(isHomePage ? 0 : 1);

  const updateHomeNavCtaBlend = React.useCallback(() => {
    if (pathname !== '/') {
      setHomeNavCtaBlend(1);
      return;
    }

    const hero = document.querySelector(HOME_HERO_SENTINEL_SELECTOR);
    if (!hero) {
      setHomeNavCtaBlend(0);
      return;
    }

    const heroBottom = hero.getBoundingClientRect().bottom;
    const blend = Math.min(
      1,
      Math.max(0, (HOME_NAV_CTA_FADE_START_PX - heroBottom) / HOME_NAV_CTA_FADE_DISTANCE_PX),
    );
    setHomeNavCtaBlend(blend);
  }, [pathname]);

  React.useEffect(() => {
    updateHomeNavCtaBlend();
  }, [updateHomeNavCtaBlend]);

  React.useEffect(() => {
    setProductOpen(false);
    setResourcesOpen(false);
  }, [pathname]);

  const closeDropdownOnBlur = (
    event: React.FocusEvent<HTMLElement>,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  React.useEffect(() => {
    if (!isHomePage) {
      return;
    }

    const onScroll = () => {
      updateHomeNavCtaBlend();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isHomePage, updateHomeNavCtaBlend]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > 0) {
      setTextIsVisible(false);
    } else {
      setTextIsVisible(true);
    }

    updateHomeNavCtaBlend();
  });

  return (
    <nav
      data-wf-el='nav_wrap'
      data-nav-compact
      className={clsx('sticky top-0 left-0 right-0 z-50 w-full', menuOpen && 'is-menu-open')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: isMobile ? '69.3437px' : '83.578125px',
        backgroundColor: menuOpen ? 'rgb(24, 24, 24)' : 'rgb(247, 243, 238)',
        color: menuOpen ? 'rgb(247, 243, 238)' : 'rgb(24, 24, 24)',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        containerType: 'inline-size' as React.CSSProperties['containerType'],
      }}
    >
      <div data-wf-el='nav_contain' style={{ display: 'block', width: '95%', marginLeft: 'auto', marginRight: 'auto' }}>
        <div
          data-wf-el='nav_grid'
          className='hidden lg:grid'
          style={{
            display: isCompact ? 'none' : 'grid',
            gap: '16px',
            gridTemplateColumns: '1fr min-content 1fr',
            alignContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div className='flex items-center justify-start'>
            {/* Live's `.nav_logo_link` has an explicit `width: 192px` —
              * the SVG natural size is 195×30 but the link clamps it. */}
            <Link data-wf-el='nav_logo_link' to='/' className='w-inline-block' style={{ width: '192px', lineHeight: '16px', textDecorationLine: 'underline', textDecorationThickness: '1.6px', color: 'rgb(255, 255, 139)', alignSelf: 'center', position: 'relative', maxWidth: '100%' }}>
              <AnimatedHeaderLogo renderText={textIsVisible} />
            </Link>
          </div>

          <div className='flex items-center justify-center'>
            <ul
              data-wf-el='nav_links_list'
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: navLinkGap,
                alignItems: 'center',
                width: 'min-content',
                position: 'relative',
              }}
            >
              {/* Product dropdown */}
              <li
                data-wf-el='nav_links_li'
                className='group relative'
                style={{ display: 'list-item' }}
                onMouseLeave={() => setProductOpen(false)}
                onFocus={() => setProductOpen(true)}
                onBlur={(event) => closeDropdownOnBlur(event, setProductOpen)}
              >
                <a
                  href='/product'
                  data-wf-el='nav_links_link'
                  className={clsx(
                    // `w-inline-block` mirrors live's Webflow utility on
                    // dropdown-trigger anchors (sets max-width: 100%).
                    // Live's "Product" dropdown trigger is NOT highlighted when on
                    // /product subroutes — it stays brand-fg. Active highlight is
                    // applied per-item inside the dropdown only.
                    'w-inline-block hover:text-[#565656]',
                    navLinkClass,
                  )}
                  style={navLinkStyle}
                  onMouseEnter={() => setProductOpen(true)}
                  onFocus={() => setProductOpen(true)}
                  onClick={(e) => { e.preventDefault(); setProductOpen(true); }}
                >
                  <div>Product</div>
                  <div data-wf-el='nav_links_icon' className={clsx('transition-transform', productOpen && 'rotate-180')} style={{ display: 'block', width: navDropdownIconSize, height: navDropdownIconSize, cursor: 'pointer', textAlign: 'start' }}>
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' style={{ width: '100%' }}>
                      <path d='M16.293 9.29297L12 13.586L7.70697 9.29297L6.29297 10.707L12 16.414L17.707 10.707L16.293 9.29297Z' fill='currentColor' />
                    </svg>
                  </div>
                </a>
                <div
                  data-wf-el='nav_links_dropdown_wrap'
                  className={clsx(NAV_DROPDOWN_WRAP_CLASS, 'left-0')}
                  data-open={productOpen}
                  style={{ paddingTop: '8px', width: 'max-content' }}
                  onMouseEnter={() => setProductOpen(true)}
                >
                  <div data-wf-el='nav_links_dropdown' style={PRODUCT_DROPDOWN_PANEL_STYLE}>
                    <div data-wf-el='nav_links_dropdown_group' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', margin: 0 }}>
                      <ul
                        data-wf-el='nav_links_list'
                        className='is-dropdown'
                        style={{
                          position: 'relative',
                          display: 'grid',
                          gridTemplateColumns: `repeat(${PRODUCT_DROPDOWN_ITEMS.length}, minmax(0, 1fr))`,
                          alignItems: 'stretch',
                          gap: '21.6px',
                          margin: 0,
                          padding: 0,
                          width: 'max-content',
                        }}
                      >
                        {PRODUCT_DROPDOWN_ITEMS.map((item) => (
                          <li data-wf-el='nav_links_li' className='is-dropdown' key={item.name} style={PRODUCT_DROPDOWN_ITEM_STYLE}>
                            <Link
                              to={item.to}
                              data-wf-el='nav_links_link'
                              className={NAV_DROPDOWN_LINK_CLASS}
                              style={PRODUCT_DROPDOWN_LINK_STYLE}
                              onClick={() => setProductOpen(false)}
                            >
                              <div data-wf-el='nav_links_dropdown_icon' className='flex-shrink-0' style={{ display: 'flex', width: '30px', height: '30px', padding: '7px', color: 'rgb(255, 255, 139)', backgroundColor: 'rgb(0, 0, 0)', borderRadius: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                <ProductDropdownIcon type={item.icon} />
                              </div>
                              <div>{item.name}</div>
                              <p data-wf-el='nav_links_subtext' style={{ margin: 0, color: 'rgb(179, 168, 140)', fontSize: '14.4px', lineHeight: '21.6px' }}>{item.description}</p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
              {/* Remaining nav items (skip Product since it's handled above) */}
              {DESKTOP_NAV_ITEMS.filter(item => item.name !== 'Product').map((item) => (
                <li data-wf-el='nav_links_li' key={item.name} style={{ display: 'list-item' }}>
                  {item.external ? (
                    <a
                      href={item.to}
                      target='_blank'
                      rel='noopener noreferrer'
                      data-wf-el='nav_links_link'
                      className={clsx(navLinkClass, 'hover:text-[#565656]')}
                      style={navLinkStyle}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      to={item.to}
                      data-wf-el='nav_links_link'
                      className={clsx(
                        navLinkClass,
                        'hover:text-[#565656]',
                        // Live openhands.dev only tints the *Home* nav link when active;
                        // other links (Community/Pricing/etc.) stay default brand-fg even
                        // on their own page. Tinting them produced parity color diffs.
                        item.to === '/' && isPathActive(pathname, item.to) && 'text-[#565656]'
                      )}
                      style={navLinkStyle}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
              <li data-wf-el='nav_links_li' style={{ display: 'list-item' }}>
                <a
                  href={HEADER_CENTER_NAV_LINK.to}
                  target='_blank'
                  rel='noopener noreferrer'
                  data-wf-el='nav_links_link'
                  className={clsx(navLinkClass, 'hover:text-[#565656]')}
                  style={navLinkStyle}
                >
                  {HEADER_CENTER_NAV_LINK.name}
                </a>
              </li>
              {/* Resources dropdown */}
              <li
                data-wf-el='nav_links_li'
                className='group relative'
                style={{ display: 'list-item' }}
                onMouseLeave={() => setResourcesOpen(false)}
                onFocus={() => setResourcesOpen(true)}
                onBlur={(event) => closeDropdownOnBlur(event, setResourcesOpen)}
              >
                <button
                  className={clsx('flex items-center gap-1 hover:text-[#565656]', navLinkClass)}
                  style={{ ...navLinkStyle, cursor: 'default' }}
                  onMouseEnter={() => setResourcesOpen(true)}
                  onFocus={() => setResourcesOpen(true)}
                  onClick={() => setResourcesOpen(true)}
                  type='button'
                >
                  <div>Resources</div>
                  <div data-wf-el='nav_links_icon' className={clsx('transition-transform', resourcesOpen && 'rotate-180')} style={{ display: 'block', width: navDropdownIconSize, height: navDropdownIconSize, cursor: 'default', textAlign: 'center' }}>
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' style={{ width: '100%' }}>
                      <path d='M16.293 9.29297L12 13.586L7.70697 9.29297L6.29297 10.707L12 16.414L17.707 10.707L16.293 9.29297Z' fill='currentColor' />
                    </svg>
                  </div>
                </button>
                <div
                  data-wf-el='nav_links_dropdown_wrap'
                  className={clsx(NAV_DROPDOWN_WRAP_CLASS, 'left-0 right-0 origin-top-right')}
                  data-open={resourcesOpen}
                  style={{ paddingTop: '8px', width: NAV_DROPDOWN_WIDTH }}
                  onMouseEnter={() => setResourcesOpen(true)}
                >
                  <div data-wf-el='nav_links_dropdown' style={NAV_DROPDOWN_PANEL_STYLE}>
                    {RESOURCE_LINK_GROUPS.map((group) => (
                      <div key={group.title} data-wf-el='nav_links_dropdown_group' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '24px', margin: 0, width: '100%' }}>
                        <div data-wf-el='dropdown-eyebrow' className='eyebrow u-mb-0 font-mono' style={{ margin: 0, color: 'rgb(247, 243, 238)', fontSize: '14.08px', lineHeight: '16.896px' }}>
                          {group.title}
                        </div>
                        <ul data-wf-el='nav_links_list' className='is-dropdown' style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${RESOURCE_DROPDOWN_COLUMN_COUNT}, 1fr)`, justifyContent: 'center', alignItems: 'stretch', gap: '21.6px', margin: 0, padding: 0, width: '100%' }}>
                          {group.links.map((resItem) => (
                            <li data-wf-el='nav_links_li' className='is-dropdown' key={resItem.name} style={NAV_DROPDOWN_ITEM_STYLE}>
                              {resItem.external ? (
                                <a
                                  href={resItem.to}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  data-wf-el='nav_links_link'
                                  className={NAV_DROPDOWN_LINK_CLASS}
                                  style={NAV_DROPDOWN_LINK_STYLE}
                                  onClick={() => setResourcesOpen(false)}
                                >
                                  <div data-wf-el='nav_links_dropdown_icon' className='flex-shrink-0' style={{ display: 'flex', width: '30px', height: '30px', padding: '7px', color: 'rgb(255, 255, 139)', backgroundColor: 'rgb(0, 0, 0)', borderRadius: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                    <ResourceDropdownIcon name={resItem.name} />
                                  </div>
                                  <div>{resItem.name}</div>
                                </a>
                              ) : (
                                <Link
                                  to={resItem.to}
                                  data-wf-el='nav_links_link'
                                  className={NAV_DROPDOWN_LINK_CLASS}
                                  style={NAV_DROPDOWN_LINK_STYLE}
                                  onClick={() => setResourcesOpen(false)}
                                >
                                  <div data-wf-el='nav_links_dropdown_icon' className='flex-shrink-0' style={{ display: 'flex', width: '30px', height: '30px', padding: '7px', color: 'rgb(255, 255, 139)', backgroundColor: 'rgb(0, 0, 0)', borderRadius: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                    <ResourceDropdownIcon name={resItem.name} />
                                  </div>
                                  <div>{resItem.name}</div>
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div
            data-wf-el='nav_right'
            className='flex flex-shrink-0 items-center gap-5 self-center'
            style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}
          >
              <a
                data-wf-el='nav-menu_gh_count'
                href='https://github.com/OpenHands/OpenHands'
                target='_blank'
                rel='noopener noreferrer'
                className={navGitHubClass}
                style={{ justifyContent: 'center', alignSelf: 'center' }}
              >
                <div data-wf-el='nav-menu_gh_icon'><GitHubLogoBlack data-wf-el='bi-github' className='h-4 w-4 flex-shrink-0' style={{ width: '16px', height: '16px', verticalAlign: 'baseline' }} /></div>
                <div data-wf-el='nav-menu_gh_num' style={{ fontSize: '12.96px', lineHeight: '18.144px' }}><span style={{ fontWeight: 400 }}>{formatThousands(statistics.stargazers)}</span></div>
              </a>
              {SHOW_TRY_IT_LIVE_HEADER_BUTTON ? (
                <NavHeaderCtaButton label={GET_OPENHANDS_CTA.label} href={GET_OPENHANDS_CTA.href} variant='outline' />
              ) : null}
              <NavHeaderCtaButton
                label='Get OpenHands'
                href={HEADER_GET_OPENHANDS_URL}
                variant={homeNavCtaBlend >= 0.5 ? 'primary' : 'outline'}
                blend={isHomePage ? homeNavCtaBlend : 1}
                compact
              />
            </div>
        </div>

        {/* Compact nav: live keeps the CTA buttons and Menu control until the full nav fits. */}
        <div className='compact-nav mobile-nav flex items-center justify-between' style={{ display: isCompact ? 'flex' : 'none' }}>
          <Link data-wf-el='nav_logo_link' to='/' aria-label='Go to Home' className='compact-nav-logo mobile-nav-logo w-inline-block'>
            <img data-wf-el='nav_logo_img' src='/assets/webflow/brand/openhands-logo-mobile.svg' alt='' />
          </Link>
          <div data-wf-el='nav_right' className='compact-nav-right'>
            {!isMobile ? (
              <>
                <a
                  data-wf-el='nav-menu_gh_count'
                  href='https://github.com/OpenHands/OpenHands'
                  target='_blank'
                  rel='noopener noreferrer'
                  className={navGitHubClass}
                  style={{ justifyContent: 'center', alignSelf: 'center' }}
                >
                  <div data-wf-el='nav-menu_gh_icon'><GitHubLogoBlack data-wf-el='bi-github' className='h-4 w-4 flex-shrink-0' style={{ width: '16px', height: '16px', verticalAlign: 'baseline' }} /></div>
                  <div data-wf-el='nav-menu_gh_num' style={{ fontSize: '12.96px', lineHeight: '18.144px' }}><span style={{ fontWeight: 400 }}>{formatThousands(statistics.stargazers)}</span></div>
                </a>
                {SHOW_TRY_IT_LIVE_HEADER_BUTTON ? (
                  <NavHeaderCtaButton label={GET_OPENHANDS_CTA.label} href={GET_OPENHANDS_CTA.href} variant='outline' />
                ) : null}
                <NavHeaderCtaButton
                label='Get OpenHands'
                href={HEADER_GET_OPENHANDS_URL}
                variant={homeNavCtaBlend >= 0.5 ? 'primary' : 'outline'}
                blend={isHomePage ? homeNavCtaBlend : 1}
                compact
              />
              </>
            ) : null}
            <button
              type='button'
              className={clsx('nav_hamburger_button mobile-menu-button', menuOpen && 'is-open')}
              aria-label={menuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={menuOpen}
              onClick={menuOpen ? onClickCloseMenuButton ?? onClickMenuButton : onClickMenuButton}
            >
              <span className='nav_hamburger_text' aria-hidden='true'>Menu</span>
              <span className='nav_hamburger_text' aria-hidden='true'>Close</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
