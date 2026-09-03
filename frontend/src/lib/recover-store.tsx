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

interface AgentContext {
  opportunities: Opportunity[];
  metrics: Metrics;
  customerOf: (customerId: string) => Customer | undefined;
}

interface RecoverContextValue {
  merchant: Merchant;
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

const fallbackMerchant: Merchant = {
  id: "",
  name: "RecoverAI",
  currency: "INR",
  executionMode: "SIMULATION",
};

const RecoverContext = createContext<
  RecoverContextValue | undefined
>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function getAuthenticatedSession() {
  let {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  /*
   * Demo mode:
   * Automatically sign into the demo merchant when no
   * Supabase session exists.
   */
  if (!session) {
    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: "demo@recoverai.dev",
        password: "RecoverAI@2026!",
      });

    if (loginError) {
      throw new Error(
        `Demo login failed: ${loginError.message}`,
      );
    }

    session = data.session;
  }

  if (!session?.access_token) {
    throw new Error(
      "Unable to obtain Supabase access token.",
    );
  }

  return session;
}

async function getDashboard() {
  await getAuthenticatedSession();

  console.log("[RecoverAI] Calling get-dashboard...");

  const { data, error } = await supabase.functions.invoke(
    "get-dashboard",
  );

  console.log("[RecoverAI] get-dashboard result:", {
    data,
    error,
  });

  if (error) {
    console.error("[RecoverAI] Edge Function error:", error);
    throw new Error(
      error.message || "Unable to load RecoverAI dashboard.",
    );
  }

  if (!data) {
    throw new Error("RecoverAI dashboard returned no data.");
  }

  return data;
}

function mapCustomer(item: any): Customer {
  return {
    id: item.id,
    name: item.name ?? "Customer",
    email: item.email ?? "",
    successfulPayments: Number(
      item.successfulPayments ??
        item.successful_payments ??
        0,
    ),
    lifetimeValue: Number(
      item.lifetimeValue ??
        item.lifetime_value ??
        0,
    ),
  };
}

function mapMerchant(item: any): Merchant {
  return {
    id: item.id,
    name: item.name ?? "RecoverAI",
    currency: item.currency ?? "INR",
    executionMode:
      item.execution_mode ?? "SIMULATION",
  };
}

function mapOpportunity(item: any): Opportunity {
  const transaction = item.transaction;
  const analysis = item.ai_analysis;

  const recommendedAction: RecommendedAction =
    item.recommended_action ??
    analysis?.recommended_action ??
    "NO_ACTION";

  const aiReasoning =
    analysis?.reasoning ??
    "RecoverAI is evaluating this opportunity.";

  let actionRationale = "";

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

    case "NO_ACTION":
    default:
      actionRationale =
        "No automated recovery action is recommended at this time.";
      break;
  }

  let status = item.status;

  /*
   * The database can use ANALYZING while the frontend
   * treats the opportunity as OPEN.
   */
  if (status === "ANALYZING") {
    status = "OPEN";
  }

  return {
    id: item.id,
    customerId: item.customer_id,
    amount: Number(item.amount ?? 0),
    opportunityType: item.opportunity_type,
    status,
    paymentMethod:
      transaction?.payment_method ?? undefined,
    failureReason:
      transaction?.failure_reason ??
      item.failure_reason ??
      undefined,
    recoveryProbability: Number(
      analysis?.recovery_probability ??
        item.recovery_probability ??
        0,
    ),
    recommendedAction,
    aiReasoning,
    actionRationale,
    createdAt: item.created_at,
  };
}

/*
 * recovery_actions does not have customer_id.
 * We recover the customer ID from the corresponding
 * opportunity in the frontend.
 */
function mapRecoveryAction(
  item: any,
  opportunityLookup: Map<string, Opportunity>,
): RecoveryAction {
  const opportunity =
    opportunityLookup.get(item.opportunity_id);

  return {
    id: item.id,
    opportunityId: item.opportunity_id,
    customerId:
      opportunity?.customerId ?? "",
    action:
      item.action_type ??
      item.action ??
      "NO_ACTION",
    amount: Number(item.amount ?? 0),
    status:
      item.status ?? "PENDING_APPROVAL",
    executionMode:
  item.execution_mode ?? "SIMULATION",
createdAt:
  item.created_at ?? new Date().toISOString(),
externalReference:
  item.external_reference ?? undefined,
result:
  item.result_message ??
  item.result ??
  undefined,
  };
}

