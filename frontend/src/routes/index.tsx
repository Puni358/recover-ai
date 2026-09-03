import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  IndianRupee,
  Percent,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { AppShell } from "@/components/recover/app-shell";
import { KpiCard } from "@/components/recover/kpi-card";
import {
  OpportunityRow,
  OpportunityTableHeader,
} from "@/components/recover/opportunity-row";
import { AgentStatusBadge } from "@/components/recover/status-badge";
import { WorkflowStrip } from "@/components/recover/workflow-strip";
import { inr } from "@/lib/recover-format";
import { useRecover } from "@/lib/recover-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — RecoverAI Revenue Recovery" },
      {
        name: "description",
        content:
          "RecoverAI finds failed payments, abandoned checkouts and failed subscriptions, then recovers the revenue with merchant-approved actions.",
      },
      { property: "og:title", content: "Overview — RecoverAI Revenue Recovery" },
      {
        property: "og:description",
        content:
          "Turn failed payments into recovered revenue with an approval-gated AI agent.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { metrics, opportunities, customerOf } = useRecover();

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good evening 👋
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            RecoverAI found {metrics.openCount} opportunities worth{" "}
            <span className="font-medium text-foreground">
              {inr(metrics.revenueAtRisk)}
            </span>
            .
          </p>
        </div>

        <AgentStatusBadge />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={inr(metrics.totalRevenue)}
          hint="Successfully processed"
          icon={<IndianRupee className="size-3.5" />}
        />

        <KpiCard
          label="Revenue at Risk"
          value={inr(metrics.revenueAtRisk)}
          hint={`Across ${metrics.openCount} opportunities`}
          tone="risk"
          icon={<TriangleAlert className="size-3.5" />}
        />

        <KpiCard
          label="Recovered Revenue"
          value={inr(metrics.recoveredRevenue)}
          hint={`${metrics.recoveredCount} recovered`}
          tone={metrics.recoveredRevenue > 0 ? "success" : "neutral"}
          icon={<TrendingUp className="size-3.5" />}
        />

        <KpiCard
          label="Recovery Rate"
          value={`${metrics.recoveryRate}%`}
          hint="Current recovery performance"
          icon={<Percent className="size-3.5" />}
        />
      </div>

      <section className="panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-start gap-6 p-5 lg:p-6">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </span>

          <div className="min-w-[240px] flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold">RecoverAI Agent</h2>
              <AgentStatusBadge compact />
            </div>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Your AI agent continuously identifies failed payments, abandoned
              checkouts and subscription failures, then recommends the safest
              recovery action.
            </p>

            <div className="mt-4">
              <WorkflowStrip current={0} />
            </div>
          </div>

          <Link
            to="/agent"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open AI Agent
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Revenue Opportunities
            </h2>

            <p className="text-sm text-muted-foreground">
              AI-ranked opportunities that could recover lost revenue.
            </p>
          </div>

          <Link
            to="/opportunities"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        </div>

        <div className="panel mt-3 overflow-hidden">
          <OpportunityTableHeader />

          {opportunities.map((opportunity) => {
            const customer = customerOf(opportunity.customerId);

            return (
              <OpportunityRow
                key={opportunity.id}
                opportunity={opportunity}
                customer={customer}
              />
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
