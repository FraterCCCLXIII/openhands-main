import React from 'react';
import { Link } from 'react-router';
import { domAnimation, LazyMotion, m } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  GitPullRequest,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';
import type { Route } from './+types/home';
import statistics from '~/data/statistics.json';
import { Footer } from '~/components/footer';
import { getRouteFooterProps } from '~/constants/route-layout';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { FAQ_TRIGGER_DIVIDER, CLOSED_FAQ_ITEM_PROPS } from '~/components/faq-accordion';
import { formatThousands } from '~/utils/format-thousands';
import { ASCIIAnimation } from '~/components/ascii-animation';
import { createSocialPreviewMeta } from '~/utils/seo';
import { EnterpriseLogoStrip } from '~/components/logos/enterprise-logo-strip';
import { HOME_CUSTOMER_LOGOS } from '~/constants/customer-logos';
import { ASCII_HOLE_IMAGE, ASCII_HOLE_IMAGE_1080 } from '~/constants/webflow-assets';


const INSTALL_OPENHANDS_URL = 'https://docs.openhands.dev/openhands/usage/run-openhands/local-setup';

const HERO_COMPATIBILITY_BADGES = [
  {
    name: 'Claude Code',
    iconText: '</>',
    iconBg: 'rgb(242, 173, 118)',
  },
  {
    name: 'Codex',
    iconText: 'C',
    iconBg: 'rgb(155, 182, 255)',
  },
  {
    name: 'Gemini CLI',
    iconText: '✦',
    iconBg: 'rgb(135, 214, 255)',
  },
  {
    name: 'OpenHands',
    iconSrc: '/assets/webflow/brand/openhands-logo-mobile.svg',
    iconAlt: '',
    iconBg: 'rgb(255, 255, 139)',
  },
];

const HERO_AUTOMATIONS_IMAGE =
  '/assets/webflow/blog/openhands-enterprise-agent-control-plane/20260506-openhands-enterprise-agent-control-plane-automations.png';

type WorkflowItem = {
  title: string;
  description: string;
  href: string;
  sdkHref: string;
  icon: LucideIcon;
  isLink?: boolean;
};

const WORKFLOWS: WorkflowItem[] = [
  {
    title: 'Fix Vulnerabilities',
    description: 'Scans repositories, fixes vulnerabilities, and opens reviewable PRs.',
    href: 'https://app.all-hands.dev/login',
    sdkHref: 'https://github.com/OpenHands/extensions/tree/main/plugins/vulnerability-remediation',
    icon: ShieldAlert,
  },
  {
    title: 'Review PRs',
    description: 'Reviews PRs for quality, security, and best practices.',
    href: 'https://app.all-hands.dev/login',
    sdkHref: 'https://github.com/OpenHands/extensions/tree/main/plugins/pr-review',
    icon: GitPullRequest,
  },
  {
    title: 'Migrate Code',
    description: 'Migrates legacy COBOL systems to Java with testing and validation built in.',
    href: 'https://app.all-hands.dev/login',
    sdkHref: 'https://github.com/OpenHands/extensions/tree/main/plugins/cobol-modernization',
    icon: ArrowRightCircle,
  },
  {
    title: 'Triage Incidents',
    description: 'Investigates errors, finds root causes, and posts actionable debugging insights.',
    href: 'https://app.all-hands.dev/login',
    sdkHref: 'https://github.com/OpenHands/software-agent-sdk/tree/main/examples/03_github_workflows/05_posthog_debugging',
    icon: TriangleAlert,
  },
  {
    title: 'See all use cases',
    description: '',
    href: 'https://docs.openhands.dev/openhands/usage/use-cases/overview',
    sdkHref: '',
    icon: Eye,
    isLink: true,
  },
];

function WorkflowCarouselIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div data-wf-el='capabilities_card_icon' className='flex h-9 w-9 flex-shrink-0 items-center justify-center text-brand-fg' aria-hidden='true'>
      <Icon className='h-6 w-6' strokeWidth={1.75} aria-hidden='true' />
    </div>
  );
}

function WorkflowDialogIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div data-modal-content='icon' className='dialog_top_icon flex items-center justify-center text-brand-fg' aria-hidden='true'>
      <Icon className='h-8 w-8' strokeWidth={1.75} aria-hidden='true' />
    </div>
  );
}

// Live homepage renders three stacked cards (SDK / Cloud / CLI) inside one
// "hero-content" column plus a hero-track of three images alongside, rather
// than a tabbed surface picker. Only the SDK card carries a CTA on live.
const SHOW_SDK_SURFACE = false;

const PRODUCT_SURFACES = [
  {
    title: 'SDK',
    description: 'Use the SDK to embed OpenHands into apps and workflows',
    href: 'https://docs.openhands.dev/sdk',
    cta: 'Get the SDK',
    image: '/assets/webflow/misc/691b30aa3c700dcb47a96c00_SDK.webp',
  },
  {
    title: 'Cloud',
    description: 'Plan and execute complex tasks via the desktop or mobile web',
    href: 'https://app.all-hands.dev/',
    cta: '',
    image: '/assets/webflow/misc/691b30afadf69b956d353513_Cloud.webp',
  },
  {
    title: 'CLI',
    description: 'Pair with OpenHands CLI right from your terminal',
    href: 'https://docs.openhands.dev/openhands/usage/cli/installation',
    cta: '',
    image: '/assets/webflow/misc/691b30b28b25626f4d315588_CLI.webp',
  },
];

const SHOULD_RENDER_SURFACE = (surface: { title: string }) => SHOW_SDK_SURFACE || surface.title !== 'SDK';

const DEFAULT_SURFACE_INDEX = SHOW_SDK_SURFACE ? 0 : 1;

const FEATURES = [
  {
    title: 'Extensible and customizable for any workflow',
    description: 'Build and orchestrate your own agents with open SDKs, APIs, and micro-agents.',
    icon: '/assets/webflow/features/690b95df7d9ca76624d45550_Frame48095777.svg',
  },
  {
    title: 'Model-agnostic',
    description: 'Adapt OpenHands to any model, CI/CD pipeline, or codebase with fine-grained configurability.',
    icon: '/assets/webflow/features/690b95d99040920ad0084107_Frame48095776.svg',
  },
  {
    title: 'Works where you do',
    description: 'Delegate tasks directly from GitHub, GitLab, Slack, or via the API and SDK',
    icon: '/assets/webflow/features/690b95d3c92c94a6a9b249f8_Frame48095775.svg',
  },
  {
    title: 'Secure, sandboxed runtime you control',
    description: 'Deploy in isolated Docker or Kubernetes environments, self-hosted or cloud, with full access control and auditability.',
    icon: '/assets/webflow/features/690b95ca541b813083e0b38a_Frame48095774.svg',
  },
  {
    title: 'Open source and transparent by design',
    description: 'Full visibility into every agent and artifact.',
    icon: '/assets/webflow/features/690b95bf82d3695da1690cb8_Frame48095773.svg',
  },
  {
    title: 'Cloud coding agents that scale',
    description: 'From a single task to thousands of parallel runs.',
    icon: '/assets/webflow/features/690b95b580671251fa0903f4_Frame48095772.svg',
  },
];

const USE_CASE_COLUMNS = [
  {
    label: 'Reduce engineering toil',
    cards: [
      {
        title: 'Speed up code reviews',
        description: 'Summarize pull requests, apply feedback, fix tests, and push fixes instantly so code reviews move from hours to minutes.',
        icon: '/assets/webflow/testimonials/690db602c5ec8e837c1ff9b9_Frame48095783.svg',
      },
      {
        title: 'Expand test coverage',
        description: 'Generate and maintain tests for new features to boost reliability and catch regressions before they ship.',
        icon: '/assets/webflow/testimonials/690db60c9a0ef2e561f859b8_Frame48095783-1.svg',
      },
      {
        title: 'Automate docs & release notes',
        description: 'Generate accurate documentation and release notes directly from commits and pull requests, no manual updates required.',
        icon: '/assets/webflow/testimonials/690db61152b4d406db66af21_Frame48095783-2.svg',
      },
    ],
  },
  {
    label: 'Streamline complex work',
    cards: [
      {
        title: 'Refactor old code',
        description: 'Decompose monoliths, clean up tech debt, and modernize legacy codebases automatically without slowing down the roadmap.',
        icon: '/assets/webflow/testimonials/690db655aca9f8ee7a0d001f_Frame48095783.svg',
      },
      {
        title: 'Eliminate security debt',
        description: 'Harness OpenHands to upgrade dependencies, fix security vulnerabilities, and reduce complexity for large scale, multi-repo changes.',
        icon: '/assets/webflow/testimonials/690db65c8a83399ae0b30aab_Frame48095783-1.svg',
      },
      {
        title: 'Triage & fix prod issues',
        description: 'Deploy agents to analyze logs, pinpoint root causes, and generate fixed PRs ready for your team to review and approve.',
        icon: '/assets/webflow/testimonials/690db661c0a9589bc9d70bb3_Frame48095783-2.svg',
      },
    ],
  },
];

