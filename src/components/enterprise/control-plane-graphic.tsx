import type { LucideIcon } from 'lucide-react';
import {
  ArrowDown,
  BarChart3,
  Bot,
  Code2,
  Database,
  Eye,
  FlaskConical,
  FolderOpen,
  Link2,
  Lock,
  Map,
  Plug,
  Shield,
  ShieldCheck,
  TriangleAlert,
  Wallet,
  Zap,
} from 'lucide-react';

type GraphicItem = {
  icon: LucideIcon;
  label: string;
};

const CONTROL_PLANE_FEATURES: GraphicItem[] = [
  { icon: ShieldCheck, label: 'RBAC' },
  { icon: Lock, label: 'Guardrails' },
  { icon: BarChart3, label: 'Reporting' },
  { icon: Eye, label: 'Observability' },
  { icon: Zap, label: 'LLM Gateway' },
  { icon: Wallet, label: 'Budgeting' },
];

const INTEGRATIONS: GraphicItem[] = [
  { icon: Plug, label: 'APIs & tools' },
  { icon: Link2, label: 'Third-party integrations' },
  { icon: Database, label: 'Internal data' },
  { icon: Bot, label: 'Bring your own agent' },
];

const AGENT_TYPES: GraphicItem[] = [
  { icon: Map, label: 'Planning Agent' },
  { icon: Shield, label: 'Security Agent' },
  { icon: FlaskConical, label: 'Code Coverage' },
  { icon: TriangleAlert, label: 'Incident Triage' },
];

const GraphicIcon = ({ icon: Icon }: { icon: LucideIcon }) => (
  <Icon className='h-5 w-5' strokeWidth={1.75} aria-hidden='true' />
);

const IconChip = ({ icon }: { icon: LucideIcon }) => (
  <div className='enterprise-control-plane-graphic__icon-chip text-brand-bg'>
    <GraphicIcon icon={icon} />
  </div>
);

export const ControlPlaneGraphic = () => (
  <div
    data-wf-el='acp_graphic_wrap'
    className='enterprise-control-plane-graphic-wrap mx-auto w-full'
  >
    <div data-wf-el='acp_graphic' className='enterprise-control-plane-graphic'>
      <div className='enterprise-control-plane-graphic__top'>
        <article data-wf-el='acp_graphic_main' className='card-dark enterprise-control-plane-graphic__main'>
          <header className='enterprise-control-plane-graphic__header'>
            <Shield className='h-5 w-5 text-brand-bg' strokeWidth={1.75} aria-hidden='true' />
            <h4 className='fluid-h4 font-medium text-brand-bg' style={{ margin: 0 }}>
              Agent Control Plane
            </h4>
          </header>

          <div className='enterprise-control-plane-graphic__features'>
            {CONTROL_PLANE_FEATURES.map((feature) => (
              <div key={feature.label} data-wf-el='acp_graphic_feature' className='enterprise-control-plane-graphic__feature'>
                <IconChip icon={feature.icon} />
                <span className='font-mono text-[13px] leading-[16.896px] text-brand-bg'>{feature.label}</span>
              </div>
            ))}
          </div>

          <div className='enterprise-control-plane-graphic__layer'>
            <div className='flex min-w-0 items-center gap-2'>
              <IconChip icon={FolderOpen} />
              <span className='fluid-sm font-medium text-brand-bg'>Context Layer</span>
            </div>
            <span
              className='font-mono text-[12px] leading-[16.896px]'
              style={{ color: 'var(--neutral-card-dark-muted)' }}
            >
              Repos • Docs • Internal data
            </span>
          </div>

          <div className='enterprise-control-plane-graphic__layer enterprise-control-plane-graphic__layer--muted'>
            <div className='flex min-w-0 items-center gap-2'>
              <IconChip icon={Code2} />
              <span className='fluid-sm font-medium text-brand-bg'>API &amp; Automations</span>
            </div>
            <span
              className='font-mono text-[12px] leading-[16.896px]'
              style={{ color: 'var(--neutral-card-dark-muted)' }}
            >
              GitHub • Slack • Jira • Cron
            </span>
          </div>
        </article>

        <aside data-wf-el='acp_graphic_integrations' className='enterprise-control-plane-graphic__integrations'>
          <p
            className='font-mono text-[14px] font-normal leading-[16.896px]'
            style={{ margin: '0 0 16px', color: 'var(--neutral-card-dark-muted)' }}
          >
            Integrations
          </p>
          <ul className='enterprise-control-plane-graphic__integrations-list'>
            {INTEGRATIONS.map((item) => (
              <li key={item.label} className='enterprise-control-plane-graphic__integrations-item'>
                <div className='card-dark enterprise-control-plane-graphic__integration-card'>
                  <IconChip icon={item.icon} />
                  <span className='font-mono text-[12px] leading-[16.896px] text-brand-bg'>{item.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div aria-hidden='true' className='enterprise-control-plane-graphic__connector'>
        <ArrowDown className='h-6 w-6 text-brand-bg' strokeWidth={1.75} />
      </div>

      <div data-wf-el='acp_graphic_agents' className='enterprise-control-plane-graphic__agents'>
        {AGENT_TYPES.map((agent) => (
          <article key={agent.label} data-wf-el='acp_graphic_agent' className='card-dark enterprise-control-plane-graphic__agent-card'>
            <IconChip icon={agent.icon} />
            <span className='font-mono text-[13px] leading-[16.896px] text-brand-bg'>{agent.label}</span>
          </article>
        ))}
      </div>
    </div>
  </div>
);
