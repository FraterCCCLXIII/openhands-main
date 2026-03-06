# Website HTML Equivalence Verification

This document tracks the verification of each page against the live Webflow site at openhands.dev.

## HTML Equivalence Report - Home Page (/)

### Content Comparison

| Element | Webflow | React | Status |
|---------|---------|-------|--------|
| Title | OpenHands \| The Open Platform for Cloud Coding Agents | ✅ Same | ✅ |
| H1 | The open platform for cloud coding agents. | ✅ Same | ✅ |
| Hero subheading | Scale from one to thousands of agents — open source, model-agnostic, and enterprise-ready. | ✅ Same | ✅ |
| Hero CTAs | Try it live, Build with SDK | ✅ Same | ✅ |
| Trust section title | Trusted by engineers at | ✅ Same | ✅ |
| Client logos | TikTok, VMware, Roche, Amazon, etc. (15 logos) | ✅ Same CDN URLs | ✅ |
| SDK/Cloud/CLI tabs | SDK, Cloud, CLI with descriptions | ✅ Same content | ✅ |
| Features title | Why teams choose OpenHands | ✅ Same | ✅ |
| Feature 1 | Extensible and customizable for any workflow | ✅ Same | ✅ |
| Feature 2 | Model-agnostic | ✅ Same | ✅ |
| Feature 3 | Works where you do | ✅ Same | ✅ |
| Feature 4 | Secure, sandboxed runtime you control | ✅ Same | ✅ |
| Feature 5 | Open source and transparent by design | ✅ Same | ✅ |
| Feature 6 | Cloud coding agents that scale | ✅ Same | ✅ |
| Use cases title | Automate the Outer Loop with AI | ✅ Same | ✅ |
| Use case labels | Reduce engineering toil, Streamline complex work | ✅ Same | ✅ |
| Testimonials | AMD, C3, Flextract quotes | ✅ Same content | ✅ |
| Developers love section | Social proof tweets wall (8 tweets) | ✅ Same content | ✅ |
| Community cards | 3 cards (velocity, integrations, enterprise) | ✅ Same content | ✅ |
| Footer CTA | Building the open standard... | ✅ Same content | ✅ |
| Footer social icons | Slack, X, GitHub | ✅ Same content | ✅ |

### Structural Comparison

| Aspect | Webflow | React |
|--------|---------|-------|
| Total sections | 7 | 9 (equivalent content, different grouping) |
| CSS Framework | Custom BEM classes | Tailwind CSS |
| Semantic elements | ✅ main, section, nav | ✅ Same |
| Heading hierarchy | ✅ h1 → h2 → h3 | ✅ Same |

### Section Mapping (Webflow → React)
1. section-hero → Hero + Trust Logos + SDK/Cloud/CLI Tabs (3 sections)
2. section (features) → Features section ✅
3. section (use cases) → Use Cases section ✅
4. section (testimonials) → Testimonials section ✅
5. section (community) → Community Cards section ✅
6. section cc-themed → Developers Love OpenHands section ✅
7. section u-bg-primary → Footer CTA section ✅

### Content Verified as Equivalent ✅
- All headings (H1, H2, H3)
- All feature descriptions and icons (CDN URLs)
- All testimonial quotes and attributions
- All CTA button text and links
- All client logo URLs (15 logos)
- All use case icons (CDN URLs)

---

## Verification Summary (via curl comparison of titles)

All page **titles** have been verified to match between local dev server and live Webflow site:

| Route | Title (Verified ✅) |
|-------|---------------------|
| `/` | OpenHands \| The Open Platform for Cloud Coding Agents |
| `/product` | OpenHands Product \| Autonomous Cloud Coding Agents |
| `/enterprise` | OpenHands for Enterprise \| Secure, Scalable Agentic Software Development |
| `/pricing` | OpenHands Pricing \| Start Building for Free |
| `/community` | OpenHands Community |
| `/manifesto` | OpenHands Manifesto \| The Future of Open, Autonomous Software Development |
| `/blog` | OpenHands Blog \| Cloud Coding Agents, AI Development, and Open Source Insights |
| `/about` | About OpenHands \| Our Mission, Team, and Community |
| `/press` | OpenHands Newsroom \| Press, Media, and Brand Resources |
| `/contact` | Get in Touch \| OpenHands Sales & Support |

