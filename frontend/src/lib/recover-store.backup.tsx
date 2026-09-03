import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  demoActions,
  demoAudit,
  demoCustomers,
  demoMerchant,
  demoOpportunities,
  demoTotalRevenue,
} from "./recover-demo-data";
import { actionLabel, inr, opportunityTypeLabel } from "./recover-format";
import type {
  AuditEvent,
  Customer,
  Merchant,
  Opportunity,
  RecoveryAction,
} from "./recover-types";

/**
 * Single client-side data layer. Every read/write in the UI goes through this
 * store, so each method below maps 1:1 onto a backend function
 * (get-dashboard, approve-recovery, execute-recovery, verify-recovery, ...).
 */

interface Metrics {
  totalRevenue: number;
  revenueAtRisk: number;
  recoveredRevenue: number;
  recoveredCount: number;
  openCount: number;
  recoveryRate: number;
}

interface RecoverContextValue {
  merchant: Merchant;
  customers: Customer[];
  opportunities: Opportunity[];
  actions: RecoveryAction[];
  audit: AuditEvent[];
  metrics: Metrics;
  customerOf: (opportunity: Opportunity) => Customer;
  getOpportunity: (id: string) => Opportunity | undefined;
  approveRecovery: (opportunityId: string) => void;
  rejectRecovery: (opportunityId: string) => void;
  executeRecovery: (opportunityId: string) => void;
  verifyRecovery: (opportunityId: string) => void;
  resetDemo: () => void;
}

const RecoverContext = createContext<RecoverContextValue | null>(null);

