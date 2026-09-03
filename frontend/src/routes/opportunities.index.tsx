import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/recover/app-shell";
import {
  OpportunityRow,
  OpportunityTableHeader,
} from "@/components/recover/opportunity-row";
import {
  inr,
  opportunityTypeLabel,
} from "@/lib/recover-format";
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

const filters: {
  key: OpportunityType | "ALL";
  label: string;
}[] = [
  {
    key: "ALL",
    label: "All",
  },
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
];

function OpportunitiesPage() {
  const {
    opportunities,
    customerOf,
    metrics,
  } = useRecover();

  const [filter, setFilter] =
    useState<OpportunityType | "ALL">("ALL");

  const rows = opportunities.filter(
    (o) =>
      filter === "ALL" ||
      o.opportunityType === filter,
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Revenue Opportunities
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            AI-ranked opportunities that could recover lost
            revenue · {inr(metrics.revenueAtRisk)} at risk
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel mt-5 overflow-hidden">
        <OpportunityTableHeader />

        {rows.map((opportunity) => (
          <OpportunityRow
            key={opportunity.id}
            opportunity={opportunity}
            customer={customerOf(
              opportunity.customerId,
            )}
          />
        ))}

        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No opportunities of this type.
          </p>
        )}
      </div>
    </AppShell>
  );
}
