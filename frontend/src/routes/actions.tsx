import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

import { AppShell } from "@/components/recover/app-shell";
import { ActionStatusBadge } from "@/components/recover/status-badge";
import { WorkflowStrip } from "@/components/recover/workflow-strip";
import {
  actionLabel,
  clockTime,
  inr,
  opportunityTypeLabel,
} from "@/lib/recover-format";
import { useRecover } from "@/lib/recover-store";
import type { ActionStatus } from "@/lib/recover-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/actions")({
  head: () => ({
    meta: [
      { title: "Recovery Actions — RecoverAI" },
      {
        name: "description",
        content:
          "Every recovery action RecoverAI has recommended, executed and verified, with its approval state and result.",
      },
      {
        property: "og:title",
        content: "Recovery Actions — RecoverAI",
      },
      {
        property: "og:description",
        content:
          "Track approvals, executions and verified recoveries in one timeline.",
      },
    ],
  }),
  component: ActionsPage,
});

type ActionFilter = "ALL" | ActionStatus;

const filters: { key: ActionFilter; label: string }[] = [
  { key: "ALL", label: "All actions" },
  { key: "APPROVED", label: "Approved" },
  { key: "EXECUTING", label: "Executing" },
  { key: "VERIFIED", label: "Verified" },
  { key: "REJECTED", label: "Rejected" },
];

function ActionsPage() {
  const { actions, opportunities, customers } = useRecover();

  const [filter, setFilter] =
    useState<ActionFilter>("ALL");

  const stats = useMemo(() => {
    const verified = actions.filter(
      (action) => action.status === "VERIFIED",
    );

    const approved = actions.filter(
      (action) =>
        action.status === "APPROVED" ||
        action.status === "EXECUTING",
    );

    const recoveredRevenue = verified.reduce(
      (sum, action) => sum + Number(action.amount),
      0,
    );

    const successRate =
      actions.length > 0
        ? Math.round(
            (verified.length / actions.length) * 100,
          )
        : 0;

    return {
      total: actions.length,
      verified: verified.length,
      approved: approved.length,
      recoveredRevenue,
      successRate,
    };
  }, [actions]);

  const rows = useMemo(() => {
    return [...actions]
      .filter(
        (action) =>
          filter === "ALL" ||
          action.status === filter,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  }, [actions, filter]);

  const countFor = (filterKey: ActionFilter) => {
    if (filterKey === "ALL") {
      return actions.length;
    }

    return actions.filter(
      (action) => action.status === filterKey,
    ).length;
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              RECOVERY EXECUTION
            </div>

            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
              Recovery Actions
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Track every approved recovery from execution through
              verification. Money-moving actions require merchant approval.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Merchant approval required
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Activity}
            label="Total actions"
            value={String(stats.total)}
            detail="Recovery actions created"
          />

          <MetricCard
            icon={Clock3}
            label="Awaiting completion"
            value={String(stats.approved)}
            detail="Approved or currently executing"
          />

          <MetricCard
            icon={CheckCircle2}
            label="Revenue recovered"
            value={inr(stats.recoveredRevenue)}
            detail={`${stats.verified} verified recovery${stats.verified === 1 ? "" : "ies"}`}
          />

          <MetricCard
            icon={ShieldCheck}
            label="Verification rate"
            value={`${stats.successRate}%`}
            detail="Actions ending in verified recovery"
          />
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                Recovery lifecycle
              </div>

              <div className="mt-0.5 text-xs text-muted-foreground">
                RecoverAI follows every action through a controlled workflow.
              </div>
            </div>

            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <PlayCircle className="size-3.5" />
              Simulation mode
            </div>
          </div>

          <WorkflowStrip
              current={workflowStage(actions)}
            />
        </div>

        <div className="panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold">
                Action history
              </div>

              <div className="mt-0.5 text-xs text-muted-foreground">
                A complete record of merchant-approved recovery attempts.
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {filters.map((item) => {
                const count = countFor(item.key);

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

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                  <Th>Customer</Th>
                  <Th>Opportunity</Th>
                  <Th>Action</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Execution</Th>
                  <Th>Created</Th>
                  <Th>Result</Th>
                </tr>
              </thead>

              <tbody>
                {rows.map((action) => {
                  const opportunity = opportunities.find(
                    (item) => item.id === action.opportunityId,
                  );

                  const customer = customers.find(
                    (item) => item.id === action.customerId,
                  );

                  return (
                    <tr
                      key={action.id}
                      className="border-b border-border transition-colors last:border-b-0 hover:bg-accent/40"
                    >
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-medium text-muted-foreground">
                            {initials(customer?.name)}
                          </span>

                          <span className="font-medium">
                            {customer?.name ?? "Unknown customer"}
                          </span>
                        </div>
                      </Td>

                      <Td className="text-muted-foreground">
                        {opportunity ? (
                          <Link
                            to="/opportunities/$id"
                            params={{ id: opportunity.id }}
                            className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                          >
                            {opportunityTypeLabel[
                              opportunity.opportunityType
                            ]}
                            <ArrowUpRight className="size-3" />
                          </Link>
                        ) : (
                          "—"
                        )}
                      </Td>

                      <Td>
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-3.5 text-muted-foreground" />
                          <span>
                            {actionLabel[action.action]}
                          </span>
                        </div>
                      </Td>

                      <Td>
                        <span className="tabular font-semibold">
                          {inr(action.amount)}
                        </span>
                      </Td>

                      <Td>
                        <ActionStatusBadge status={action.status} />
                      </Td>

                      <Td>
                        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          {action.executionMode}
                        </span>
                      </Td>

                      <Td className="whitespace-nowrap text-muted-foreground">
                        {clockTime(action.createdAt)}
                      </Td>

                      <Td
                        className={cn(
                          "max-w-[240px] truncate",
                          action.status === "VERIFIED"
                            ? "font-medium text-success"
                            : action.status === "REJECTED"
                              ? "text-muted-foreground"
                              : "text-muted-foreground",
                        )}
                        title={action.result ?? undefined}
                      >
                        {action.result ?? "Awaiting result"}
                      </Td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center"
                    >
                      <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-border bg-muted">
                        {filter === "VERIFIED" ? (
                          <CheckCircle2 className="size-5 text-muted-foreground" />
                        ) : filter === "REJECTED" ? (
                          <XCircle className="size-5 text-muted-foreground" />
                        ) : (
                          <Activity className="size-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="mt-3 text-sm font-medium">
                        No actions in this state
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Recovery actions will appear here as the agent works.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
            <span>
              Showing {rows.length} of {actions.length} actions
            </span>

            <span className="hidden items-center gap-1 sm:inline-flex">
              <ShieldCheck className="size-3" />
              Every execution requires merchant approval
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
  icon: typeof Activity;
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

function initials(name?: string) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 font-medium">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-4 py-3", className)}>
      {children}
    </td>
  );
}

function workflowStage(actions: {
  status: ActionStatus;
}[]) {
  if (actions.length === 0) return 0;

  const hasVerified = actions.some(
    (action) => action.status === "VERIFIED",
  );

  if (hasVerified) return 5;

  const hasExecuting = actions.some(
    (action) => action.status === "EXECUTING",
  );

  if (hasExecuting) return 3;

  const hasApproved = actions.some(
    (action) => action.status === "APPROVED",
  );

  if (hasApproved) return 2;

  const hasRejected = actions.some(
    (action) => action.status === "REJECTED",
  );

  if (hasRejected) return 2;

  return 1;
}
