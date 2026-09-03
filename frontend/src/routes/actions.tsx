import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/recover/app-shell";
import { ActionStatusBadge } from "@/components/recover/status-badge";
import { WorkflowStrip } from "@/components/recover/workflow-strip";
import { actionLabel, clockTime, inr, opportunityTypeLabel } from "@/lib/recover-format";
import { useRecover } from "@/lib/recover-store";

export const Route = createFileRoute("/actions")({
  head: () => ({
    meta: [
      { title: "Recovery Actions — RecoverAI" },
      {
        name: "description",
        content:
          "Every recovery action RecoverAI has recommended, executed and verified, with its approval state and result.",
      },
      { property: "og:title", content: "Recovery Actions — RecoverAI" },
      {
        property: "og:description",
        content: "Track approvals, executions and verified recoveries in one timeline.",
      },
    ],
  }),
  component: ActionsPage,
});

function ActionsPage() {
  const { actions, opportunities, customers } = useRecover();

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Recovery Actions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Actions only execute after merchant approval.
      </p>

      <div className="panel mt-5 p-5">
        <WorkflowStrip current={2} />
      </div>

      <div className="panel mt-5 overflow-x-auto">
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] tracking-wide text-muted-foreground uppercase">
              <Th>Customer</Th>
              <Th>Opportunity</Th>
              <Th>Action</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Result</Th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => {
              const opp = opportunities.find((o) => o.id === a.opportunityId);
              const customer = customers.find((c) => c.id === a.customerId);
              return (
                <tr
                  key={a.id}
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-accent/50"
                >
                  <Td className="font-medium">{customer?.name}</Td>
                  <Td className="text-muted-foreground">
                    {opp ? (
                      <Link
                        to="/opportunities/$id"
                        params={{ id: opp.id }}
                        className="hover:text-foreground hover:underline"
                      >
                        {opportunityTypeLabel[opp.opportunityType]}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{actionLabel[a.action]}</Td>
                  <Td className="tabular">{inr(a.amount)}</Td>
                  <Td>
                    <ActionStatusBadge status={a.status} />
                  </Td>
                  <Td className="text-muted-foreground">{clockTime(a.createdAt)}</Td>
                  <Td className={a.status === "VERIFIED" ? "text-success" : "text-muted-foreground"}>
                    {a.result ?? "—"}
                  </Td>
                </tr>
              );
            })}
            {actions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No recovery actions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className ?? ""}`}>{children}</td>;
}