const TESTIMONIALS = [
  {
    quote: '"OpenHands autonomously fixes 87% of bug tickets same-day. Our clients think we hired an army of engineers."',
    name: 'Nick Blanchet',
    title: 'CTO at Flextract',
    photo: '/assets/webflow/logos/6915c4f0cbba410851f45d79_flextract-selfie.png',
    logo: '/assets/webflow/logos/6915b02ded45d0b434a0974d_flextract.png',
  },
  {
    quote:
      '“OpenHands was the only solution that let us prompt an autonomous coding agent remotely at scale, not just on a laptop or inside a narrow CI template.”',
    name: 'Sina Pakazad',
    title: 'VP of Data Science at C3',
    photo: '/assets/webflow/misc/6915c4c0c7baa5046b127eb6_c3.png',
    logo: '/assets/webflow/logos/69137ec5a6f77dd174e557ce_C3ai_logo1.svg',
  },
  {
    quote:
      '“The integration of Lemonade Server with OpenHands reflects AMD’s commitment to open-source innovation and developer choice. This collaboration enables local coding agents that prioritize privacy, cost efficiency, and flexible model selection – while taking advantage of acceleration on Ryzen AI PCs. Together, we’re supporting a range of workflows and staying true to open-source values.”',
    name: 'Adrian Macias',
    title: 'Director, Developer Acceleration at AMD',
    photo: '/assets/webflow/testimonials/authors/amd.png',
    logo: '/assets/webflow/logos/690b9e5400fdae4c12eedd75_small-client-logo.svg',
  },
];

const DEVELOPER_QUOTES = [
  {
    name: 'Nacho Martínez Rincón',
    title: 'Data Scientist Advocate at Oracle',
    avatar: '/assets/webflow/misc/69a9a2ecdfdb5a94e70e9fb5_nacho-martinez-ricon.jpg',
    lines: [
      'The OpenHands SDK is one of the most complete SDKs for agent harness and agentic AI development - including enabling vibecoding with opensource models. Great reliability for tool calling through the Tool System - very dev friendly!',
    ],
  },
  {
    name: 'Dan Kempe',
    title: '@danielkempe',
    avatar: '/assets/webflow/avatars/69783c9c4f51d7fb8f0ec4da_hAlMtLep_400x400.jpeg',
    lines: [
      'OpenHands raised $18.8M to build cloud coding agents that solve 87% of bug tickets same day.',
      'This is what AI coding tools should be. Not another chat interface. Actual autonomous problem solving that ships to production.',
    ],
  },
  {
    name: 'Esteban Puerta',
    title: '@Esteban_Puerta9',
    avatar: '/assets/webflow/avatars/69783c9c29335a4e5f25171c_XdPDMFhM_400x400.jpeg',
    lines: [
      "At this point, there isn't much of a need to roll your own especially when claude code SDK and openhands sdk are offering nice API's to utilize them.",
      'This is where it gets interesting.',
    ],
  },
  {
    name: 'Fisherman',
    title: '@Rybens92',
    avatar: '/assets/webflow/misc/69a7ac3c1dc83f0947eb2469_Fisherman_Profile_Picture.jpg',
    lines: [
      'Your agents are so underrated, but even though there are many benchmarks, which are testing agentic coding and are using your work as reference - OpenHands agent with tested model...',
      "I just don't get why everybody is so silent about your work...",
      '‍',
      'Reposting till people wake up.',
    ],
  },
  {
    name: 'Jingyi Zhao',
    title: 'Software Engineer at Walmart Global Tech',
    avatar: '/assets/webflow/avatars/69b02ad9ad98d51e745551de_user.svg',
    lines: [
      'I love this project because it is the first of its kind in coding agent space and you have the freedom to configure your own way. It also integrates well with various ecosystems. I believe this project can go long!',
    ],
  },
  {
    name: 'Leonardo Gonzalez',
    title: '@archimagos',
    avatar: '/assets/webflow/avatars/69783c9c901a7c70a903b9c5_v7Pqyx4B_400x400.jpeg',
    lines: [
      'I love using autonomous agents like @allhands_ai OpenHands for 80% of the work (esp. backend), and then an interactive IDE like @windsurf or @zeddotdev for debugging, refinement, and UI work.',
      'It saves tons of my time and saves a lot of money too with the right models/plans.',
    ],
  },
  {
    name: 'Wil - e/acc',
    title: '@wilfullyapt',
    avatar: '/assets/webflow/avatars/69783c9ceee8b37f4ea0de9d_7pG3i1Kf_400x400.jpeg',
    lines: [
      "I fvkn love vibe coding with OpenHands. It's not like your editor is doing things for you, it's like an idiot internal that literally knows all the book stuff. OpenHands commit, my tweaks, rinse and repeat. Phenomenal!!",
    ],
  },
  {
    name: 'Christian Genco',
    title: '@cgenco',
    avatar: '/assets/webflow/avatars/69783c9cc7c27cc7bedeac33_40ETg5qV_400x400.jpeg',
    lines: [
      "I haven't tried Devin yet but I freakin' love OpenHands. I prefer having more control over how it's working.",
      'Also that general workflow is the future. Just opening GitHub issues and the AI figures it out and writes tests and then pushes a PR is magical.',
    ],
  },
];

const FAQS = [
  {
    question: 'What is OpenHands?',
    answer:
      'OpenHands is an AI agent platform for software development that can execute real engineering work, not just suggest code. It runs autonomous agents that plan, write, and apply changes across your codebase, helping teams complete complex tasks end-to-end. Built on an open source foundation, it\'s designed for enterprise software development at scale.',
  },
  {
    question: 'How is OpenHands different from AI coding tools like GitHub Copilot or ChatGPT?',
    answer:
      'Instead of helping you write code faster, OpenHands helps you ship changes end-to-end. Tools such as GitHub Copilot or ChatGPT generate code suggestions. OpenHands runs agents that complete entire engineering tasks, taking actions across entire codebases, running tasks in parallel, and executing changes in real environments.',
  },
  {
    question: 'Can OpenHands work with large or legacy codebases?',
    answer:
      'Yes. OpenHands is specifically designed to handle large, complex, and legacy codebases. With its Large Codebase SDK, it maps dependencies across the system and orchestrates changes in the correct order, allowing multiple agents to safely work in parallel without conflicts.',
  },
  {
    question: 'Is OpenHands secure for enterprise use?',
    answer:
      'OpenHands runs in your environment, whether on-prem or private cloud, so your code never leaves your control. Since agents operate inside secure, isolated execution environments with full auditability, it is built for organizations with strict data security, compliance, and governance requirements.',
  },
  {
    question: 'What types of teams use OpenHands?',
    answer:
      'OpenHands is used by platform teams automating engineering workflows at scale, teams building internal developer platforms or AI-powered tooling, and enterprises managing large or legacy codebases and mission-critical software systems.',
  },
];

export const meta: Route.MetaFunction = () =>
  createSocialPreviewMeta({
    title: 'OpenHands | The Open Platform for Cloud Coding Agents',
    description:
      'Meet OpenHands, the open-source, model-agnostic platform for cloud coding agents. Automate real engineering work securely and transparently. Build faster with full control.',
  });