/*
 * audit_logs uses:
 *
 * event_type
 * message
 * metadata
 *
 * instead of the UI-friendly fields used by AuditEvent.
 *
 * We store the UI metadata inside the JSONB metadata
 * column and reconstruct the frontend representation here.
 */
function mapAuditEvent(item: any): AuditEvent {
  const metadata =
    item.metadata &&
    typeof item.metadata === "object"
      ? item.metadata
      : {};

  const actorValue =
    metadata.actor ?? "AI Agent";

  const actor =
    actorValue === "MERCHANT"
      ? "Merchant"
      : actorValue === "RECOVERAI"
        ? "RecoverAI"
        : "AI Agent";

  return {
    id: item.id,
    timestamp:
      item.created_at ??
      item.timestamp ??
      new Date().toISOString(),
    actor,
    event:
      item.event_type ??
      item.event ??
      "Recovery event",
    opportunityId:
      item.opportunity_id ??
      undefined,
    customerName:
      metadata.customer_name ??
      undefined,
    action:
      metadata.action ??
      undefined,
    result:
      item.message ??
      metadata.result ??
      undefined,
  };
}

export function RecoverProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [merchant, setMerchant] =
    useState<Merchant>(fallbackMerchant);

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [opportunities, setOpportunities] =
    useState<Opportunity[]>([]);

  const [actions, setActions] =
    useState<RecoveryAction[]>([]);

  const [audit, setAudit] =
    useState<AuditEvent[]>([]);

  const [metrics, setMetrics] = useState<Metrics>({
    totalRevenue: 0,
    revenueAtRisk: 0,
    recoveredRevenue: 0,
    recoveredCount: 0,
    openCount: 0,
    recoveryRate: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const customerOf = useCallback(
    (customerId: string) => {
      return customers.find(
        (customer) =>
          customer.id === customerId,
      );
    },
    [customers],
  );

  const getOpportunity = useCallback(
    (id: string) => {
      return opportunities.find(
        (opportunity) =>
          opportunity.id === id,
      );
    },
    [opportunities],
  );

  /*
   * Load recovery actions and audit logs.
   */
  const loadActionsAndAudit = useCallback(
    async (
      currentOpportunities: Opportunity[] = [],
    ) => {
      try {
        await getAuthenticatedSession();

        const [
          actionsResult,
          auditResult,
        ] = await Promise.all([
          supabase
            .from("recovery_actions")
            .select("*")
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("audit_logs")
            .select("*")
            .order("created_at", {
              ascending: false,
            }),
        ]);

        console.log(
          "[RecoverAI] recovery_actions result:",
          actionsResult,
        );

        console.log(
          "[RecoverAI] audit_logs result:",
          auditResult,
        );

        const opportunityLookup =
          new Map<string, Opportunity>(
            currentOpportunities.map(
              (opportunity) => [
                opportunity.id,
                opportunity,
              ],
            ),
          );

        if (actionsResult.error) {
          console.error(
            "[RecoverAI] recovery_actions ERROR:",
            actionsResult.error,
          );
        } else {
          setActions(
            (actionsResult.data ?? []).map(
              (item: any) =>
                mapRecoveryAction(
                  item,
                  opportunityLookup,
                ),
            ),
          );
        }

        if (auditResult.error) {
          console.error(
            "[RecoverAI] audit_logs ERROR:",
            auditResult.error,
          );
        } else {
          setAudit(
            (auditResult.data ?? []).map(
              mapAuditEvent,
            ),
          );
        }
      } catch (err) {
        console.error(
          "[RecoverAI] action/audit load ERROR:",
          err,
        );
      }
    },
    [],
  );

  /*
   * Load dashboard data from the deployed
   * Supabase Edge Function.
   */
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getDashboard();

      let mappedMerchant = merchant;

      if (data.merchant) {
        mappedMerchant =
          mapMerchant(data.merchant);

        setMerchant(mappedMerchant);
      }

      const backendOpportunities =
        data.topOpportunities ?? [];

      const mappedOpportunities =
        backendOpportunities.map(
          mapOpportunity,
        );

      setOpportunities(
        mappedOpportunities,
      );

      /*
       * Build customers directly from the
       * customer objects returned by get-dashboard.
       */
      const customerMap =
        new Map<string, Customer>();

      for (const item of backendOpportunities) {
        if (item.customer?.id) {
          customerMap.set(
            item.customer.id,
            mapCustomer(item.customer),
          );
        }
      }

      /*
       * Safety fallback so the UI never crashes
       * if an opportunity has no customer object.
       */
      for (const opportunity of mappedOpportunities) {
        if (
          opportunity.customerId &&
          !customerMap.has(
            opportunity.customerId,
          )
        ) {
          customerMap.set(
            opportunity.customerId,
            {
              id: opportunity.customerId,
              name: "Customer",
              email: "",
              successfulPayments: 0,
              lifetimeValue: 0,
            },
          );
        }
      }

      const mappedCustomers =
        Array.from(
          customerMap.values(),
        );

      setCustomers(mappedCustomers);

      setMetrics({
        totalRevenue: Number(
          data.metrics?.totalRevenue ?? 0,
        ),
        revenueAtRisk: Number(
          data.metrics?.revenueAtRisk ?? 0,
        ),
        recoveredRevenue: Number(
          data.metrics?.recoveredRevenue ?? 0,
        ),
        recoveredCount: Number(
          data.metrics?.recoveredCount ?? 0,
        ),
        openCount: Number(
          data.metrics?.opportunityCount ??
            mappedOpportunities.length,
        ),
        recoveryRate: Number(
          data.metrics?.recoveryRate ?? 0,
        ),
      });

      await loadActionsAndAudit(
        mappedOpportunities,
      );
    } catch (err) {
      console.error(
        "RecoverAI dashboard error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadActionsAndAudit]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /*
   * APPROVE
   *
   * Merchant approval is the human safety boundary.
   * No money-moving action is executed here.
   */
  const approveRecovery = useCallback(
    async (opportunityId: string) => {
      const opportunity =
        opportunities.find(
          (item) =>
            item.id === opportunityId,
        );

      if (!opportunity) return;

      const customer =
        customerOf(
          opportunity.customerId,
        );

      const previousStatus =
        opportunity.status;

      /*
       * Optimistic UI.
       */
      setOpportunities((current) =>
        current.map((item) =>
          item.id === opportunityId
            ? {
                ...item,
                status: "APPROVED",
              }
            : item,
        ),
      );

      setError(null);

      try {
        /*
         * 1. Mark opportunity approved.
         */
        const {
          error: opportunityError,
        } = await supabase
          .from("opportunities")
          .update({
            status: "APPROVED",
          })
          .eq("id", opportunityId);

        if (opportunityError) {
          throw opportunityError;
        }

        /*
         * 2. Create recovery action.
         *
         * IMPORTANT:
         * Database column is action_type,
         * not action.
         *
         * merchant_id is required by the schema.
         */
        const {
          data: actionData,
          error: actionError,
        } = await supabase
          .from("recovery_actions")
          .insert({
            opportunity_id:
              opportunity.id,

            merchant_id:
              merchant.id,

            action_type:
              opportunity.recommendedAction,

            amount:
              opportunity.amount,

            currency:
              merchant.currency,

            status:
              "APPROVED",

            execution_mode:
              merchant.executionMode,

            approved_at:
              new Date().toISOString(),

            result_message:
              "Approved by merchant",
          })
          .select()
          .single();

        if (actionError) {
          throw actionError;
        }

        /*
         * 3. Add action to local state.
         */
        if (actionData) {
          const lookup =
            new Map<string, Opportunity>(
              opportunities.map(
                (item) => [
                  item.id,
                  item,
                ],
              ),
            );

          setActions((current) => [
            mapRecoveryAction(
              actionData,
              lookup,
            ),
            ...current,
          ]);
        }

        /*
         * 4. Write audit event using the ACTUAL
         * audit_logs schema.
         */
        const {
          error: auditError,
        } = await supabase
          .from("audit_logs")
          .insert({
            merchant_id:
              merchant.id,

            opportunity_id:
              opportunity.id,

            event_type:
              "RECOVERY_APPROVED",

            message:
              "Merchant approved recovery action",

            metadata: {
              actor: "MERCHANT",
              customer_name:
                customer?.name ??
                "Customer",
              action:
                opportunity.recommendedAction,
              result:
                "Merchant approved recovery action",
            },
          });

        if (auditError) {
          throw auditError;
        }

        await loadActionsAndAudit(
          opportunities,
        );
      } catch (err) {
        console.error(
          "RecoverAI approval error:",
          err,
        );

        /*
         * Roll back optimistic UI.
         */
        setOpportunities((current) =>
          current.map((item) =>
            item.id === opportunityId
              ? {
                  ...item,
                  status:
                    previousStatus,
                }
              : item,
          ),
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to approve recovery.",
        );
      }
    },
    [
      opportunities,
      merchant,
      customerOf,
      loadActionsAndAudit,
    ],
  );

  /*
   * REJECT
   */
  const rejectRecovery = useCallback(
    async (opportunityId: string) => {
      const opportunity =
        opportunities.find(
          (item) =>
            item.id === opportunityId,
        );

      if (!opportunity) return;

      const customer =
        customerOf(
          opportunity.customerId,
        );

      const previousStatus =
        opportunity.status;

      setOpportunities((current) =>
        current.map((item) =>
          item.id === opportunityId
            ? {
                ...item,
                status: "REJECTED",
              }
            : item,
        ),
      );

      setError(null);

      try {
        const {
          error: opportunityError,
        } = await supabase
          .from("opportunities")
          .update({
            status: "REJECTED",
          })
          .eq("id", opportunityId);

        if (opportunityError) {
          throw opportunityError;
        }

        const {
          error: auditError,
        } = await supabase
          .from("audit_logs")
          .insert({
            merchant_id:
              merchant.id,

            opportunity_id:
              opportunity.id,

            event_type:
              "RECOVERY_REJECTED",

            message:
              "Merchant rejected recovery action",

            metadata: {
              actor: "MERCHANT",
              customer_name:
                customer?.name ??
                "Customer",
              action:
                opportunity.recommendedAction,
              result:
                "Merchant rejected recovery action",
            },
          });

        if (auditError) {
          throw auditError;
        }

        await loadActionsAndAudit(
          opportunities,
        );
      } catch (err) {
        console.error(
          "RecoverAI rejection error:",
          err,
        );

        setOpportunities((current) =>
          current.map((item) =>
            item.id === opportunityId
              ? {
                  ...item,
                  status:
                    previousStatus,
                }
              : item,
          ),
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to reject recovery.",
        );
      }
    },
    [
      opportunities,
      merchant.id,
      customerOf,
      loadActionsAndAudit,
    ],
  );

  /*
   * EXECUTE
   *
   * Currently safe simulation.
   * Razorpay Test Mode will be connected later.
   */
    const executeRecovery = useCallback(
    async (opportunityId: string) => {
      const opportunity = opportunities.find(
        (item) => item.id === opportunityId,
      );

      if (!opportunity) return;

      const customer = customerOf(
        opportunity.customerId,
      );

      setOpportunities((current) =>
        current.map((item) =>
          item.id === opportunityId
            ? {
                ...item,
                status: "EXECUTING",
              }
            : item,
        ),
      );

      setError(null);

      try {
        /*
         * 1. Find the latest recovery action.
         */
        const {
          data: actionData,
          error: actionLoadError,
        } = await supabase
          .from("recovery_actions")
          .select("*")
          .eq("opportunity_id", opportunityId)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (actionLoadError) {
          throw actionLoadError;
        }

        if (!actionData) {
          throw new Error(
            "No approved recovery action exists for this opportunity.",
          );
        }

        /*
         * 2. RAZORPAY TEST MODE
         *
         * Creating a Payment Link is NOT proof of recovery.
         * Leave the opportunity in EXECUTING until the
         * merchant verifies the actual Razorpay payment.
         */
        if (
          actionData.execution_mode === "RAZORPAY_TEST" &&
          actionData.action_type === "CREATE_PAYMENT_LINK"
        ) {
          const {
            data: functionData,
            error: functionError,
          } = await supabase.functions.invoke(
            "create-payment-link",
            {
              body: {
                opportunityId,
                recoveryActionId: actionData.id,
              },
            },
          );

          if (functionError) {
            throw functionError;
          }

          if (!functionData?.success) {
            throw new Error(
              functionData?.error ??
                "Failed to create Razorpay Payment Link.",
            );
          }

          /*
           * Reload the action so external_reference and
           * result_message are available immediately.
           */
          await loadActionsAndAudit(opportunities);

          return;
        }

        /*
         * 3. SIMULATION MODE
         */
        const {
          error: actionError,
        } = await supabase
          .from("recovery_actions")
          .update({
            status: "EXECUTING",
            executed_at: new Date().toISOString(),
            result_message:
              "Recovery action executing in simulation mode",
          })
          .eq("id", actionData.id);

        if (actionError) {
          throw actionError;
        }

        /*
         * 4. Audit simulation execution.
         */
        const { error: auditError } =
          await supabase
            .from("audit_logs")
            .insert({
              merchant_id: merchant.id,
              opportunity_id: opportunity.id,
              recovery_action_id: actionData.id,
              event_type: "RECOVERY_EXECUTING",
              message:
                "Recovery action executing in simulation mode",
              metadata: {
                actor: "RECOVERAI",
                customer_name:
                  customer?.name ?? "Customer",
                action:
                  opportunity.recommendedAction,
                result:
                  "Simulation execution started",
              },
            });

        if (auditError) {
          throw auditError;
        }

        await loadActionsAndAudit(opportunities);
      } catch (err) {
        console.error(
          "RecoverAI execution error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to execute recovery.",
        );

        /*
         * Roll the optimistic state back.
         */
        setOpportunities((current) =>
          current.map((item) =>
            item.id === opportunityId
              ? {
                  ...item,
                  status: "APPROVED",
                }
              : item,
          ),
        );
      }
    },
    [
      opportunities,
      merchant.id,
      customerOf,
      loadActionsAndAudit,
    ],
  );
  /*
   * VERIFY
   *
   * Simulation succeeds and marks the opportunity
   * as recovered.
   *
   * Later this will verify the real Razorpay
   * payment/order state.
   */

  const verifyRecovery = useCallback(
    async (opportunityId: string) => {
      const opportunity = opportunities.find(
        (item) => item.id === opportunityId,
      );

      if (!opportunity) return;

      const customer = customerOf(
        opportunity.customerId,
      );

      setError(null);

      try {
        /*
         * Find the latest recovery action.
         */
        const {
          data: actionData,
          error: actionLoadError,
        } = await supabase
          .from("recovery_actions")
          .select("*")
          .eq("opportunity_id", opportunityId)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (actionLoadError) {
          throw actionLoadError;
        }

        if (!actionData) {
          throw new Error(
            "No recovery action exists for this opportunity.",
          );
        }

        /*
         * RAZORPAY TEST MODE
         *
         * Verification must come from Razorpay.
         * A Payment Link existing is NOT proof of recovery.
         */
        if (
          actionData.execution_mode === "RAZORPAY_TEST" &&
          actionData.action_type === "CREATE_PAYMENT_LINK"
        ) {
          const {
            data: functionData,
            error: functionError,
          } = await supabase.functions.invoke(
            "verify-payment-link",
            {
              body: {
                opportunityId,
                recoveryActionId: actionData.id,
              },
            },
          );

          if (functionError) {
            throw functionError;
          }

          if (!functionData?.success) {
            throw new Error(
              functionData?.error ??
                "Failed to verify Razorpay payment.",
            );
          }

          /*
           * Payment is NOT necessarily complete.
           *
           * The Edge Function returns recovered:false
           * when the Payment Link has not been paid yet.
           */
          if (!functionData.recovered) {
            await loadActionsAndAudit(opportunities);

            setError(
              "Payment has not been completed yet. Complete the Razorpay test payment and verify again.",
            );

            return;
          }

          /*
           * Genuine Razorpay recovery.
           */
          setOpportunities((current) =>
            current.map((item) =>
              item.id === opportunityId
                ? {
                    ...item,
                    status: "RECOVERED",
                  }
                : item,
            ),
          );

          await loadActionsAndAudit(opportunities);

          return;
        }

        /*
         * SIMULATION MODE
         *
         * Simulation is still allowed to complete locally.
         */
        const {
          error: actionError,
        } = await supabase
          .from("recovery_actions")
          .update({
            status: "VERIFIED",
            verified_at: new Date().toISOString(),
            result_message:
              "Recovery verified successfully in simulation mode",
          })
          .eq("id", actionData.id);

        if (actionError) {
          throw actionError;
        }

        const {
          error: opportunityError,
        } = await supabase
          .from("opportunities")
          .update({
            status: "RECOVERED",
          })
          .eq("id", opportunityId);

        if (opportunityError) {
          throw opportunityError;
        }

        /*
         * Audit simulation verification.
         */
        const {
          error: auditError,
        } = await supabase
          .from("audit_logs")
          .insert({
            merchant_id: merchant.id,
            opportunity_id: opportunity.id,
            recovery_action_id: actionData.id,
            event_type: "RECOVERY_VERIFIED",
            message:
              "Recovery verified successfully in simulation mode.",
            metadata: {
              actor: "RECOVERAI",
              customer_name:
                customer?.name ?? "Customer",
              action:
                opportunity.recommendedAction,
              result:
                "Simulation recovery verified",
            },
          });

        if (auditError) {
          throw auditError;
        }

        setOpportunities((current) =>
          current.map((item) =>
            item.id === opportunityId
              ? {
                  ...item,
                  status: "RECOVERED",
                }
              : item,
          ),
        );

        await loadActionsAndAudit(opportunities);
      } catch (err) {
        console.error(
          "RecoverAI verification error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to verify recovery.",
        );
      }
    },
    [
      opportunities,
      merchant.id,
      customerOf,
      loadActionsAndAudit,
    ],
  );

    const resetDemo = useCallback(() => {
    void loadDashboard();
  }, [loadDashboard]);

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

      answerAgentQuestion: (
        question: string,
      ) =>
        answerAgentQuestion(question, {
          opportunities,
          metrics,
          customerOf,
        }),
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
    ],
  );

  return (
    <RecoverContext.Provider
      value={value}
    >
      {children}
    </RecoverContext.Provider>
  );
}

