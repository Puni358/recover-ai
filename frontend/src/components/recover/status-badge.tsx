import { cn } from "@/lib/utils";
import { actionStatusLabel, opportunityStatusLabel } from "@/lib/recover-format";
import type { ActionStatus, OpportunityStatus } from "@/lib/recover-types";

type Tone = "neutral" | "success" | "warning" | "risk" | "info" | "dark";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/25",
  risk: "bg-risk-soft text-risk border-risk/20",
  info: "bg-info-soft text-info border-info/20",
  dark: "bg-primary text-primary-foreground border-transparent",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const oppTone: Record<OpportunityStatus, Tone> = {
  OPEN: "neutral",
  RECOMMENDED: "info",
  AWAITING_APPROVAL: "warning",
  APPROVED: "info",
  EXECUTING: "warning",
  RECOVERED: "success",
  REJECTED: "neutral",
};

export function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  return <Pill tone={oppTone[status]}>{opportunityStatusLabel[status]}</Pill>;
}

const actionTone: Record<ActionStatus, Tone> = {
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  EXECUTING: "warning",
  COMPLETED: "success",
  FAILED: "risk",
  VERIFIED: "success",
};

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  return <Pill tone={actionTone[status]}>{actionStatusLabel[status]}</Pill>;
}

export function AgentStatusBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
      <span className="live-dot inline-block size-1.5 rounded-full bg-success" />
      {compact ? "Active" : "AI Agent Active"}
    </span>
  );
}
