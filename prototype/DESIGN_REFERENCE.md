# OpenHands Webflow Design Reference

This document captures the design system from the live Webflow site at openhands.dev for prototyping modifications.

## Color Palette

### Primary Colors
- **Background**: `#f9f0d9` (warm cream/beige)
- **Foreground/Text**: `#22150d` (dark brown/black)
- **Accent**: `#e8ff4f` / `rgb(232, 255, 79)` (bright yellow-green)

### Secondary Colors
- **Dark Background Sections**: `#22150d` (used in feature cards, footer CTA)
- **Card Background**: Dark variant of primary

### Text Colors
- Primary text: `#22150d`
- Secondary/Muted text: Slightly lighter brown
- Light text (on dark backgrounds): `#f9f0d9`

## Typography

### Font Family
- Primary: System fonts / Inter-like sans-serif
- Monospace: `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`

### Font Sizes
- H1 Hero: ~56px (large, bold)
- H2 Section: ~40px
- H3 Feature: ~24px
- Body: 16-18px
- Small/Caption: 14px

## Layout Structure

### Header
- Fixed navigation bar with cream background
- Logo (OpenHands hands icon + text) on left
- Navigation links: Product, Enterprise, Pricing, Benchmarks, Community, Resources (dropdown)
- Right side: GitHub stars count (68K), "Build with SDK" outline button, "Try it live" filled button (yellow accent)

### Hero Section
- ASCII art background (subtle, low opacity)
- Large centered H1 headline
- Subheading text
- Two CTA buttons centered below

### Logo Carousel
- "Trusted by engineers at" section
- Horizontal scrolling logos (TikTok, VMware, Roche, Amazon, Cloudera, Fujitsu, C3.ai, Netflix, Mastercard, Red Hat, MongoDB, Apple, NVIDIA, Google, AMD)

### SDK/Cloud/CLI Tabs
- Three tab buttons at top
- Each tab shows:
  - Left: Title, description, CTA button
  - Right: Screenshot/preview image

### "Why teams choose OpenHands" Section
- Grid of 6 feature cards with icons
- Yellow icons on dark backgrounds
- Each card: Icon, Title, Description

### "Automate the Outer Loop with AI"
- Two subsections: "Reduce engineering toil" and "Streamline complex work"
- 3 cards per subsection
- Icons + Title + Description

### Testimonials Carousel
- Large quote text
- Person photo + name + title
- Company logo
- Carousel navigation dots

### Community Section
- Split layout: left text + stats, right icons
- GitHub stars counter (68K+)
- Integration icons (CI/CD, Slack, GitHub, GitLab)

### Enterprise Section
- Left: Yellow accent title, description, CTA button
- Right: Shield/security icon

### Social Proof (Twitter/X)
- Grid of tweet cards
- User avatar, name, handle
- Tweet content

### Footer CTA
- Dark background
- "Building the open standard..." heading
- CTAs: Build with SDK, Try it live
- Social icons: Slack, X/Twitter, GitHub

### Footer Navigation
- Links organized in columns
- Home, Product, Enterprise, Pricing, About
- Resources: Community, Manifesto, Docs, Blog, Press, Careers
- Contact
- Copyright + Privacy Policy

## Button Styles

### Primary Button (Yellow)
```css
background-color: #e8ff4f;
color: #22150d;
border-radius: 100px;
padding: 12px 24px;
font-weight: 500;
```

### Secondary Button (Outline)
```css
background-color: transparent;
color: #22150d;
border: 1px solid #22150d;
border-radius: 100px;
padding: 12px 24px;
```

### Button on Dark Background
```css
background-color: #f9f0d9;
color: #22150d;
/* Or */
border: 1px solid #f9f0d9;
color: #f9f0d9;
```

## Icons
- Custom line icons in yellow color (#e8ff4f)
- Used in feature cards
- Consistent stroke width and style

## Spacing
- Section padding: ~80-120px vertical
- Container max-width: ~1200px
- Card gap: ~24-32px

## Animation Effects
- ASCII art background has subtle animation
- Logo carousel infinite scroll
- Testimonial carousel auto-play
- Smooth scroll behavior

## Key Visual Elements

### ASCII Art Background
- Cream colored text characters
- Very low opacity (~12%)
- Monospace font
- Creates texture without distraction

### Cards
- Rounded corners (8-16px)
- Dark background on feature cards
- Slight shadow/elevation on light cards

## CDN Assets

### Logo
- Main: `https://cdn.prod.website-files.com/68ff4057b35616cdd47d5ac7/6903891b9597f86d920507d1_Logo.svg`
- Black version: `https://cdn.prod.website-files.com/68ff4057b35616cdd47d5ac7/6908d2235830415ac045d25d_openhands_logo_black.svg`

### Feature Icons
- Located at `https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/`
- Various SVG files for each feature

### Client Logos
- Located at `https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/`
- SVG format for scalability

## Responsive Behavior
- Desktop-first design
- Tablet breakpoint: ~992px
- Mobile breakpoint: ~768px
- Mobile: Hamburger menu, stacked layouts, smaller typography