const fallbackCustomer: Customer = {
  id: "cus_unknown",
  name: "Unknown customer",
  email: "",
  successfulPayments: 0,
  lifetimeValue: 0,
};

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${seq++}`;

export function RecoverProvider({ children }: { children: ReactNode }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(demoOpportunities);
  const [actions, setActions] = useState<RecoveryAction[]>(demoActions);
  const [audit, setAudit] = useState<AuditEvent[]>(demoAudit);

  const log = useCallback((event: Omit<AuditEvent, "id" | "timestamp">) => {
    setAudit((prev) => [
      { ...event, id: nextId("aud"), timestamp: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const customerOf = useCallback(
    (opportunity: Opportunity) =>
      demoCustomers.find((c) => c.id === opportunity.customerId) ?? fallbackCustomer,
    [],
  );

  const getOpportunity = useCallback(
    (id: string) => opportunities.find((o) => o.id === id),
    [opportunities],
  );

  const patch = useCallback((id: string, changes: Partial<Opportunity>) => {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)));
  }, []);

  const approveRecovery = useCallback(
    (opportunityId: string) => {
      const opp = opportunities.find((o) => o.id === opportunityId);
      if (!opp) return;
      const customer = customerOf(opp);
      patch(opportunityId, { status: "APPROVED" });
      setActions((prev) => [
        {
          id: nextId("act"),
          opportunityId,
          customerId: opp.customerId,
          action: opp.recommendedAction,
          amount: opp.amount,
          status: "APPROVED",
          executionMode: demoMerchant.executionMode,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      log({
        actor: "Merchant",
        event: "Approved recovery",
        opportunityId,
        customerName: customer.name,
        action: actionLabel[opp.recommendedAction],
        result: "Approval granted",
      });
    },
    [customerOf, log, opportunities, patch],
  );

  const rejectRecovery = useCallback(
    (opportunityId: string) => {
      const opp = opportunities.find((o) => o.id === opportunityId);
      if (!opp) return;
      patch(opportunityId, { status: "REJECTED" });
      setActions((prev) =>
        prev.map((a) =>
          a.opportunityId === opportunityId && a.status === "PENDING_APPROVAL"
            ? { ...a, status: "FAILED", result: "Rejected by merchant" }
            : a,
        ),
      );
      log({
        actor: "Merchant",
        event: "Rejected recovery",
        opportunityId,
        customerName: customerOf(opp).name,
        action: actionLabel[opp.recommendedAction],
        result: "No action taken",
      });
    },
    [customerOf, log, opportunities, patch],
  );

  const executeRecovery = useCallback(
    (opportunityId: string) => {
      const opp = opportunities.find((o) => o.id === opportunityId);
      if (!opp) return;
      patch(opportunityId, { status: "EXECUTING" });
      setActions((prev) =>
        prev.map((a) =>
          a.opportunityId === opportunityId && a.status === "APPROVED"
            ? { ...a, status: "EXECUTING" }
            : a,
        ),
      );
      log({
        actor: "RecoverAI",
        event: "Executed recovery",
        opportunityId,
        customerName: customerOf(opp).name,
        action: actionLabel[opp.recommendedAction],
        result:
          opp.recommendedAction === "CREATE_PAYMENT_LINK"
            ? "Payment link created"
            : "Action dispatched",
      });
    },
    [customerOf, log, opportunities, patch],
  );

  const verifyRecovery = useCallback(
    (opportunityId: string) => {
      const opp = opportunities.find((o) => o.id === opportunityId);
      if (!opp) return;
      patch(opportunityId, { status: "RECOVERED" });
      setActions((prev) =>
        prev.map((a) =>
          a.opportunityId === opportunityId && a.status === "EXECUTING"
            ? { ...a, status: "VERIFIED", result: `${inr(opp.amount)} recovered` }
            : a,
        ),
      );
      log({
        actor: "RecoverAI",
        event: "Verified recovery",
        opportunityId,
        customerName: customerOf(opp).name,
        action: actionLabel[opp.recommendedAction],
        result: `${inr(opp.amount)} recovered`,
      });
    },
    [customerOf, log, opportunities, patch],
  );

  const resetDemo = useCallback(() => {
    setOpportunities(demoOpportunities);
    setActions(demoActions);
    setAudit(demoAudit);
  }, []);

  const metrics = useMemo<Metrics>(() => {
    const recovered = opportunities.filter((o) => o.status === "RECOVERED");
    const atRisk = opportunities.filter(
      (o) => o.status !== "RECOVERED" && o.status !== "REJECTED",
    );
    const total = opportunities.length;
    return {
      totalRevenue: demoTotalRevenue,
      revenueAtRisk: atRisk.reduce((sum, o) => sum + o.amount, 0),
      recoveredRevenue: recovered.reduce((sum, o) => sum + o.amount, 0),
      recoveredCount: recovered.length,
      openCount: atRisk.length,
      recoveryRate: total ? Math.round((recovered.length / total) * 1000) / 10 : 0,
    };
  }, [opportunities]);

  const value = useMemo<RecoverContextValue>(
    () => ({
      merchant: demoMerchant,
      customers: demoCustomers,
      opportunities,
      actions,
      audit,
      metrics,
      customerOf,
      getOpportunity,
      approveRecovery,
      rejectRecovery,
      executeRecovery,
      verifyRecovery,
      resetDemo,
    }),
    [
      actions,
      approveRecovery,
      audit,
      customerOf,
      executeRecovery,
      getOpportunity,
      metrics,
      opportunities,
      rejectRecovery,
      resetDemo,
      verifyRecovery,
    ],
  );

  return <RecoverContext.Provider value={value}>{children}</RecoverContext.Provider>;
}

export function useRecover() {
  const ctx = useContext(RecoverContext);
  if (!ctx) throw new Error("useRecover must be used inside RecoverProvider");
  return ctx;
}

/** Deterministic, data-grounded agent answers (server-side AI in production). */
export function answerAgentQuestion(
  question: string,
  ctx: Pick<RecoverContextValue, "opportunities" | "metrics" | "customerOf">,
): string {
  const q = question.toLowerCase();
  const { opportunities, metrics, customerOf } = ctx;
  const open = opportunities.filter((o) => o.status !== "RECOVERED" && o.status !== "REJECTED");
  const best = [...open].sort(
    (a, b) =>
      b.recoveryProbability * b.amount - a.recoveryProbability * a.amount,
  )[0];

  const named = opportunities.find((o) => q.includes((customerOf(o).name.split(" ")[0] ?? "").toLowerCase()));

  if (named && (q.includes("why") || q.includes("worth") || q.includes("chose") || q.includes("choose"))) {
    return `${customerOf(named).name} · ${inr(named.amount)} at risk (${opportunityTypeLabel[named.opportunityType]}${named.failureReason ? ` — ${named.failureReason}` : ""}).\n\nRecovery probability is ${named.recoveryProbability}%. ${named.aiReasoning}\n\nRecommended action: ${actionLabel[named.recommendedAction]}. ${named.actionRationale}`;
  }

  if (q.includes("prioriti") || q.includes("first") || q.includes("which")) {
    if (!best) return "Every opportunity is resolved — nothing is currently at risk.";
    return `Prioritise ${customerOf(best).name} — ${inr(best.amount)} at ${best.recoveryProbability}% recovery probability, giving the highest expected recovery of ${inr(Math.round((best.amount * best.recoveryProbability) / 100))}. Recommended action: ${actionLabel[best.recommendedAction]}.`;
  }

  if (q.includes("how much") || q.includes("potential") || q.includes("expected")) {
    const expected = open.reduce(
      (sum, o) => sum + (o.recommendedAction === "NO_ACTION" ? 0 : (o.amount * o.recoveryProbability) / 100),
      0,
    );
    return `${inr(metrics.revenueAtRisk)} is currently at risk across ${open.length} opportunities. Weighting each by its recovery probability and excluding the ones I do not recommend acting on, the expected recoverable amount is approximately ${inr(Math.round(expected))}. ${inr(metrics.recoveredRevenue)} has been recovered so far.`;
  }

  if (q.includes("status") || q.includes("approval") || q.includes("waiting")) {
    const awaiting = opportunities.filter((o) => o.status === "APPROVED" || o.status === "EXECUTING");
    return `I have analysed ${opportunities.length} opportunities and recommended ${opportunities.filter((o) => o.recommendedAction !== "NO_ACTION").length} actions. ${awaiting.length} are moving through execution and ${metrics.recoveredCount} have been verified as recovered.`;
  }

  return `I work only from your live opportunity data. Right now ${inr(metrics.revenueAtRisk)} is at risk across ${open.length} opportunities and ${inr(metrics.recoveredRevenue)} has been recovered.${best ? ` The strongest next move is ${customerOf(best).name} — ${actionLabel[best.recommendedAction]} at ${best.recoveryProbability}% probability.` : ""}\n\nTry asking why a specific customer's payment is worth recovering, or which opportunity to prioritise.`;
}