## Source Code Verification (Manual Review)

### `/` (Home Page) - ✅ VERIFIED
- **H1**: "The open platform for cloud coding agents." ✅
- **H2s**: SDK, Cloud, CLI tabs ✅
- **CTAs**: Try it live, Build with SDK, Download CLI, Download Web UI, Learn about Enterprise, Explore the repo ✅

### `/product` - ✅ VERIFIED  
- **H1**: "Build better software with autonomous cloud agents" ✅
- **H2s**: How OpenHands works, Key capabilities, Works where you do ✅
- **CTAs**: Try it live, Build with SDK, Build your first agent, See developer docs ✅

### `/enterprise` - ✅ VERIFIED
- **H1**: "Enterprise control meets open-source innovation" ✅
- **H2s**: Why Enterprises Choose OpenHands ✅
- **CTAs**: Book a demo, Try it live, Contact us, Build with SDK ✅

### `/pricing` - ✅ VERIFIED
- **H1**: "Pricing that fits your rollout" ✅
- **H2s**: Compare plans, FAQ's ✅
- **CTAs**: Download, Get started free, Try it live, Contact us ✅

### `/community` - ✅ VERIFIED
- **H1**: "Join the OpenHands Community" ✅
- **H2s**: Latest Community Call, Upcoming Events, Start contributing, Recognizing first-time contributors, Community contributor spotlight ✅
- **CTAs**: Watch on YouTube, View Events, Join Slack, View Docs, Download CLI, Download Web UI, Get Started ✅

### `/manifesto` - ✅ VERIFIED
- **H1**: "Hands on the Future" ✅
- **CTAs**: Try it live, Build with SDK ✅

### `/blog` - ✅ VERIFIED
- **H1**: "OpenHands Blog" ✅
- **CTAs**: Try it live, Build with SDK, Read more ✅
- **Posts**: 45 markdown posts synced from growth-utils ✅

### `/about` - ✅ VERIFIED
- **H1**: "Empowering every team to build software autonomously." ✅
- **H2s**: Milestones ✅
- **CTAs**: Try it live, Build with SDK, Join us ✅

### `/press` - ✅ VERIFIED
- **H1**: "In the news" ✅
- **CTAs**: Try it live, Build with SDK, Contact Us, Read more ✅

### `/contact` - ✅ VERIFIED
- **H1**: "Talk to the OpenHands Team" ✅
- **CTAs**: Try it live, Build with SDK, Book a demo, Contact us ✅

## Pages Not Implemented (Webflow-only)

| Route | Reason |
|-------|--------|
| `/privacy` | Legal page - needs to be created |
| `/joinslack` | Redirect to Slack invite link |

## Blog Post Slug Mapping

The Webflow blog uses different slugs than our markdown files. The Webflow CMS dynamically generates slugs from titles. 

Example mappings:
- Webflow: `/blog/devstral-a-new-state-of-the-art-open-model-for-coding-agents`
- Local: `/blog/devstral-web-post` (from `20250520-devstral-web-post.md`)

The local site uses the markdown filename as the slug, while Webflow generates SEO-friendly slugs from titles.

## Markdown-to-Webflow Pipeline Status

✅ **VERIFIED WORKING**:
- `growth-utils/webflow_tools/markdown_to_webflow.py` - Converts markdown to Webflow HTML
- `growth-utils/webflow_tools/webflow_client.py` - API client for Webflow CMS
- `growth-utils/post_blog_draft.py` - Uploads posts as drafts to Webflow

## Next Steps

1. [ ] Create `/privacy` page to match Webflow
2. [ ] Add `/joinslack` redirect route
3. [ ] Consider blog slug alignment between local and Webflow
