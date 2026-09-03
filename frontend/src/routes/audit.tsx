import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  User,
  XCircle,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/recover/app-shell";
import { Pill } from "@/components/recover/status-badge";
import {
  actionLabel,
  clockTime,
  relativeTime,
} from "@/lib/recover-format";
import { useRecover } from "@/lib/recover-store";
import type { AuditEvent } from "@/lib/recover-types";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail — RecoverAI" },
      {
        name: "description",
        content:
          "A transparent, append-only log of every analysis, approval, execution and verification performed by RecoverAI.",
      },
      { property: "og:title", content: "Audit Trail — RecoverAI" },
      {
        property: "og:description",
        content:
          "Every recovery decision recorded with actor, action and result.",
      },
    ],
  }),
  component: AuditPage,
});

const actorIcon = {
  "AI Agent": Bot,
  Merchant: User,
  RecoverAI: ShieldCheck,
} as const;

const eventLabels: Record<string, string> = {
  OPPORTUNITY_DETECTED: "Opportunity Detected",
  AI_ANALYSIS_COMPLETED: "AI Analysis Completed",
  RECOVERY_RECOMMENDED: "Recovery Recommended",
  RECOVERY_APPROVED: "Recovery Approved",
  RECOVERY_REJECTED: "Recovery Rejected",
  RECOVERY_EXECUTING: "Recovery Executing",
  RECOVERY_EXECUTED: "Recovery Executed",
  RECOVERY_VERIFIED: "Recovery Verified",
  RECOVERY_MESSAGE_SENT: "Recovery Message Sent",
};

function friendlyEvent(event: string) {
  return (
    eventLabels[event.toUpperCase()] ??
    event
      .toLowerCase()
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join(" ")
  );
}

function friendlyAction(action?: string | null) {
  if (!action) return "—";

  const normalized = action.toUpperCase();

  return (
    actionLabel[
      normalized as keyof typeof actionLabel
    ] ?? friendlyEvent(normalized)
  );
}

