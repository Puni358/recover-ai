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
import { clockTime } from "@/lib/recover-format";
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

function AuditPage() {
  const { audit } = useRecover();

  const sortedAudit = [...audit].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() -
      new Date(a.timestamp).getTime(),
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Audit Trail
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Append-only record of every decision, approval and money-moving
            action.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          {sortedAudit.length} recorded events
        </div>
      </div>

      <div className="panel mt-5 overflow-hidden">
        {sortedAudit.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Clock3 className="size-5 text-muted-foreground" />
            </div>

            <p className="mt-3 text-sm font-medium">
              No audit events yet
            </p>

            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Recovery decisions, approvals, executions and verification
              events will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedAudit.map((event) => (
              <AuditRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

        <div>
          <p className="text-xs font-medium">
            Recovery actions are traceable
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Every AI recommendation, merchant approval and recovery outcome
            is recorded for accountability.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function AuditRow({ event }: { event: AuditEvent }) {
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

  const eventIcon = isVerified
    ? CheckCircle2
    : isExecuting
      ? Zap
      : isApproved
        ? User
        : isRejected
          ? XCircle
          : isOpportunity
            ? CircleDollarSign
            : isAnalysis
              ? Bot
              : Icon;

  const EventIcon = eventIcon;

  const tone = isVerified
    ? "success"
    : isRejected
      ? "danger"
      : isApproved || isExecuting
        ? "info"
        : "neutral";

  return (
    <div className="group grid gap-3 px-5 py-4 transition-colors hover:bg-accent/30 md:grid-cols-[130px_125px_minmax(180px,1fr)_140px_150px_minmax(220px,1.4fr)] md:items-center">
      {/* Timestamp */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="size-3.5 shrink-0 md:hidden" />

        <span className="tabular-nums">
          {clockTime(event.timestamp)}
        </span>
      </div>

      {/* Actor */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>

        <span className="text-sm font-medium">
          {event.actor}
        </span>
      </div>

      {/* Event */}
      <div className="flex items-center gap-2">
        <EventIcon
          className={`size-3.5 shrink-0 ${
            isVerified
              ? "text-emerald-600"
              : isRejected
                ? "text-destructive"
                : "text-muted-foreground"
          }`}
        />

        <span className="text-sm font-medium tracking-tight">
          {event.event}
        </span>
      </div>

      {/* Customer */}
      <div className="truncate text-sm text-muted-foreground">
        {event.customerName ?? "—"}
      </div>

      {/* Action */}
      <div className="truncate text-sm text-muted-foreground">
        {event.action ?? "—"}
      </div>

      {/* Result */}
      <div className="flex min-w-0 items-center gap-2">
        <Pill tone={tone}>
          {event.result ?? "Recorded"}
        </Pill>
      </div>
    </div>
  );
}