export function useRecover() {
  const context =
    useContext(RecoverContext);

  if (!context) {
    throw new Error(
      "useRecover must be used inside RecoverProvider",
    );
  }

  return context;
}

/*
 * Local grounded AI helper.
 *
 * This remains deterministic for now.
 * Gemini will replace this in the next AI stage.
 */
export function answerAgentQuestion(
  question: string,
  context?: AgentContext,
): string {
  const q = question.toLowerCase();

  if (!context) {
    return "RecoverAI can analyze revenue at risk, prioritize recovery opportunities, and explain recommended recovery actions.";
  }

  const {
    opportunities,
    metrics,
    customerOf,
  } = context;

  if (
    q.includes("risk") ||
    q.includes("at risk")
  ) {
    return `There is ₹${metrics.revenueAtRisk.toLocaleString(
      "en-IN",
    )} in revenue currently at risk across ${
      opportunities.length
    } recovery opportunities.`;
  }

  if (
    q.includes("best") ||
    q.includes("highest") ||
    q.includes("priority")
  ) {
    const best = [
      ...opportunities,
    ].sort(
      (a, b) =>
        b.recoveryProbability -
        a.recoveryProbability,
    )[0];

    if (best) {
      const customer =
        customerOf(
          best.customerId,
        );

      return `${
        customer?.name ??
        "This customer"
      } has the strongest recovery opportunity at ${
        best.recoveryProbability
      }% probability, involving ₹${best.amount.toLocaleString(
        "en-IN",
      )}.`;
    }
  }

  if (
    q.includes("how many") ||
    q.includes("opportunities")
  ) {
    return `There are ${opportunities.length} active recovery opportunities.`;
  }

  if (
    q.includes("revenue") &&
    q.includes("total")
  ) {
    return `Total successful revenue is ₹${metrics.totalRevenue.toLocaleString(
      "en-IN",
    )}.`;
  }

  if (
    q.includes("recover") ||
    q.includes("recovery")
  ) {
    return "RecoverAI detects the opportunity, analyzes the customer and failure context, recommends the safest recovery action, and executes it after merchant approval.";
  }

  return "I can analyze revenue at risk, prioritize recovery opportunities, explain AI recommendations, and identify the safest recovery action.";
}
