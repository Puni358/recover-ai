import { createFileRoute } from "@tanstack/react-router";
import { Bot, ShieldCheck, User } from "lucide-react";

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
        content: "Every recovery decision recorded with actor, action and result.",
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

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Audit Trail</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Append-only record of every decision, approval and money-moving action.
      </p>

      <div className="panel mt-5 divide-y divide-border">
        {audit.map((e) => (
          <AuditRow key={e.id} event={e} />
        ))}
      </div>
    </AppShell>
  );
}

function AuditRow({ event }: { event: AuditEvent }) {
  const Icon = actorIcon[event.actor];
  const recovered = event.event.startsWith("Verified");
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-accent/40">
      <span className="tabular w-32 shrink-0 text-xs text-muted-foreground">
        {clockTime(event.timestamp)}
      </span>
      <span className="flex w-32 shrink-0 items-center gap-1.5 text-sm font-medium">
        <Icon className="size-3.5 text-muted-foreground" />
        {event.actor}
      </span>
      <span className="min-w-[150px] flex-1 text-sm">{event.event}</span>
      <span className="w-32 shrink-0 text-sm text-muted-foreground">{event.customerName ?? "—"}</span>
      <span className="w-44 shrink-0 text-sm text-muted-foreground">{event.action ?? "—"}</span>
      <Pill tone={recovered ? "success" : "neutral"}>{event.result ?? "Recorded"}</Pill>
    </div>
  );
}
