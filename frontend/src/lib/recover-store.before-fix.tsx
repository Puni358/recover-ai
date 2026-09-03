import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "./supabase";
import type {
  AuditEvent,
  Customer,
  Merchant,
  Opportunity,
  RecoveryAction,
  RecommendedAction,
} from "./recover-types";

interface Metrics {
  totalRevenue: number;
  revenueAtRisk: number;
  recoveredRevenue: number;
  recoveredCount: number;
  openCount: number;
  recoveryRate: number;
}

interface RecoverContextValue {
  merchant: Merchant | null;
  customers: Customer[];
  opportunities: Opportunity[];
  actions: RecoveryAction[];
  audit: AuditEvent[];
  metrics: Metrics;
  loading: boolean;
  error: string | null;

  customerOf: (customerId: string) => Customer | undefined;
  getOpportunity: (id: string) => Opportunity | undefined;

  approveRecovery: (opportunityId: string) => void;
  rejectRecovery: (opportunityId: string) => void;
  executeRecovery: (opportunityId: string) => void;
  verifyRecovery: (opportunityId: string) => void;

  resetDemo: () => void;
  answerAgentQuestion: (question: string) => string;
}

const RecoverContext = createContext<RecoverContextValue | undefined>(
  undefined
);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function getDashboard() {
  let {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  // Automatically sign in to the RecoverAI demo merchant
  // when there is no existing Supabase session.
  if (!session) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "demo@recoverai.dev",
      password: "RecoverAI@2026!",
    });

    if (error) {
      throw new Error(`Demo login failed: ${error.message}`);
    }

    session = data.session;
  }

  if (!session?.access_token) {
    throw new Error("Unable to obtain Supabase access token.");
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/get-dashboard`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error || `Dashboard request failed (${response.status})`
    );
  }

  return data;
}

function mapOpportunity(item: any): Opportunity {
  const transaction = item.transaction;
  const analysis = item.ai_analysis;

  const recommendedAction =
    item.recommended_action ?? "NO_ACTION";

  let aiReasoning =
    analysis?.reasoning ??
    "RecoverAI is evaluating this opportunity.";

  let actionRationale =
    analysis?.action_rationale ??
    "";

  if (!actionRationale) {
    switch (recommendedAction) {
      case "RETRY_PAYMENT":
        actionRationale =
          "Retry the payment to give the customer another chance to complete the transaction.";
        break;

      case "SEND_RECOVERY_MESSAGE":
        actionRationale =
          "Send a recovery message to bring the customer back to the checkout.";
        break;

      case "CREATE_PAYMENT_LINK":
        actionRationale =
          "Create a fresh payment link so the customer can complete the payment.";
        break;

      default:
        actionRationale =
          "No automated recovery action is recommended at this time.";
    }
  }

  let status = item.status;

  if (status === "ANALYZING") {
    status = "OPEN";
  }

  return {
    id: item.id,
    customerId: item.customer_id,
    amount: Number(item.amount ?? 0),
    opportunityType: item.opportunity_type,
    status,
    paymentMethod: transaction?.payment_method,
    failureReason:
      transaction?.failure_reason ?? item.failure_reason,
    recoveryProbability: Number(
      analysis?.recovery_probability ??
        item.recovery_probability ??
        0
    ),
    recommendedAction,
    aiReasoning,
    actionRationale,
    createdAt: item.created_at,
  };
}

function mapCustomer(item: any): Customer {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    successfulPayments: Number(item.successfulPayments ?? 0),
    lifetimeValue: Number(item.lifetimeValue ?? 0),
  };
}

function mapMerchant(item: any): Merchant {
  return {
    id: item.id,
    name: item.name,
    currency: item.currency ?? "INR",
    executionMode: item.execution_mode ?? "SIMULATION",
  };
}

export function RecoverProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant>({
  id: "",
  name: "RecoverAI",
  currency: "INR",
  executionMode: "SIMULATION",
});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);

  const [metrics, setMetrics] = useState<Metrics>({
    totalRevenue: 0,
    revenueAtRisk: 0,
    recoveredRevenue: 0,
    recoveredCount: 0,
    openCount: 0,
    recoveryRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getDashboard();

      if (data.merchant) {
  setMerchant(mapMerchant(data.merchant));
}

      const mappedOpportunities: Opportunity[] = (
        data.topOpportunities ?? []
      ).map(mapOpportunity);

      setOpportunities(mappedOpportunities);

      const customerMap = new Map<string, Customer>();

      for (const item of data.topOpportunities ?? []) {
        if (item.customer) {
          customerMap.set(
            item.customer.id,
            mapCustomer(item.customer)
          );
        }
      }

      setCustomers(Array.from(customerMap.values()));

      setMetrics({
        totalRevenue: Number(data.metrics?.totalRevenue ?? 0),
        revenueAtRisk: Number(data.metrics?.revenueAtRisk ?? 0),
        recoveredRevenue: Number(
          data.metrics?.recoveredRevenue ?? 0
        ),
        recoveredCount: Number(
          data.metrics?.recoveredCount ?? 0
        ),
        openCount: Number(
          data.metrics?.opportunityCount ?? 0
        ),
        recoveryRate: Number(
          data.metrics?.recoveryRate ?? 0
        ),
      });
    } catch (err) {
      console.error("RecoverAI dashboard error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const customerOf = useCallback(
    (customerId: string) =>
      customers.find((customer) => customer.id === customerId),
    [customers]
  );

  const getOpportunity = useCallback(
    (id: string) =>
      opportunities.find((opportunity) => opportunity.id === id),
    [opportunities]
  );

  const approveRecovery = useCallback(
    (opportunityId: string) => {
      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.id === opportunityId
            ? {
                ...opportunity,
                status: "APPROVED",
              }
            : opportunity
        )
      );
    },
    []
  );

  const rejectRecovery = useCallback(
    (opportunityId: string) => {
      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.id === opportunityId
            ? {
                ...opportunity,
                status: "REJECTED",
              }
            : opportunity
        )
      );
    },
    []
  );

  const executeRecovery = useCallback(
    (opportunityId: string) => {
      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.id === opportunityId
            ? {
                ...opportunity,
                status: "EXECUTING",
              }
            : opportunity
        )
      );
    },
    []
  );

  const verifyRecovery = useCallback(
    (opportunityId: string) => {
      setOpportunities((current) =>
        current.map((opportunity) =>
          opportunity.id === opportunityId
            ? {
                ...opportunity,
                status: "RECOVERED",
              }
            : opportunity
        )
      );
    },
    []
  );

  const resetDemo = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  const answerAgentQuestion = useCallback(
    (question: string) => {
      const q = question.toLowerCase();

      if (
        q.includes("risk") ||
        q.includes("at risk") ||
        q.includes("revenue")
      ) {
        return `There is ₹${metrics.revenueAtRisk.toLocaleString(
          "en-IN"
        )} in revenue currently at risk across ${
          opportunities.length
        } recovery opportunities.`;
      }

      if (
        q.includes("best") ||
        q.includes("highest") ||
        q.includes("priority")
      ) {
        const best = [...opportunities].sort(
          (a, b) =>
            b.recoveryProbability - a.recoveryProbability
        )[0];

        if (best) {
          const customer = customerOf(best.customerId);

          return `${customer?.name ?? "This customer"} has the strongest recovery opportunity at ${best.recoveryProbability}% probability, involving ₹${best.amount.toLocaleString(
            "en-IN"
          )}.`;
        }
      }

      if (
        q.includes("how many") ||
        q.includes("opportunities")
      ) {
        return `There are ${opportunities.length} active recovery opportunities.`;
      }

      return "I can analyze revenue at risk, prioritize recovery opportunities, and explain recommended recovery actions.";
    },
    [metrics, opportunities, customerOf]
  );

  const value = useMemo<RecoverContextValue>(
    () => ({
      merchant,
      customers,
      opportunities,
      actions,
      audit,
      metrics,
      loading,
      error,
      customerOf,
      getOpportunity,
      approveRecovery,
      rejectRecovery,
      executeRecovery,
      verifyRecovery,
      resetDemo,
      answerAgentQuestion,
    }),
    [
      merchant,
      customers,
      opportunities,
      actions,
      audit,
      metrics,
      loading,
      error,
      customerOf,
      getOpportunity,
      approveRecovery,
      rejectRecovery,
      executeRecovery,
      verifyRecovery,
      resetDemo,
      answerAgentQuestion,
    ]
  );

  return (
    <RecoverContext.Provider value={value}>
      {children}
    </RecoverContext.Provider>
  );
}

export function useRecover() {
  const context = useContext(RecoverContext);

  if (!context) {
    throw new Error(
      "useRecover must be used inside RecoverProvider"
    );
  }

  return context;
}

export function answerAgentQuestion(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("risk") || q.includes("at risk")) {
    return "I can analyze the revenue currently at risk and identify the highest-priority recovery opportunities.";
  }

  if (q.includes("best") || q.includes("priority") || q.includes("highest")) {
    return "The highest-priority opportunities are those with a high recovery probability and meaningful transaction value.";
  }

  if (q.includes("how") && q.includes("recover")) {
    return "RecoverAI detects the opportunity, analyzes the customer and failure context, recommends the safest recovery action, and executes it after merchant approval.";
  }

  return "I can help analyze revenue at risk, prioritize recovery opportunities, explain AI recommendations, and identify the safest recovery action.";
}