function AuditPage() {
  const {
    audit,
    opportunities,
    customerOf,
  } = useRecover();

  const sortedAudit = [...audit]
    .filter((event) => {
      const timestamp = new Date(event.timestamp).getTime();
      return !Number.isNaN(timestamp);
    })
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime(),
    );

  /*
   * Enrich audit events with the customer belonging to their
   * opportunity. This means older audit records that don't have
   * customer_name in metadata can still display the real customer.
   */
  const enrichedAudit = sortedAudit.map((event) => {
    if (event.customerName) {
      return event;
    }

    if (event.opportunityId) {
      const opportunity = opportunities.find(
        (item) => item.id === event.opportunityId,
      );

      if (opportunity) {
        const customer = customerOf(opportunity.customerId);

        if (customer) {
          return {
            ...event,
            customerName: customer.name,
          };
        }
      }
    }

    return event;
  });

  const verifiedCount = enrichedAudit.filter(
    (event) =>
      event.event.toUpperCase() ===
      "RECOVERY_VERIFIED",
  ).length;

  const approvedCount = enrichedAudit.filter(
    (event) =>
      event.event.toUpperCase() ===
      "RECOVERY_APPROVED",
  ).length;

  const executionCount = enrichedAudit.filter(
    (event) =>
      event.event.toUpperCase() ===
      "RECOVERY_EXECUTING",
  ).length;

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>

              <span className="text-sm font-medium text-muted-foreground">
                Transparent recovery operations
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Audit Trail
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              A complete, append-only record of every AI decision,
              merchant approval and money-moving action.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="success">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
              Audit logging active
            </Pill>

            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              {enrichedAudit.length} recorded events
            </div>
          </div>
        </section>

        {/* Recovery lifecycle */}
        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<Bot className="size-4" />}
            label="Merchant approvals"
            value={approvedCount}
            description="Human-controlled actions"
          />

          <SummaryCard
            icon={<Zap className="size-4" />}
            label="Recoveries executed"
            value={executionCount}
            description="Actions sent for execution"
          />

          <SummaryCard
            icon={<CheckCircle2 className="size-4" />}
            label="Recoveries verified"
            value={verifiedCount}
            description="Confirmed successful outcomes"
          />
        </section>

        {/* Main audit table */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-medium">
                Recovery activity
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Newest events appear first.
              </p>
            </div>

            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              Live
            </div>
          </div>

          {enrichedAudit.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Clock3 className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm font-medium">
                No audit events yet
              </p>

              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Recovery decisions, approvals, executions and
                verification events will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1120px]">
                {/* Desktop header */}
                <div className="grid grid-cols-[110px_135px_minmax(210px,1fr)_170px_170px_minmax(280px,1.5fr)] gap-3 border-b bg-muted/30 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Time</span>
                  <span>Actor</span>
                  <span>Event</span>
                  <span>Customer</span>
                  <span>Action</span>
                  <span>Result</span>
                </div>

                <div className="divide-y divide-border">
                  {enrichedAudit.map((event) => (
                    <AuditRow
                      key={event.id}
                      event={event}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Accountability note */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />

          <div>
            <p className="text-xs font-semibold">
              Every money-moving action is traceable
            </p>

            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              RecoverAI records the recommendation, merchant approval,
              execution and verification outcome so every recovery can
              be explained and audited.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function AuditRow({
  event,
}: {
  event: AuditEvent;
}) {
  const Icon = actorIcon[event.actor] ?? Bot;
  const eventType = event.event.toUpperCase();

  const isVerified =
    eventType === "RECOVERY_VERIFIED";

  const isExecuting =
    eventType === "RECOVERY_EXECUTING";

  const isApproved =
    eventType === "RECOVERY_APPROVED";

  const isRejected =
    eventType === "RECOVERY_REJECTED";

  const isOpportunity =
    eventType === "OPPORTUNITY_DETECTED";

  const isAnalysis =
    eventType === "AI_ANALYSIS_COMPLETED";

  const isMessage =
    eventType === "RECOVERY_MESSAGE_SENT";

  const EventIcon = isVerified
    ? CheckCircle2
    : isRejected
      ? XCircle
      : isExecuting
        ? Zap
        : isApproved
          ? User
          : isOpportunity
            ? CircleDollarSign
            : isAnalysis
              ? Bot
              : isMessage
                ? Bot
                : Icon;

  const tone = isVerified
    ? "success"
    : isRejected
      ? "danger"
      : isApproved || isExecuting
        ? "info"
        : "neutral";

  return (
    <div
      className={`grid grid-cols-[110px_135px_minmax(210px,1fr)_170px_170px_minmax(280px,1.5fr)] items-start gap-3 px-5 py-4 transition-colors hover:bg-accent/30 ${
        isVerified ? "bg-success/[0.025]" : ""
      }`}
    >
      {/* Time */}
      <div className="flex items-start gap-2">
        <Clock3 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />

        <div>
          <div className="text-xs font-medium tabular-nums">
            {clockTime(event.timestamp)}
          </div>

          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {relativeTime(event.timestamp)}
          </div>
        </div>
      </div>

      {/* Actor */}
      <div className="flex items-start gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <div className="whitespace-nowrap text-sm font-medium">
            {event.actor}
          </div>

          <div className="text-[10px] text-muted-foreground">
            {event.actor === "Merchant"
              ? "Human decision"
              : event.actor === "AI Agent"
                ? "AI decision"
                : "System action"}
          </div>
        </div>
      </div>

      {/* Event */}
      <div className="flex min-w-0 items-start gap-2">
        <div
          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${
            isVerified
              ? "bg-success/10"
              : isRejected
                ? "bg-destructive/10"
                : "bg-muted"
          }`}
        >
          <EventIcon
            className={`size-3.5 ${
              isVerified
                ? "text-success"
                : isRejected
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium leading-5">
            {friendlyEvent(event.event)}
          </div>

          {event.message && (
            <div className="mt-1 whitespace-normal break-words text-xs leading-4 text-muted-foreground">
              {event.message}
            </div>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="min-w-0">
        <div className="break-words text-sm font-medium leading-5">
          {event.customerName ?? "—"}
        </div>
      </div>

      {/* Action */}
      <div className="min-w-0">
        <div className="whitespace-normal break-words text-sm leading-5 text-muted-foreground">
          {friendlyAction(event.action)}
        </div>
      </div>

      {/* Result */}
      <div className="min-w-0">
        <Pill tone={tone}>
          <span className="whitespace-normal break-words leading-4">
            {event.result ?? "Event recorded"}
          </span>
        </Pill>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>

        <span className="text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <div className="mt-3 text-2xl font-semibold tabular-nums">
        {value}
      </div>

      <div className="mt-0.5 text-xs text-muted-foreground">
        {description}
      </div>
    </div>
  );
}
