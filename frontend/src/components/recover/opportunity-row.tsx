import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";

import { Pill, OpportunityStatusBadge } from "./status-badge";
import { ProbabilityBar } from "./probability";
import {
  actionLabel,
  inr,
  opportunityTypeLabel,
} from "@/lib/recover-format";
import type { Customer, Opportunity } from "@/lib/recover-types";

const typeIcon = {
  FAILED_PAYMENT: CreditCard,
  ABANDONED_CHECKOUT: ShoppingCart,
  FAILED_SUBSCRIPTION: RefreshCw,
} as const;

export function OpportunityRow({
  opportunity,
  customer,
}: {
  opportunity: Opportunity;
  customer?: Customer;
}) {
  const Icon = typeIcon[opportunity.opportunityType];

  const customerName = customer?.name ?? "Unknown customer";

  const initials = customerName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isRecovered = opportunity.status === "RECOVERED";

  return (
    <div
      className={[
        "group grid grid-cols-1 gap-4 border-b border-border px-5 py-4 transition-colors last:border-b-0",
        "hover:bg-accent/40",
        "lg:grid-cols-12 lg:items-center lg:gap-3",
        isRecovered ? "bg-muted/10" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 lg:col-span-3">
        <span className="tabular flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
          {initials || "?"}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-sm font-medium">
              {customerName}
            </div>

            {isRecovered && (
              <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="size-3" />

            <span>
              {opportunityTypeLabel[opportunity.opportunityType]}
            </span>

            {opportunity.paymentMethod && (
              <>
                <span>·</span>
                <span>{opportunity.paymentMethod}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="tabular text-sm font-semibold">
          {inr(opportunity.amount)}
        </div>

        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {opportunity.failureReason ?? "Checkout not completed"}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            Probability
          </span>

          <span className="tabular font-semibold">
            {opportunity.recoveryProbability}%
          </span>
        </div>

        <ProbabilityBar value={opportunity.recoveryProbability} />
      </div>

      <div className="lg:col-span-2">
        <Pill
          tone={
            opportunity.recommendedAction === "NO_ACTION"
              ? "neutral"
              : "info"
          }
        >
          {actionLabel[opportunity.recommendedAction]}
        </Pill>
      </div>

      <div className="lg:col-span-2">
        <OpportunityStatusBadge status={opportunity.status} />
      </div>

      <div className="lg:col-span-1 lg:justify-self-end">
        <Link
          to="/opportunities/$id"
          params={{ id: opportunity.id }}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-border-strong hover:bg-accent"
        >
          Review
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

export function OpportunityTableHeader() {
  return (
    <div className="hidden grid-cols-12 gap-3 border-b border-border bg-muted/40 px-5 py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase lg:grid">
      <div className="col-span-3">Customer</div>
      <div className="col-span-2">Amount at risk</div>
      <div className="col-span-2">Recovery probability</div>
      <div className="col-span-2">AI recommendation</div>
      <div className="col-span-2">Status</div>
      <div className="col-span-1" />
    </div>
  );
}