const Home = () => {
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);
  const [workflowOffset, setWorkflowOffset] = React.useState(0);
  const [activeSurfaceIndex, setActiveSurfaceIndex] = React.useState(DEFAULT_SURFACE_INDEX);
  const [activeWorkflow, setActiveWorkflow] = React.useState<WorkflowItem | null>(null);
  const workflowDialogRef = React.useRef<HTMLDialogElement>(null);
  const workflowViewportRef = React.useRef<HTMLDivElement>(null);
  const workflowTrackRef = React.useRef<HTMLDivElement>(null);
  const [workflowCardStep, setWorkflowCardStep] = React.useState(294);
  const [maxWorkflowOffset, setMaxWorkflowOffset] = React.useState(WORKFLOWS.length - 1);
  const [maxWorkflowTranslate, setMaxWorkflowTranslate] = React.useState(0);
  const logoMarqueeRef = React.useRef<HTMLDivElement>(null);
  const logoMarqueeTrackRef = React.useRef<HTMLDivElement>(null);
  const logoMarqueeGroupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const dialog = workflowDialogRef.current;
    if (!dialog) return;

    if (activeWorkflow) {
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      }
      return;
    }

    if (dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [activeWorkflow]);

  React.useEffect(() => {
    const marquee = logoMarqueeRef.current;
    const track = logoMarqueeTrackRef.current;
    const group = logoMarqueeGroupRef.current;
    if (!marquee || !track || !group || typeof window === 'undefined') return undefined;

    const pixelsPerSecond = 36;

    const updateMarqueeTiming = () => {
      const distance = group.getBoundingClientRect().width;
      if (distance <= 0) return;

      marquee.style.setProperty('--logo-marquee-distance', `${distance}px`);
      marquee.style.setProperty('--logo-marquee-duration', `${distance / pixelsPerSecond}s`);

      track.style.animation = 'none';
      void track.offsetHeight;
      track.style.animation = '';
    };

    updateMarqueeTiming();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateMarqueeTiming);
      resizeObserver.observe(group);
      resizeObserver.observe(marquee);
    }

    window.addEventListener('pageshow', updateMarqueeTiming);
    window.addEventListener('resize', updateMarqueeTiming);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('pageshow', updateMarqueeTiming);
      window.removeEventListener('resize', updateMarqueeTiming);
    };
  }, []);

  // IntersectionObserver-driven scroll pinning for the surface hero (SDK optional).
  // Mirrors live's GSAP ScrollTrigger: as each .surface-card enters the
  // top-half of the viewport, the active surface index advances, which
  // updates the right-column hero-track translate and card opacity.
  const surfaceCardRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.surfaceIndex);
            if (Number.isFinite(idx)) setActiveSurfaceIndex(idx);
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    );
    for (const node of surfaceCardRefs.current) {
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const measureWorkflowCarousel = () => {
      const track = workflowTrackRef.current;
      const viewport = workflowViewportRef.current;
      const firstCard = track?.firstElementChild as HTMLElement | null;
      if (!track || !viewport || !firstCard) return;

      const gap = Number.parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '24') || 24;
      const step = firstCard.offsetWidth + gap;
      const maxTranslate = Math.max(0, track.scrollWidth - viewport.clientWidth);
      const lastOffset = step > 0 ? Math.ceil(maxTranslate / step) : 0;

      setWorkflowCardStep(step);
      setMaxWorkflowTranslate(maxTranslate);
      setMaxWorkflowOffset(lastOffset);
      setWorkflowOffset((current) => Math.min(current, lastOffset));
    };

    measureWorkflowCarousel();
    window.addEventListener('resize', measureWorkflowCarousel);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measureWorkflowCarousel);
      if (workflowTrackRef.current) resizeObserver.observe(workflowTrackRef.current);
      if (workflowViewportRef.current) resizeObserver.observe(workflowViewportRef.current);
    }

    return () => {
      window.removeEventListener('resize', measureWorkflowCarousel);
      resizeObserver?.disconnect();
    };
  }, []);

  const shiftWorkflow = (direction: -1 | 1) => {
    setWorkflowOffset((current) => {
      if (direction === -1) return Math.max(0, current - 1);
      return Math.min(maxWorkflowOffset, current + 1);
    });
  };

  const isAtWorkflowStart = workflowOffset === 0;
  const isAtWorkflowEnd = workflowOffset >= maxWorkflowOffset;
  const workflowTranslateX = workflowOffset >= maxWorkflowOffset
    ? maxWorkflowTranslate
    : workflowOffset * workflowCardStep;

  const closeWorkflowDialog = () => setActiveWorkflow(null);

  return (
    <main data-testid='home-content' data-wf-el='page-main' className='home-mobile-parity' style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(0, 0, 0, 0)' }}>
      <dialog
        ref={workflowDialogRef}
        data-modal='modal'
        data-active-usecase=' '
        aria-labelledby='workflow-dialog-title'
        className='dialog'
        onCancel={(event) => {
          event.preventDefault();
          closeWorkflowDialog();
        }}
      >
        {activeWorkflow ? (
          <>
            <div className='dialog_top_wrap'>
              <button
                type='button'
                data-modal='close'
                aria-label='Close workflow dialog'
                onClick={closeWorkflowDialog}
                className='dialog_top_close'
              >
                <svg xmlns='http://www.w3.org/2000/svg' width='100%' viewBox='0 0 9 9' fill='none' aria-hidden='true'>
                  <path d='M0.183617 0.183617C0.241674 0.125413 0.310643 0.0792341 0.386575 0.047726C0.462506 0.016218 0.543908 0 0.626117 0C0.708326 0 0.789728 0.016218 0.865659 0.047726C0.941591 0.0792341 1.01056 0.125413 1.06862 0.183617L4.37612 3.49237L7.68362 0.183617C7.74173 0.125507 7.81071 0.0794115 7.88664 0.0479627C7.96256 0.0165138 8.04394 0.000327229 8.12612 0.000327229C8.2083 0.000327229 8.28967 0.0165138 8.3656 0.0479627C8.44152 0.0794115 8.51051 0.125507 8.56862 0.183617C8.62673 0.241727 8.67282 0.310713 8.70427 0.386637C8.73572 0.462562 8.75191 0.543937 8.75191 0.626117C8.75191 0.708297 8.73572 0.789672 8.70427 0.865597C8.67282 0.941521 8.62673 1.01051 8.56862 1.06862L5.25987 4.37612L8.56862 7.68362C8.62673 7.74173 8.67282 7.81071 8.70427 7.88664C8.73572 7.96256 8.75191 8.04394 8.75191 8.12612C8.75191 8.2083 8.73572 8.28967 8.70427 8.3656C8.67282 8.44152 8.62673 8.51051 8.56862 8.56862C8.51051 8.62673 8.44152 8.67282 8.3656 8.70427C8.28967 8.73572 8.2083 8.75191 8.12612 8.75191C8.04394 8.75191 7.96256 8.73572 7.88664 8.70427C7.81071 8.67282 7.74173 8.62673 7.68362 8.56862L4.37612 5.25987L1.06862 8.56862C1.01051 8.62673 0.941521 8.67282 0.865597 8.70427C0.789672 8.73572 0.708297 8.75191 0.626117 8.75191C0.543937 8.75191 0.462562 8.73572 0.386637 8.70427C0.310713 8.67282 0.241727 8.62673 0.183617 8.56862C0.125507 8.51051 0.0794115 8.44152 0.0479627 8.3656C0.0165138 8.28967 0.000327229 8.2083 0.000327229 8.12612C0.000327229 8.04394 0.0165138 7.96256 0.0479627 7.88664C0.0794115 7.81071 0.125507 7.74173 0.183617 7.68362L3.49237 4.37612L0.183617 1.06862C0.125413 1.01056 0.0792341 0.941591 0.047726 0.865659C0.016218 0.789728 0 0.708326 0 0.626117C0 0.543908 0.016218 0.462506 0.047726 0.386575C0.0792341 0.310643 0.125413 0.241674 0.183617 0.183617Z' fill='currentColor' />
                </svg>
              </button>
              <WorkflowDialogIcon icon={activeWorkflow.icon} />
              <div className='dialog_top_content'>
                <h3 id='workflow-dialog-title' data-modal-content='title' className='dialog_top_heading h3'>
                  {activeWorkflow.title}
                </h3>
                <p data-modal-content='description' className='dialog_top_paragraph'>
                  {activeWorkflow.description}
                </p>
              </div>
            </div>

            <div className='dialog_bottom_wrap'>
              <div className='dialog_bottom_item'>
                <div className='dialog_bottom_content'>
                  <h4 className='dialog_bottom_heading'>Launch in Cloud</h4>
                  <p className='dialog_bottom_paragraph'>Fastest way to try this workflow</p>
                </div>
                <div className='button'>
                  <div aria-hidden='true' className='btn-text'>Start for Free</div>
                  <a data-cta-button='cloud' data-modal-content='cloudUrl' href={activeWorkflow.href} target='_blank' rel='noopener noreferrer' className='u-link-cover'>
                    <div className='u-sr-only'>Launch in Cloud</div>
                  </a>
                </div>
              </div>
              <div className='dialog_bottom_item'>
                <div className='dialog_bottom_content'>
                  <h4 className='dialog_bottom_heading'>Customize with open-source.</h4>
                  <p className='dialog_bottom_paragraph'>Explore the code and customize for your stack.</p>
                </div>
                <div className='button secondary-7'>
                  <div aria-hidden='true' className='btn-text'>Get SDK Example</div>
                  <a data-cta-button='sdk' data-modal-content='sdkUrl' href={activeWorkflow.sdkHref ?? activeWorkflow.href} target='_blank' rel='noopener noreferrer' className='u-link-cover'>
                    <div className='u-sr-only'>Get SDK Example</div>
                  </a>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </dialog>

      {/* SECTION 0: section-hero — contains hero+carousel+logos+SDK (matches live 1761px mega-section) */}
      <section data-wf-el='section-hero' className='relative' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '24px', paddingBottom: '64px', paddingLeft: '0px', paddingRight: '0px' }}>
        {/* Live's `.hero` has `min-height: 100vh` — required so the
          * ASCII canvas behind the hero can fill the viewport on tall
          * screens.  Without it, the hero collapses to the height of
          * its content (banner + heading + buttons + logo grid) and
          * the canvas underneath gets clipped. */}
        <div data-wf-el='hero' className='relative' style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', justifyContent: 'flex-start', alignItems: 'center', minHeight: '100vh' }}>
          <div data-wf-el='asci-wrap' className='absolute inset-0 z-0 overflow-hidden' style={{ backgroundColor: 'rgba(0, 0, 0, 0)', pointerEvents: 'auto' }}>
            <div data-wf-el='asci-embed' className='h-full w-full overflow-hidden'><ASCIIAnimation /></div>
          </div>

          <div data-wf-el='container' className='relative z-10 mx-auto w-full max-w-[1238px]'>
            <div data-wf-el='hero-content' className='w-full' style={{ textAlign: 'center', paddingTop: '88px', paddingBottom: '56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>

              {/* Live's `.hero-heading_wrap` has no max-width and no auto
                * margins — it inherits flex centering from its parent.
                * Removing `mx-auto max-w-[640px]` here matches live's
                * computed style (marginLeft/Right: 0, maxWidth: none) and
                * stops the parity audit from flagging the "auto margin"
                * mismatch on every render. */}
              {/* Live structure: hero-heading_wrap holds ONLY H1 + P;
                * hero_btn_wrap and hero_sublink_text are SIBLINGS of
                * hero-heading_wrap inside hero-content.  Spacing between
                * those three sibling blocks comes from hero-content's
                * `gap: 2rem` (32px), not from per-element margins.
                * Earlier we nested everything inside hero-heading_wrap
                * with the heading_wrap's tighter `gap-2` (8px) which
                * collapsed all four blocks together. */}
              <div data-wf-el='hero-heading_wrap' className='flex flex-col items-center gap-2 text-center' style={{ justifyContent: 'center' }}>
                {/* Live's `.hero-heading_h1.h1` has `margin-bottom: 0`. */}
                <h1 data-wf-el='hero-heading_h1' id='hero-heading' className='fluid-h1 font-medium tracking-[-0.03em] text-brand-fg' style={{ marginBottom: '0px' }}>
                  One workspace for all your AI coding agents
                </h1>
                {/* Live's `.hero-heading_paragraph.paragraph-lg.u-text-darkgray`
                  * has `max-width: 40ch; margin-bottom: 0`.  The earlier
                  * `mb-7` (28px) was adding extra space above the CTAs. */}
                <p data-wf-el='hero-heading_paragraph' id='hero-subheading' className='max-w-[60ch] fluid-body-lg font-medium text-brand-muted' style={{ marginLeft: '0px', marginRight: '0px', marginBottom: '0px' }}>
                  OpenHands is the open-source platform for building and running AI coding agents. Parallel sessions, built-in automations, and a path from your laptop to your whole org.
                </p>
              </div>

              {/* hero_btn_wrap — sibling of hero-heading_wrap on live. */}
              <div data-wf-el='hero_btn_wrap' className='flex flex-wrap items-center justify-center gap-4' style={{ marginBottom: '0px', paddingTop: '0px' }}>
                <OverlayLinkButton href={INSTALL_OPENHANDS_URL} label='Install OpenHands' variant='primary' />
              </div>

              <div data-wf-el='hero-subscription' className='flex w-full flex-wrap items-center justify-center gap-4 rounded-[999px] border border-[rgba(34,21,13,0.2)] bg-[#f9f3de] px-6 py-4 text-brand-fg' style={{ maxWidth: '980px' }}>
                <span className='text-base font-normal leading-[22.4px] text-brand-fg'>Keep your existing subscription. Connects to:</span>
                <div className='flex flex-wrap items-center justify-center gap-3'>
                  {HERO_COMPATIBILITY_BADGES.map((badge) => (
                    <div
                      key={badge.name}
                      className='flex items-center gap-2 rounded-full border border-[rgba(34,21,13,0.2)] bg-[#f9f0d9] px-4 py-2'
                    >
                      <span
                        className='flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-brand-fg'
                        style={{ backgroundColor: badge.iconBg }}
                        aria-hidden='true'
                      >
                        {badge.iconSrc ? (
                          <img src={badge.iconSrc} alt={badge.iconAlt ?? ''} className='h-4 w-4' />
                        ) : (
                          badge.iconText
                        )}
                      </span>
                      <span className='text-base font-medium leading-[22.4px] text-brand-fg'>{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Workflow carousel (inside hero section).  Live's
              * `.hero-splide_top` directly contains an `<h2>` and a
              * buttons div as siblings — the earlier extra
              * `<div className='max-w-[384px]'>` wrapper was breaking
              * the structural parity. */}
            <div data-wf-el='hero-splide_top' className='mb-4 flex w-full flex-wrap justify-center gap-x-12 gap-y-4 text-center' style={{ alignItems: 'center', paddingTop: '32px' }}>
              <h2 data-wf-el='hero-splide_heading' className='w-full font-medium text-brand-fg' style={{ fontSize: '32px', lineHeight: '1.1', letterSpacing: '-0.02em', marginBottom: '0px', textAlign: 'center' }}>
                Start with a proven workflow
              </h2>
            </div>

          <div className='flex items-center gap-3 pb-8 md:gap-4 md:pb-10'>
            <button
              type='button'
              onClick={() => shiftWorkflow(-1)}
              disabled={isAtWorkflowStart}
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-[rgba(30,21,15,0.2)] bg-[#f9f6e9] text-brand-fg transition-colors ${
                isAtWorkflowStart
                  ? 'cursor-default opacity-40'
                  : 'cursor-pointer hover:bg-brand-accent'
              }`}
              style={{ boxSizing: 'border-box' }}
              aria-label='Previous workflow'
              aria-disabled={isAtWorkflowStart}
            >
              <span data-wf-el='hero-splide_button' className='flex items-center justify-center' aria-hidden='true'>
                <ChevronLeft className='h-6 w-6' strokeWidth={1.75} />
              </span>
            </button>

          <div ref={workflowViewportRef} className='min-w-0 flex-1 overflow-hidden'>
            <LazyMotion features={domAnimation}>
              <m.div
                ref={workflowTrackRef}
                data-splide='workflows'
                className='flex w-max cursor-grab gap-6'
                animate={{ x: -workflowTranslateX }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
            {WORKFLOWS.map((workflow) => {
              const cardBody = (
                <>
                  <WorkflowCarouselIcon icon={workflow.icon} />
                  <div data-wf-el='capabilities_card_content' className='flex flex-col gap-1'>
                    <h3 data-wf-el='capabilities_card_heading' className='text-[24px] font-medium leading-[1.2] text-brand-fg' style={{ marginBottom: 0 }}>{workflow.title}</h3>
                    {workflow.description ? (
                      <p data-wf-el='capabilities_card_paragraph' className='fluid-sm font-medium text-brand-muted' style={{ margin: 0 }}>
                        {workflow.description}
                      </p>
                    ) : null}
                  </div>
                </>
              );

              if (workflow.isLink) {
                return (
                  <a
                    key={workflow.title}
                    href={workflow.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    data-wf-el='capabilities_card_wrap'
                    className='flex w-[270px] flex-shrink-0 cursor-pointer flex-col gap-4 rounded-2xl border border-[rgba(30,21,15,0.2)] bg-[#f9f6e9] p-6 no-underline transition-colors hover:bg-[#f3eedc] md:w-[352px]'
                    style={{ scrollSnapAlign: 'start', justifyContent: 'flex-start', alignItems: 'flex-start' }}
                  >
                    {cardBody}
                  </a>
                );
              }

              return (
                <article
                  key={workflow.title}
                  data-testid='workflow-launch'
                  data-modal='open'
                  data-wf-el='capabilities_card_wrap'
                  data-sdk-url={workflow.sdkHref ?? ''}
                  data-cloud-url=''
                  role='button'
                  tabIndex={0}
                  onClick={() => setActiveWorkflow(workflow)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveWorkflow(workflow);
                    }
                  }}
                  className='flex w-[270px] flex-shrink-0 cursor-pointer flex-col gap-4 rounded-2xl border border-[rgba(30,21,15,0.2)] bg-[#f9f6e9] p-6 transition-colors hover:bg-[#f3eedc] md:w-[352px]'
                  style={{ scrollSnapAlign: 'start', justifyContent: 'flex-start', alignItems: 'flex-start' }}
                >
                  {cardBody}
                </article>
              );
            })}
              </m.div>
            </LazyMotion>
          </div>

            <button
              type='button'
              onClick={() => shiftWorkflow(1)}
              disabled={isAtWorkflowEnd}
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-[rgba(30,21,15,0.2)] bg-[#f9f6e9] text-brand-fg transition-colors ${
                isAtWorkflowEnd
                  ? 'cursor-default opacity-40'
                  : 'cursor-pointer hover:bg-brand-accent'
              }`}
              style={{ boxSizing: 'border-box' }}
              aria-label='Next workflow'
              aria-disabled={isAtWorkflowEnd}
            >
              <span data-wf-el='hero-splide_button' className='flex items-center justify-center' aria-hidden='true'>
                <ChevronRight className='h-6 w-6' strokeWidth={1.75} />
              </span>
            </button>
          </div>
          </div>

          {/* Logo grid (inside hero section) */}
          <div data-wf-el='logo-grid-component_wrap' className='w-full' style={{ paddingTop: '80px' }}>
            <div data-wf-el='logo-grid-component_heading_container' className='mx-auto max-w-[1238px]' style={{ textAlign: 'center' }}>
              {/* Live's `.h2` margin-bottom (used for this heading via
                * the `.u-mb-xs` modifier) computes to 9.6px — `mb-5` was
                * 20px, adding ~10px of unwanted space above the logos. */}
              <div data-wf-el='logo-grid-component_heading_heading' className='text-center fluid-h3 text-brand-fg' style={{ marginBottom: '9.6px' }}>Trusted by engineers at</div>
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


          <div data-wf-el='hero-preview' className='mx-auto w-full max-w-[1238px]' style={{ paddingTop: '56px', paddingBottom: '48px' }}>
            <img
              src={HERO_AUTOMATIONS_IMAGE}
              alt='OpenHands Automations dashboard screenshot'
              className='w-full rounded-[24px] border border-[rgba(34,21,13,0.2)]'
              loading='lazy'
            />
          </div>

          {/* Product surface row: active SDK/Cloud/CLI card on the left and
              the matching hero media on the right. Dimensions and offsets
              mirror the live Webflow export so rendered image rects line up
              without relying on screenshots. */}
          <div data-wf-el='hero-content' data-slider='hero-surfaces' className='home-hero-surfaces w-full' style={{ display: 'block', marginTop: '0px' }}>
            <div className='home-hero-surfaces-container mx-auto max-w-[1238px]'>
              <div id='hero-media' className='home-hero-media-row flex flex-col lg:flex-row lg:items-start lg:gap-6'>
                {/* LEFT col: selector controls + active card. Match live's
                    Webflow row: the selector keys align with the top of the
                    media background, then the active card starts immediately
                    below them. */}
                <div className='home-hero-media-copy-col flex flex-col' style={{ flex: '0 0 270px', maxWidth: '270px', gap: '0px' }}>
                  <div className='flex flex-nowrap items-center justify-start' style={{ position: 'relative', zIndex: 1, marginTop: '0px', gap: '9.6px' }}>
                    {PRODUCT_SURFACES.map((surface, index) => {
                      if (!SHOULD_RENDER_SURFACE(surface)) return null;

                      // Live Webflow renders these as plain `<div class="eyebrow bubble ...">`
                      // pills (no role/aria semantics).  Adding `role="tab"` made our test
                      // divs surface in the parity inventory while live's didn't, producing
                      // 3 fake "extra-on-test" DIV:CLI/Cloud/SDK signatures.  Drop the
                      // tab semantics and fall back to plain click handlers.
                      return (
                        <div
                          key={surface.title}
                          data-wf-el='hero-surface-eyebrow'
                          data-key={index + 1}
                          onClick={() => setActiveSurfaceIndex(index)}
                          className='eyebrow bubble inline-block font-mono transition-all'
                          style={{
                            display: 'block',
                            cursor: 'pointer',
                            borderRadius: '20px',
                            paddingLeft: '9.6px',
                            paddingRight: '9.6px',
                            paddingTop: '3.2px',
                            paddingBottom: '3.2px',
                            minWidth: '29.64px',
                            minHeight: '24.9px',
                            boxSizing: 'border-box',
                            fontSize: '14.08px',
                            lineHeight: '16.896px',
                            fontWeight: 400,
                            textAlign: 'start',
                            color: 'rgb(249, 240, 217)',
                            backgroundColor: 'rgb(34, 21, 13)',
                            border: '1px solid rgb(0, 0, 0)',
                            borderColor: 'rgb(0, 0, 0)',
                            opacity: 0.3,
                          }}
                        >
                          {index === activeSurfaceIndex ? surface.title : ''}
                        </div>
                      );
                    })}
                  </div>
                  {/* Only the active copy card occupies layout; the mounted
                      media stack on the right handles the animated transition. */}
                  {PRODUCT_SURFACES.map((surface, idx) => {
                    if (!SHOULD_RENDER_SURFACE(surface)) return null;

                    return (
                      <div
                        key={surface.title}
                        data-wf-el='card'
                        data-surface-index={idx}
                        ref={(node) => { surfaceCardRefs.current[idx] = node; }}
                        aria-hidden={idx !== activeSurfaceIndex || undefined}
                        style={{
                          borderRadius: '0px',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                          borderStyle: 'none',
                          overflow: 'hidden',
                          minHeight: idx === activeSurfaceIndex ? '236px' : '0px',
                          marginTop: '0px',
                          display: idx === activeSurfaceIndex ? 'flex' : 'none',
                        }}
                      >
                        {/* Live's SDK/CLI/GUI heading has margin-top:
                          22px and margin-bottom: 8.8px (live h2-2
                          tokens).  Our previous mt-2/mb-3 was wrong. */}
                        <h2 className='section-title text-brand-fg' style={{ marginTop: '22px', marginBottom: '8.8px' }}>{surface.title}</h2>
                        <p data-wf-el='paragraph-lg' className='mb-5 fluid-body-lg font-medium text-brand-muted'>{surface.description}</p>
                        {surface.cta ? (
                          <div data-wf-el='standard-wrap'>
                            <OverlayLinkButton href={surface.href} label={surface.cta} variant='outline' />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {/* RIGHT col: hero-media-bg with hero-track of 3 images.
                    Match live's static post-animation geometry: 944px wide
                    media, 47.1875px vertical padding, and overflow visible on
                    the brown media background. */}
                <div className='home-hero-media-visual-col' style={{ flex: '0 0 944px', maxWidth: '944px', display: 'flex', position: 'relative', marginTop: '0px', alignSelf: 'flex-start' }}>
                  <div className='w-full' style={{ display: 'block' }}>
                    <div data-wf-el='hero-media-bg' style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', backgroundColor: 'rgb(34, 21, 13)', borderRadius: '24px', paddingTop: '47.1875px', paddingBottom: '47.1875px', paddingLeft: '0px', paddingRight: '0px', overflow: 'visible', height: '614.375px', width: '944px' }} className='w-full'>
                      {/* Keep every media panel mounted and cross-fade/slide between them so
                          the controls and scroll observer can animate the screenshot
                          without introducing visible duplicate images. */}
                      <div data-wf-el='hero-track' style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10%', overflow: 'hidden', width: '944px', height: '520px' }}>
                        {PRODUCT_SURFACES.map((surface, idx) => {
                          if (!SHOULD_RENDER_SURFACE(surface)) return null;

                          return (
                            <div
                              key={surface.title}
                              data-wf-el='hero-media'
                              data-heroslide={surface.title.toLowerCase()}
                              style={{
                                position: 'absolute',
                                top: '-67.14px',
                                left: '0px',
                                width: '944px',
                                height: '654.297px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                flex: '0 0 100%',
                                display: 'block',
                                opacity: idx === activeSurfaceIndex ? 1 : 0,
                                transform: `translateY(${idx === activeSurfaceIndex ? 0 : idx < activeSurfaceIndex ? -24 : 24}px)`,
                                transition: 'opacity 360ms ease, transform 360ms ease',
                                pointerEvents: idx === activeSurfaceIndex ? 'auto' : 'none',
                              }}
                            >
                              <img src={surface.image} alt='' data-wf-el='standard-media' loading='lazy' decoding='async' style={{ display: 'inline-block', width: '943.969px', height: '654.297px', maxWidth: '100%', borderRadius: '0px', objectFit: 'fill', objectPosition: '50% 50%' }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Why teams choose OpenHands (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto grid max-w-[1238px] gap-10 lg:grid-cols-[558px_640px]'>
          {/* Live stacks H3 + CTA tightly (~119px gap) and lets the right
              feature column dictate row height; previous flex-justify-between
              left a 700+px gap on test where the right column was much taller
              than live's. */}
          <div className='flex min-w-0 flex-col items-start'>
            {/* Live's H3 here gets `margin-bottom: 1.375rem` (22px) from
              * the base h3 typography rules.  Without it on test, the
              * "Try it live" CTA below sat too close to the heading. */}
            <h3 className='max-w-[386px] section-title text-brand-fg' style={{ marginBottom: '22px' }}>Why teams choose OpenHands</h3>
            <OverlayLinkButton href='https://app.all-hands.dev/' label='Try it live' variant='outline' className='w-fit' />
          </div>

          <div className='rounded-none px-5 py-0' style={{ marginLeft: '20px', width: '640px' }}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className='feature-item-stacked'>
                {/* Live's icon has margin: 0 (inside flex row); we used
                    mt-1 (4px) which gave 6 IMG marginTop mismatches. */}
                <img src={feature.icon} alt='' className='h-6 w-6 flex-shrink-0' style={{ marginTop: '0px' }} />
                <div className='min-w-0 flex-1'>
                  {/* Live's `.paragraph-lg.u-m-0` (title) has margin: 0;
                    * the description paragraph uses
                    * `.paragraph-lg.u-text-darkgray.u-mb-sm` which
                    * resolves to `margin-bottom: 1.95rem` (31.2px).
                    * The earlier `mb-1` on the title plus `mb-0` on the
                    * description was 0 + 0 instead of 0 + 31.2 — pulling
                    * every following row up by 31px on test. */}
                  <p className='fluid-body-lg font-medium text-brand-fg' style={{ marginBottom: '0px' }}>{feature.title}</p>
                  <p className='fluid-body-lg font-medium text-brand-muted' style={{ marginBottom: '31.2px' }}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Automate the Outer Loop (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1216px]'>
          {/* Live's H3 "Automate the Outer Loop with AI" inherits the
            * shared `h2{ margin-bottom: 0.55rem }` (8.8px).  The earlier
            * `mb-[50px]` was 41.2px too tall and pushed every subsequent
            * use-case row down by 41px on test. */}
          <h3 className='max-w-[1216px] section-title text-brand-fg' style={{ marginBottom: '8.8px', marginLeft: '0px' }}>
            Automate the Outer Loop with AI
          </h3>
          <div className='space-y-6'>
            {USE_CASE_COLUMNS.map((column, index) => (
              <div
                key={column.label}
                data-wf-el='use-case-row'
                className='overflow-hidden rounded-[19.2px]'
                style={{ display: 'flex', flexWrap: 'wrap', alignContent: 'stretch', border: '1px solid rgb(179, 168, 140)', marginTop: index === 0 ? '56.95px' : '49.6px' }}
              >
                <div
                  data-wf-el='custom-interface'
                  style={{ backgroundColor: 'rgb(179, 168, 140)', width: '100%', flex: '0 0 auto', alignSelf: 'flex-start', paddingTop: '16px', paddingBottom: '16px', position: 'static' }}
                >
                  <div className='px-6 font-mono text-sm font-normal tracking-normal text-brand-fg' style={{ lineHeight: '16.896px', textTransform: 'none' }}>
                    {column.label}
                  </div>
                </div>
                <div className='flex w-full flex-wrap' style={{ paddingTop: '40px', paddingBottom: '0px' }}>
                  {column.cards.map((card) => (
                    <article key={card.title} className='bg-transparent' style={{ borderRadius: '19.2px', flexBasis: '33.3333%', maxWidth: '33.3333%', paddingLeft: '20px', paddingRight: '20px' }}>
                      <div className='relative mb-4' style={{ borderRadius: '19.2px', backgroundColor: 'rgba(0, 0, 0, 0)', height: '188px', width: '188px' }}>
                        {/* Live's testimonial card icon IMG computes
                         * `position: absolute` (parented by a wrapping
                         * div with explicit width/height). Mirror that
                         * so the IMG itself is absolute, not the
                         * default static block. */}
                        <img src={card.icon} alt='' className='img-block' style={{ position: 'absolute', inset: 0, width: '188px', height: '188px', objectFit: 'cover', objectPosition: '0% 0%' }} />
                      </div>
                      {/* Live's card-title P has `u-mt-sm`+`u-mb-0`
                          (margin-top: 31.2px, margin-bottom: 0).  Our
                          earlier mb-2 + 0 mt was inverted. */}
                      <p className='fluid-body-lg font-medium text-brand-fg' style={{ marginTop: '31.2px', marginBottom: '0px' }}>{card.title}</p>
                      {/* Live's card-description P has `u-text-darkgray
                          u-mb-sm` (margin-bottom: 31.2px).  The new
                          `p { mb: 1em }` default produced 20.8px on
                          test (font-size 20.8 × 1em). */}
                      <p className='fluid-body-lg font-medium text-brand-muted' style={{ marginBottom: '31.2px' }}>{card.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Testimonials / black hole (p:0, h:800, transparent, position:relative).
          Live carries data-slider/data-slider-overflow on the section so the
          mast slider script binds the prev/next controls; we replicate the
          attributes statically since our prev/next handlers already work. */}
      <section data-wf-el='section' data-slider='testimonials' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '800px', maxHeight: '800px', overflow: 'visible' }}>
        <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ backgroundColor: 'rgb(255, 255, 139)' }}>
          <img
            data-wf-el='asci-media'
            src={ASCII_HOLE_IMAGE.src}
            alt={ASCII_HOLE_IMAGE.alt}
            className='h-full w-full object-cover'
          />
        </div>
        <div data-wf-el='hero-track' className='relative z-10 mx-auto flex h-full max-w-[1238px]' style={{ paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', justifyContent: 'center', alignItems: 'center', gap: '10%' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} data-wf-el='card-body' style={{ width: '1238px', backgroundColor: 'rgba(0, 0, 0, 0)', display: 'block', color: 'rgb(249, 240, 217)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', position: i === activeTestimonial ? 'static' : 'absolute', opacity: i === activeTestimonial ? 1 : 0, pointerEvents: i === activeTestimonial ? 'auto' : 'none', left: i === activeTestimonial ? undefined : '-9999px' }}>
              {/* Live renders the testimonial quote as <h2 class="h2 ..."/>
                  inside .testimonial_quote.  Matching the heading semantic
                  keeps the heading-order audit aligned (live has 13 visible
                  headings, test had 12 because the quote was a div). */}
              {/* Live's testimonial heading is `text-align: center` and
                  uses `margin-bottom: 8.8px` (h2-2 token).  Our previous
                  `mb-6` (24px) caused a ~15px drift after the quote. */}
              <div style={{ width: '1038px', paddingLeft: '4px', paddingRight: '4px', marginLeft: 'auto', marginRight: 'auto' }}>
                <h2 className='section-title text-brand-fg' style={{ textAlign: 'center', marginBottom: '8.8px' }}>
                  {t.quote}
                </h2>
              </div>
              <div className='flex items-center justify-center' style={{ gap: '16px', marginTop: '37.2px', marginBottom: '0px', color: 'rgb(34, 21, 13)', transform: 'translateX(-8px)' }}>
                {/* Live's `.quote-author-media` wrapper is visible overflow and
                 * sits in the centered author row alongside name, title, and
                 * client logo. */}
                <div data-wf-el='quote-author-media' className='h-12 w-12 flex-shrink-0' style={{ backgroundColor: 'rgb(34, 21, 13)', borderRadius: '50%', display: 'block', overflow: 'visible' }}><img src={t.photo} alt='' className='h-12 w-12 object-cover' style={{ display: 'inline-block' }} /></div>
                <div data-wf-el='paragraph-xl' style={{ fontSize: '24px', lineHeight: '33.6px', fontWeight: 500, color: 'rgb(34, 21, 13)' }}>
                  {`${t.name},`}
                </div>
                <div style={{ fontSize: '24px', lineHeight: '33.6px', fontWeight: 500, color: 'rgb(34, 21, 13)' }}>{t.title}</div>
                <div style={{ display: 'block', transform: t.name === 'Nick Blanchet' ? 'translateX(17px)' : undefined }}>
                  <img src={t.logo} alt='' style={{ display: 'inline-block', marginLeft: '0px', objectFit: 'scale-down', width: t.name === 'Nick Blanchet' ? '70px' : undefined, height: t.name === 'Nick Blanchet' ? '16px' : '32px', maxWidth: '110px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div data-wf-el='slide-controls' style={{ zIndex: 50, width: '100%', height: '59px', position: 'absolute', inset: 'auto 0% 0%', color: 'rgb(34, 21, 13)' }}>
          <div className='mx-auto flex max-w-[1238px] items-end justify-between'>
            <div className='flex font-mono text-[14.08px] font-normal leading-[16.896px] text-brand-fg'>
              <span>3</span><span>/</span><span>3</span>
            </div>
            <div className='flex' style={{ gap: '1px' }}>
              <button
                type='button'
                onClick={() => setActiveTestimonial((current) => (current === 0 ? TESTIMONIALS.length - 1 : current - 1))}
                className='flex h-11 w-11 items-center justify-center rounded-full border border-brand-fg/20 text-brand-fg transition-colors hover:bg-brand-fg/5'
              >
                <svg data-wf-el='slide-icon-media' width='35' height='35' viewBox='0 0 25 25' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
                  <rect x='24.5' y='24.5' width='24' height='24' rx='12' transform='rotate(-180 24.5 24.5)' stroke='black'/>
                  <path fillRule='evenodd' clipRule='evenodd' d='M15.5 12.4995C15.5 12.599 15.4605 12.6944 15.3902 12.7647C15.3198 12.835 15.2245 12.8745 15.125 12.8745L10.7803 12.8745L12.3905 14.484C12.4609 14.5544 12.5005 14.6499 12.5005 14.7495C12.5005 14.8491 12.4609 14.9446 12.3905 15.015C12.3201 15.0854 12.2246 15.125 12.125 15.125C12.0254 15.125 11.9299 15.0854 11.8595 15.015L9.6095 12.765C9.57458 12.7302 9.54687 12.6888 9.52797 12.6433C9.50906 12.5977 9.49933 12.5489 9.49933 12.4995C9.49933 12.4502 9.50906 12.4014 9.52797 12.3558C9.54687 12.3102 9.57458 12.2689 9.6095 12.234L11.8595 9.98403C11.9299 9.91361 12.0254 9.87405 12.125 9.87405C12.2246 9.87405 12.3201 9.91361 12.3905 9.98403C12.4609 10.0544 12.5005 10.1499 12.5005 10.2495C12.5005 10.3491 12.4609 10.4446 12.3905 10.515L10.7803 12.1245L15.125 12.1245C15.2245 12.1245 15.3198 12.164 15.3902 12.2344C15.4605 12.3047 15.5 12.4001 15.5 12.4995Z' fill='black'/>
                </svg>
              </button>
              <button
                type='button'
                onClick={() => setActiveTestimonial((current) => (current === TESTIMONIALS.length - 1 ? 0 : current + 1))}
                className='flex h-11 w-11 items-center justify-center rounded-full border border-brand-fg/20 text-brand-fg transition-colors hover:bg-brand-fg/5'
              >
                <svg data-wf-el='slide-icon-media' width='35' height='35' viewBox='0 0 25 25' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
                  <rect x='0.5' y='0.5' width='24' height='24' rx='12' stroke='black'/>
                  <path fillRule='evenodd' clipRule='evenodd' d='M9.5 12.5005C9.5 12.401 9.53951 12.3056 9.60984 12.2353C9.68016 12.165 9.77554 12.1255 9.875 12.1255H14.2197L12.6095 10.516C12.5391 10.4456 12.4995 10.3501 12.4995 10.2505C12.4995 10.1509 12.5391 10.0554 12.6095 9.98497C12.6799 9.91456 12.7754 9.875 12.875 9.875C12.9746 9.875 13.0701 9.91456 13.1405 9.98497L15.3905 12.235C15.4254 12.2698 15.4531 12.3112 15.472 12.3567C15.4909 12.4023 15.5007 12.4511 15.5007 12.5005C15.5007 12.5498 15.4909 12.5986 15.472 12.6442C15.4531 12.6898 15.4254 12.7311 15.3905 12.766L13.1405 15.016C13.0701 15.0864 12.9746 15.1259 12.875 15.1259C12.7754 15.1259 12.6799 15.0864 12.6095 15.016C12.5391 14.9456 12.4995 14.8501 12.4995 14.7505C12.4995 14.6509 12.5391 14.5554 12.6095 14.485L14.2197 12.8755H9.875C9.77554 12.8755 9.68016 12.836 9.60984 12.7656C9.53951 12.6953 9.5 12.5999 9.5 12.5005Z' fill='black'/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Dark cards continued (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '1269.25px' }}>
        <div data-wf-el='container' className='mx-auto max-w-[1238px] space-y-6' style={{ marginTop: '49.6px' }}>
          <div className='grid gap-6 md:grid-cols-2'>
            <article data-wf-el='card' className='card-dark' style={{ height: '616.328px', overflow: 'hidden' }}>
              <div data-wf-el='card-body' className='flex h-full flex-col p-6'>
                {/* Live's `.paragraph-lg.u-m-0.u-text-primary` headline
                  * has margin: 0; the body paragraph below has the same
                  * 0 margin (live `.paragraph-lg.u-text-primary` with
                  * `u-m-0`).  Spacing between them comes from the
                  * card-body's flex flow, not per-element margin. */}
                <p className='max-w-[350px] fluid-body-lg font-medium text-brand-accent' style={{ marginBottom: '0px' }}>Community that compounds velocity</p>
                <p className='fluid-body-lg text-[#b3a88c]' style={{ maxWidth: '350px', marginBottom: '0px' }}>
                  <span style={{ display: 'block', maxWidth: '303px' }}>With 65K+ GitHub stars and a thriving open-source ecosystem, OpenHands evolves through collective innovation - every contribution makes the platform faster, safer, and smarter.</span>
                </p>
                <OverlayLinkButton href='https://github.com/OpenHands/OpenHands' label='Explore the repo' variant='lightbrown' className='mt-6 mb-12 w-fit' />
                <div className='mt-auto flex items-end justify-end gap-3'>
                  <span className='text-brand-bg' style={{ fontSize: '154.08px', lineHeight: '154.08px', fontWeight: 400, letterSpacing: 'normal' }}>{`${Math.round(statistics.stargazers / 1000)}K`}</span>
                  <span className='font-medium text-brand-bg' style={{ fontSize: '44px', lineHeight: '48.4px', letterSpacing: '-0.88px', marginBottom: '8px' }}>+</span>
                </div>
                {/* Live uses the actual star SVG asset (not an emoji) so the
                    parity inventory finds an IMG:[src:star] entry; the emoji
                    span produced a 'missing IMG:star on test' diff. */}
                {/* Live wraps the star asset in its own `.icon` div which
                 * inherits the card-level cream color, separating it from
                 * the surrounding muted "GitHub stars" caption. */}
                <div className='mt-3 flex items-center justify-end gap-2 font-mono text-[14.08px] font-normal leading-[16.896px] text-brand-bg' style={{ textAlign: 'right' }}>
                  <span>GitHub stars</span>
                  <span className='text-brand-bg' style={{ display: 'inline-flex', width: '24px', height: '24px', color: 'rgb(249, 240, 217)' }}>
                    <img src='/assets/webflow/icons/star.svg' alt='' className='h-6 w-6' style={{ objectFit: 'fill' }} />
                  </span>
                </div>
              </div>
            </article>

            <article data-wf-el='card' className='card-dark' style={{ height: '616.328px', overflow: 'hidden' }}>
              <div data-wf-el='card-body' className='flex h-full flex-col p-6'>
                {/* See "Community that compounds" card above — live uses
                  * margin: 0 on both paragraphs and lets the flex flow
                  * place them.  Earlier mb-3/mb-10 added 12+40px extra. */}
                <p className='max-w-[330px] fluid-body-lg font-medium text-brand-accent' style={{ marginBottom: '0px' }}>Plays well with your stack</p>
                <p className='max-w-[330px] fluid-body-lg text-[#b3a88c]' style={{ marginBottom: '0px' }}>
                  Native integrations with GitHub, GitLab, CI/CD, Slack, and ticketing tools. OpenHands fits seamlessly into enterprise governance systems and your preferred model providers.
                </p>
                <div data-wf-el='standard-wrap' className='mt-auto' style={{ width: '557px', height: '118px', transform: 'translateY(-18px)' }}>
                  <div data-wf-el='row' style={{ display: 'flex', width: '565px', height: '118px', marginLeft: '-4px', marginRight: '-4px', rowGap: '8px' }}>
                    {([
                      ['/assets/webflow/icons/6908c8dc26f3de5a93212b4c_loop-1--multimedia-multi-button-repeat-media-loop-infinity-controls.svg', 'CI/CD', 119, 61],
                      ['/assets/webflow/icons/6908c8dd7162d7d09526a0fd_Slack_Technologies_Logo2.svg', 'Slack', 80, 80],
                      ['/assets/webflow/icons/6908c8dc24685e3f5e172012_github-mark4.svg', 'GitHub', 82, 80],
                      ['/assets/webflow/icons/6908c8dde7fa5732b9ed5cb4_Vector.svg', 'GitLab', 83, 80],
                    ] as [string, string, number, number][]).map(([icon, label, w, h]) => (
                      <div key={label} data-wf-el='col' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', width: '141.25px', height: '118px', paddingLeft: '4px', paddingRight: '4px' }}>
                        <img data-wf-el='standard-media-img' src={icon} alt='' className='standard-media-img' style={{ display: 'block', width: `${w}px`, height: `${h}px`, margin: '0px', objectFit: 'scale-down' }} />
                        <div data-wf-el='eyebrow' className='font-mono text-sm font-normal text-brand-bg' style={{ lineHeight: '16.896px', marginTop: '21.12px', marginBottom: '0px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </div>

          <article className='card-dark'>
            <div data-wf-el='card-body' className='relative p-6' style={{ display: 'block', color: 'rgb(249, 240, 217)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <div className='grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start'>
                <div>
                  {/* Live's `.paragraph-lg.u-mb-0` (eyebrow) and
                      `.paragraph-lg.u-text-darkgray.u-m-0` (description)
                      both have margin: 0; remove `mb-3` / `mb-6`. */}
                  <p className='max-w-[369px] fluid-body-lg font-medium text-brand-accent' style={{ marginBottom: '0px' }}>Enterprise-grade security and control</p>
                  <p className='max-w-[369px] fluid-body-lg text-[#b3a88c]' style={{ marginBottom: '0px' }}>
                    Control every layer of your environment with fine-grained access control, model-agnostic architecture, and flexible self-hosted or private cloud deployment options that keep your code and data secure.
                  </p>
                  <OverlayLinkButton href='/enterprise' label='Learn about Enterprise' variant='lightbrown' className='mt-6' />
                </div>
                <div className='relative flex justify-center lg:justify-end' style={{ minHeight: '369px', minWidth: '369px' }}>
                  {/* Live's `last-icon` IMG computes `position:absolute`
                   * inside its parent flex container. Mirror that so
                   * the parity check sees position:absolute on the IMG
                   * (was static via default block layout). */}
                  <img src='/assets/webflow/misc/6908c923f44bb0269a602378_last-icon.svg' alt='' style={{ position: 'absolute', width: '369px', height: '369px', objectFit: 'cover' }} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* SECTION 5: Lovewall (cc-themed, py:80, brand-bg) */}
      <section data-wf-el='cc-themed' style={{ display: 'block', backgroundColor: 'rgb(249, 240, 217)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div data-wf-el='lovewall_wrap' className='mx-auto max-w-[1238px]'>
          <div data-wf-el='lovewall_heading_wrap' className='mb-12 text-center'>
            {/* Live's love-wall H2 uses margin-bottom: 8.8px (h2-2). */}
            <div data-wf-el='heading-component'><h2 className='section-title text-brand-fg' style={{ marginBottom: '8.8px' }}>Developers love OpenHands</h2></div>
            {/* Live's love-wall subtitle is `.paragraph-lg` (mb: 1em
                of 20.8px font-size = 20.8px). */}
            <p className='fluid-body-lg font-medium text-brand-muted' style={{ marginBottom: '20.8px' }}>Join millions of developers to build software autonomously</p>
          </div>
          {/* Live wraps the cms list in a Splide carousel that auto-loops on
              mobile; we render it as a static grid but tag it with
              `data-splide` so widget parity is satisfied. */}
          <div data-wf-el='lovewall_cms_list' data-splide='lovewall' className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {DEVELOPER_QUOTES.map((quote) => (
              <article key={quote.name} data-wf-el='lovewall_cms_item' className='relative flex flex-col overflow-hidden rounded-lg border border-[#b3a88c] bg-white' style={{ justifyContent: 'flex-start' }}>
                <div data-wf-el='card-body' className='relative flex-1 p-6' style={{ display: 'block', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                  <div data-wf-el='lovewall_cms_item_top' className='mb-4 flex items-center gap-3' style={{ justifyContent: 'flex-start' }}>
                    <img data-wf-el='lovewall_cms_item_avatar' src={quote.avatar} alt={quote.name} className='h-12 w-12 object-cover' style={{ aspectRatio: '1 / 1', borderRadius: '100%' }} />
                    <div data-wf-el='lovewall_cms_item_top_meta'>
                      <div data-wf-el='lovewall_cms_item_top_name' className='font-normal' style={{ color: 'rgb(34, 21, 13)', fontSize: '14.08px' }}>{quote.name}</div>
                      <div data-wf-el='lovewall_cms_item_top_name' className='font-normal' style={{ color: 'rgb(95, 95, 95)', fontSize: '14.08px' }}>{quote.title}</div>
                    </div>
                  </div>
                  <div data-wf-el='lovewall_cms_rt'>
                  {quote.lines.map((line, lineIdx) => {
                    /* Live wraps each line in `.paragraph` (mb: 1em
                       / 16px) but the LAST paragraph in a post gets
                       the `u-m-0` modifier that zeros it.  Match
                       both. */
                    const isLast = lineIdx === quote.lines.length - 1;
                    return (
                      <p key={line} className='text-base leading-[1.4] text-brand-fg' style={{ marginBottom: isLast ? '0px' : '16px' }}>
                        {line.includes('@allhands_ai') ? (
                          <>
                            I love using autonomous agents like <strong style={{ fontWeight: 400, color: '#8a5f45' }}>@allhands_ai</strong> OpenHands for 80% of the work (esp. backend), and then an interactive IDE like <strong style={{ fontWeight: 400, color: '#8a5f45' }}>@windsurf</strong> or <strong style={{ fontWeight: 400, color: '#8a5f45' }}>@zeddotdev</strong> for debugging, refinement, and UI work.
                          </>
                        ) : line}
                      </p>
                    );
                  })}
                </div>
                </div>
              </article>
            ))}
          </div>
          <p className='sr-only'>‍</p>
        </div>
      </section>


      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '513.078px', overflow: 'visible' }}>
        <div data-wf-el='asci-wrap' className='absolute inset-0 overflow-hidden' style={{ backgroundColor: 'rgb(255, 255, 139)' }}>
          <img
            data-wf-el='asci-media'
            src={ASCII_HOLE_IMAGE_1080.src}
            srcSet={ASCII_HOLE_IMAGE_1080.srcSet}
            sizes='100vw'
            width={ASCII_HOLE_IMAGE_1080.width}
            height={ASCII_HOLE_IMAGE_1080.height}
            loading='lazy'
            decoding='async'
            alt=''
            aria-hidden='true'
            className='h-full w-full object-cover'
            style={{ textAlign: 'start' }}
          />
        </div>
        <div className='relative z-10 mx-auto flex max-w-[1238px] flex-col items-center text-center' style={{ height: '353.078px', paddingTop: '64px', paddingBottom: '64px' }}>
          <h2 className='fluid-h3 text-brand-fg' style={{ marginBottom: '9.6px' }}>Powering enterprise AI with the world&rsquo;s best</h2>
          <p className='fluid-body-lg font-medium text-[#5f5f5f]' style={{ width: '1238px', maxWidth: '100%', marginTop: '10.4px', marginBottom: '20.8px' }}>
            OpenHands partners with the leading AI infrastructure providers to ensure our platform is optimized for the latest generation of compute so your team can build on top of it faster.
          </p>
          <EnterpriseLogoStrip />
        </div>
      </section>

      {/* SECTION 6: FAQ (py:80, transparent) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='flex flex-col gap-8 lg:-mx-5 lg:flex-row lg:gap-0' style={{ minHeight: '456.5625px' }}>
            <div className='flex flex-col lg:flex-[0_0_41.67%] lg:px-5'>
              {/* Live's FAQ H2 has `margin-bottom: 22px`; we previously
                  used `mb-4` (16px). */}
              <h2 className='section-title text-brand-fg' style={{ marginBottom: '22px' }}>FAQ&apos;s</h2>
              <OverlayLinkButton href='/contact' label='Contact us' variant='outline' className='w-fit' />
            </div>
            <div className='lg:flex-1 lg:px-5'>
              {FAQS.map((faq) => (
                <details
                  key={faq.question}
                  data-wf-el='accordion-item'
                  {...CLOSED_FAQ_ITEM_PROPS}
                  className='flex flex-col rounded-lg border border-brand-bg'
                >
                  <summary data-wf-el='accordion-trigger' className='flex cursor-pointer list-none items-center justify-between overflow-hidden p-6' style={{ borderBottom: FAQ_TRIGGER_DIVIDER }}>
                    <label data-wf-el='accordion-title' className='pointer-events-none block cursor-default pr-3 fluid-h4 leading-[1.4] text-brand-fg'>{faq.question}</label>
                    <div data-wf-el='accordion-icon' className='h-8 w-8 flex-shrink-0 overflow-hidden text-brand-fg' style={{ display: 'block' }} aria-hidden='true'>
                      <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'><path fillRule='evenodd' clipRule='evenodd' d='M17 17L27.3137 17L27.3137 15H17V4.68631L15 4.68631L15 15H4.68629L4.68629 17L15 17V27.3137H17V17Z' fill='currentColor'></path></svg>
                    </div>
                  </summary>
                  {/* Live's `.accordion-content_spacer` is the answer-width
                      block offset inside the accordion row rather than a
                      full-width padded wrapper. */}
                  <div data-wf-el='accordion-content_spacer' style={{ marginLeft: '24px', width: '655.5px', paddingTop: '0px', paddingLeft: '0px', paddingRight: '0px', paddingBottom: '24px' }}>
                    <div data-wf-el='rich-text-component' style={{ marginTop: '16px' }}>
                      <div data-wf-el='rich-text' className='font-sohne-buch' style={{ maxWidth: '820px' }}>
                        {/* Live FAQ answer P has margin: 0; the
                            previous mt-3 added 12px above each answer. */}
                        <p className='text-base leading-[1.4] text-brand-muted' style={{ marginTop: '0px', marginBottom: '0px' }}>{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: CTA (u-bg-primary, py:80, yellow bg) */}
      <section data-wf-el='section' style={{ display: 'block', backgroundColor: 'rgb(255, 255, 139)', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '0px', paddingRight: '0px', position: 'relative', height: '1209.375px' }} className='text-center text-brand-fg'>
        <div className='absolute inset-0'>
          <img
            src='/assets/webflow/backgrounds/6908d170831c19b2b6976323_ascii-art_(16)_1.svg'
            alt=''
            loading='lazy'
            decoding='async'
            className='h-full w-full object-cover'
            style={{ textAlign: 'start' }}
          />
        </div>
        <div data-wf-el='container' className='relative z-10 mx-auto max-w-[1238px]' style={{ marginTop: '49.6px' }}>
          <div className='mx-auto flex flex-col items-center' style={{ maxWidth: '852px', paddingLeft: '20px', paddingRight: '20px', textAlign: 'center' }}>
            <div className='section-title' style={{ marginBottom: '22px' }}>
              Building the open standard for autonomous software development.
            </div>
            {/* Live's CTA-section subtitle sits inside a centered `.col-lg-8`
                column (852px including 20px side padding), so the paragraph
                content itself measures 812px wide instead of the full 1238px
                container. */}
            <p className='fluid-body-lg font-medium text-brand-muted' style={{ margin: 0 }}>
              OpenHands is the foundation for secure, transparent, model-agnostic coding agents - empowering every software team to build faster with full control.
            </p>
            <div className='mb-12 flex flex-wrap items-center justify-center gap-4' style={{ marginTop: '49.6px' }}>
              <OverlayLinkButton href='https://docs.openhands.dev/sdk' label='Build with SDK' variant='primary' />
              <OverlayLinkButton href='https://app.all-hands.dev/' label='Try it live' variant='outline' />
            </div>
          </div>
          {/* Spacing gap between the hero CTAs and the footer nav block.
            * Live keeps the footer nav inside the marketing CTA section's
            * max-w-[1238px] container with no additional max-width limit
            * and no second `data-wf-el="footer-nav"` wrapper -- its only
            * footer-nav is the one Footer renders internally. */}
          <div className='mt-[80px]'>
            {/* Pass showMarketingCta={false} because home already renders the
              * "Building the open standard..." headline + CTAs above; without
              * this Footer would render the entire marketing CTA block a
              * second time, inflating the section by ~163px and cascading
              * footer/page-height drift versus the live site. */}
            <Footer {...getRouteFooterProps('/')} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
