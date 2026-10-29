import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useAgentServerUIAppearance } from "#/components/providers/agent-server-ui-root";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import type {
  PipelineCountKind,
  PipelineStep,
  PipelineTemplate,
} from "./pipeline-templates";

interface StepNodeData extends Record<string, unknown> {
  step: PipelineStep;
  count: number | null;
}

type StepNode = Node<StepNodeData, "step">;

const COUNT_LABEL: Record<PipelineCountKind, I18nKey> = {
  conversations: I18nKey.FEED$FACTORY_CONVERSATIONS,
  live: I18nKey.FEED$FACTORY_LIVE,
  prs: I18nKey.FEED$STAT_PRS,
};

const KIND_CLASS: Record<PipelineStep["kind"], string> = {
  human: "border-success/50 bg-success-soft text-success-soft-foreground",
  auto: "border-border bg-surface-raised text-contrast",
  system: "border-dashed border-border bg-base-secondary text-contrast",
};

const SIDES = [
  ["top", Position.Top],
  ["right", Position.Right],
  ["bottom", Position.Bottom],
  ["left", Position.Left],
] as const;

/** A pipeline step: its title, notes and a live figure, with a handle on each side. */
function StepNodeView({ data, selected }: NodeProps<StepNode>) {
  const { t } = useTranslation("openhands");
  const { step, count } = data;
  return (
    <div
      data-testid={`pipeline-step-${step.id}`}
      className={cn(
        "flex size-full flex-col items-center justify-center gap-0.5 rounded-lg border px-3 py-2 text-center",
        KIND_CLASS[step.kind],
        selected && "ring-2 ring-focus",
      )}
    >
      {SIDES.map(([side, position]) => (
        <span key={side}>
          <Handle
            id={`t-${side}`}
            type="target"
            position={position}
            className="!size-1.5 !border-0 !bg-muted"
          />
          <Handle
            id={`s-${side}`}
            type="source"
            position={position}
            className="!size-1.5 !border-0 !bg-muted"
          />
        </span>
      ))}
      <span className="text-sm font-medium leading-tight">{step.title}</span>
      {step.lines.map((line) => (
        <span key={line} className="text-xs leading-tight text-muted">
          {line}
        </span>
      ))}
      {step.count && count !== null ? (
        <span className="mt-1 rounded-full bg-surface px-2 py-0.5 font-mono text-[11px] text-contrast">
          {t(COUNT_LABEL[step.count], { count })}
        </span>
      ) : null}
    </div>
  );
}

const NODE_TYPES = { step: StepNodeView };

/** The sides of two steps a link should leave and enter, by where they sit. */
function linkHandles(from: PipelineStep, to: PipelineStep) {
  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height / 2);
  if (Math.abs(dy) >= Math.abs(dx) * 0.6) {
    return dy >= 0
      ? { source: "s-bottom", target: "t-top" }
      : { source: "s-top", target: "t-bottom" };
  }
  return dx >= 0
    ? { source: "s-right", target: "t-left" }
    : { source: "s-left", target: "t-right" };
}

interface PipelineMapProps {
  template: PipelineTemplate;
  counts: Record<PipelineCountKind, number>;
  selectedId: string | null;
  onSelect: (stepId: string | null) => void;
}

/** The whole pipeline as a pannable, zoomable node map. */
export function PipelineMap({
  template,
  counts,
  selectedId,
  onSelect,
}: PipelineMapProps) {
  const appearance = useAgentServerUIAppearance();

  const nodes = useMemo<StepNode[]>(
    () =>
      template.steps.map((step) => ({
        id: step.id,
        type: "step",
        position: { x: step.x, y: step.y },
        style: { width: step.width, height: step.height },
        selected: step.id === selectedId,
        data: { step, count: step.count ? counts[step.count] : null },
      })),
    [template, counts, selectedId],
  );

  const edges = useMemo<Edge[]>(() => {
    const byId = new Map(template.steps.map((step) => [step.id, step]));
    return template.links.flatMap((link) => {
      const from = byId.get(link.source);
      const to = byId.get(link.target);
      if (!from || !to) return [];
      const handles = linkHandles(from, to);
      return [
        {
          id: `${link.source}-${link.target}`,
          source: link.source,
          target: link.target,
          sourceHandle: handles.source,
          targetHandle: handles.target,
          type: "smoothstep",
          label: link.label,
          animated: link.dashed,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: link.dashed ? { strokeDasharray: "6 4" } : undefined,
        },
      ];
    });
  }, [template]);

  return (
    <ReactFlow
      // A new template is a new graph, so refit the view.
      key={template.id}
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      colorMode={appearance === "light" ? "light" : "dark"}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.2}
      maxZoom={1.6}
      nodesConnectable={false}
      onNodeClick={(_, node) => onSelect(node.id)}
      onPaneClick={() => onSelect(null)}
    >
      <Background gap={20} />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}
