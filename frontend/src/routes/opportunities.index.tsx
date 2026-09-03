import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Sparkles,
  Target,
} from "lucide-react";

import { AppShell } from "@/components/recover/app-shell";
import {
  OpportunityRow,
  OpportunityTableHeader,
} from "@/components/recover/opportunity-row";
import { inr, opportunityTypeLabel } from "@/lib/recover-format";
import { useRecover } from "@/lib/recover-store";
import type { OpportunityType } from "@/lib/recover-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/opportunities/")({
  head: () => ({
    meta: [
      { title: "Revenue Opportunities — RecoverAI" },
      {
        name: "description",
        content:
          "Every failed payment, abandoned checkout and failed subscription ranked by AI recovery probability.",
      },
      {
        property: "og:title",
        content: "Revenue Opportunities — RecoverAI",
      },
      {
        property: "og:description",
        content:
          "AI-ranked opportunities that could recover lost revenue.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

type Filter = OpportunityType | "ALL" | "RECOVERED";

const filters: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  {
    key: "FAILED_PAYMENT",
    label: opportunityTypeLabel.FAILED_PAYMENT,
  },
  {
    key: "ABANDONED_CHECKOUT",
    label: opportunityTypeLabel.ABANDONED_CHECKOUT,
  },
  {
    key: "FAILED_SUBSCRIPTION",
    label: opportunityTypeLabel.FAILED_SUBSCRIPTION,
  },
  { key: "RECOVERED", label: "Recovered" },
];

function OpportunitiesPage() {
  const { opportunities, customerOf, metrics } = useRecover();

  const [filter, setFilter] = useState<Filter>("ALL");

  const activeOpportunities = useMemo(
    () =>
      opportunities.filter(
        (opportunity) =>
          opportunity.status !== "RECOVERED" &&
          opportunity.status !== "REJECTED",
      ),
    [opportunities],
  );

  const averageProbability = useMemo(() => {
    if (!activeOpportunities.length) return 0;

    return Math.round(
      activeOpportunities.reduce(
        (sum, opportunity) =>
          sum + opportunity.recoveryProbability,
        0,
      ) / activeOpportunities.length,
    );
  }, [activeOpportunities]);

  const rows = useMemo(() => {
    return opportunities.filter((opportunity) => {
      if (filter === "RECOVERED") {
        return opportunity.status === "RECOVERED";
      }

      if (filter === "ALL") {
        return opportunity.status !== "REJECTED";
      }

      return (
        opportunity.opportunityType === filter &&
        opportunity.status !== "REJECTED"
      );
    });
  }, [filter, opportunities]);

  const filterCount = (key: Filter) => {
    if (key === "ALL") {
      return opportunities.filter(
        (opportunity) => opportunity.status !== "REJECTED",
      ).length;
    }

    if (key === "RECOVERED") {
      return opportunities.filter(
        (opportunity) => opportunity.status === "RECOVERED",
      ).length;
    }

    return opportunities.filter(
      (opportunity) =>
        opportunity.opportunityType === key &&
        opportunity.status !== "REJECTED",
    ).length;
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              AI RECOVERY QUEUE
            </div>

            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
              Revenue Opportunities
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Every failed payment and abandoned checkout ranked by
              RecoverAI based on recovery probability and customer context.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex size-2 rounded-full bg-primary" />
            {metrics.openCount} active opportunities
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard
            icon={AlertCircle}
            label="Active opportunities"
            value={String(metrics.openCount)}
            detail={`${inr(metrics.revenueAtRisk)} currently at risk`}
          />

          <MetricCard
            icon={CircleDollarSign}
            label="Revenue at risk"
            value={inr(metrics.revenueAtRisk)}
            detail="Potentially recoverable revenue"
          />

          <MetricCard
            icon={Target}
            label="Average recovery probability"
            value={`${averageProbability}%`}
            detail="Across active opportunities"
          />
        </div>

        <div className="panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold">
                Recovery queue
              </div>

              <div className="mt-0.5 text-xs text-muted-foreground">
                Prioritize the highest-value opportunities first.
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {filters.map((item) => {
                const count = filterCount(item.key);

                return (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      filter === item.key
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {item.label}

                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px]",
                        filter === item.key
                          ? "bg-primary-foreground/15 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {rows.length > 0 ? (
            <>
              <OpportunityTableHeader />

              {rows.map((opportunity) => (
                <OpportunityRow
                  key={opportunity.id}
                  opportunity={opportunity}
                  customer={customerOf(opportunity.customerId)}
                />
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted">
                <CheckCircle2 className="size-5 text-muted-foreground" />
              </div>

              <div className="mt-3 text-sm font-medium">
                No opportunities here
              </div>

              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                There are no opportunities matching this filter right now.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
            <span>
              Showing {rows.length} of {opportunities.length} opportunities
            </span>

            <span className="inline-flex items-center gap-1">
              <ArrowUpRight className="size-3" />
              Select an opportunity to review recovery
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof AlertCircle;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            {label}
          </div>

          <div className="mt-1.5 tabular text-xl font-semibold tracking-tight">
            {value}
          </div>

          <div className="mt-1 text-xs text-muted-foreground">
            {detail}
          </div>
        </div>

        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
