import {
  createFileRoute,
  Link,
  useParams,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Check,
  Loader2,
  Pencil,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/recover/app-shell";
import { ProbabilityDial } from "@/components/recover/probability";
import {
  OpportunityStatusBadge,
  Pill,
} from "@/components/recover/status-badge";
import {
  ApprovalBoundaryNote,
  WorkflowStrip,
} from "@/components/recover/workflow-strip";
import {
  actionLabel,
  inr,
  opportunityTypeLabel,
} from "@/lib/recover-format";
import { useRecover } from "@/lib/recover-store";

export const Route = createFileRoute(
  "/opportunities/$id",
)({
  head: () => ({
    meta: [
      {
        title: "Opportunity Review — RecoverAI",
      },
      {
        name: "description",
        content:
          "Review the AI analysis, recommended recovery action and approval boundary for a single revenue opportunity.",
      },
      {
        property: "og:title",
        content: "Opportunity Review — RecoverAI",
      },
      {
        property: "og:description",
        content:
          "AI analysis, recommended action and merchant approval for one opportunity.",
      },
    ],
  }),
  component: OpportunityDetail,
});

function OpportunityDetail() {
  const { id } = useParams({
    from: "/opportunities/$id",
  });

  const {
    getOpportunity,
    customerOf,
    approveRecovery,
    rejectRecovery,
    executeRecovery,
    verifyRecovery,
    actions,
    merchant,
    loading,
  } = useRecover();

  const opportunity = getOpportunity(id);

  const [busy, setBusy] = useState<
    null | "executing" | "verifying"
  >(null);

  /*
   * Execution is one-shot. Verification is intentionally NOT one-shot: the
   * Razorpay payment can finish in another browser tab, so EXECUTING state
   * is verified repeatedly until Razorpay confirms the payment.
   */
  const executionStartedRef = useRef(false);
  const verificationInFlightRef = useRef(false);
  const status = opportunity?.status;
  const opportunityId = opportunity?.id;

  const latestPaymentLinkAction =
    opportunity
      ? [...actions]
          .filter(
            (action) =>
              action.opportunityId === opportunity.id &&
              action.action === "CREATE_PAYMENT_LINK",
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          )[0]
      : undefined;

  const paymentLinkUrl =
    latestPaymentLinkAction?.result?.match(
      /https:\/\/rzp\.io\/[^\s]+/,
    )?.[0];

  /*
   * APPROVE -> EXECUTE
   *
   * Execution starts only once after the opportunity actually
   * enters APPROVED state.
   */
  useEffect(() => {
    if (
      status !== "APPROVED" ||
      !opportunityId ||
      executionStartedRef.current
    ) {
      return;
    }

    executionStartedRef.current = true;
    setBusy("executing");

    const timer = setTimeout(async () => {
      try {
        await executeRecovery(opportunityId);
      } finally {
        // Execution has finished once the payment link has been
        // created (or the execution failed). From this point the
        // page must show the payment-link controls instead of
        // remaining stuck on “Executing recovery…”.
        setBusy(null);
      }
    }, 1100);

    return () => clearTimeout(timer);
  }, [status, opportunityId, executeRecovery]);

  /*
   * EXECUTE -> VERIFY
   *
   * Razorpay opens in a separate tab, so the merchant may complete
   * payment while this page is still open. Poll the verified backend
   * state while EXECUTING and also verify immediately when the merchant
   * returns to this tab. This keeps the demo live without manual refreshes.
   */
  useEffect(() => {
    if (
      status !== "EXECUTING" ||
      !opportunityId ||
      !paymentLinkUrl
    ) {
      return;
    }

    let cancelled = false;

    const verifyInBackground = async () => {
      if (cancelled || verificationInFlightRef.current) return;

      verificationInFlightRef.current = true;

      try {
        await verifyRecovery(opportunityId);
      } catch (error) {
        console.error(
          "RecoverAI background verification error:",
          error,
        );
      } finally {
        verificationInFlightRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void verifyInBackground();
      }
    };

    // Check as soon as the payment tab is closed/switched away from.
    void verifyInBackground();

    const interval = window.setInterval(() => {
      void verifyInBackground();
    }, 2500);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [
    status,
    opportunityId,
    paymentLinkUrl,
    verifyRecovery,
  ]);

  /*
   * Reset workflow guards when the opportunity moves back to a
   * state where a NEW approval can legitimately happen.
   *
   * This allows:
   * OPEN/RECOMMENDED -> APPROVED -> EXECUTING -> RECOVERED
   *
   * but prevents:
   * APPROVED -> reload -> APPROVED -> execute again
   */
  useEffect(() => {
    if (
      status === "OPEN" ||
      status === "RECOMMENDED" ||
      status === "AWAITING_APPROVAL" ||
      status === "REJECTED"
    ) {
      executionStartedRef.current = false;
      setBusy(null);
    }
  }, [status]);

  if (!opportunity) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">
          {loading
            ? "Syncing opportunity data…"
            : "Opportunity not found."}
        </p>
      </AppShell>
    );
  }

  const customer = customerOf(
    opportunity.customerId,
  );

  const customerName =
    customer?.name ?? "Customer";

  const customerEmail =
    customer?.email ?? "No email available";

  const stepIndex =
    opportunity.status === "RECOVERED"
      ? 5
      : opportunity.status === "EXECUTING"
        ? 4
        : opportunity.status === "APPROVED"
          ? 3
          : 1;

  const decided =
    opportunity.status === "REJECTED" ||
    opportunity.status === "RECOVERED";

  const inFlight =
    opportunity.status === "APPROVED" ||
    (opportunity.status === "EXECUTING" && busy !== null);

  return (
    <AppShell>
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Opportunities
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {customerName}
          </h1>

          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="tabular text-base font-semibold text-risk">
              {inr(opportunity.amount)}
            </span>

            at risk · {customerEmail}
          </p>
        </div>

        <OpportunityStatusBadge
          status={opportunity.status}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Pill>
          {
            opportunityTypeLabel[
              opportunity.opportunityType
            ]
          }
        </Pill>

        {opportunity.paymentMethod && (
          <Pill>
            {opportunity.paymentMethod}
          </Pill>
        )}

        {opportunity.failureReason && (
          <Pill tone="risk">
            {opportunity.failureReason}
          </Pill>
        )}

        <Pill tone="neutral">
          Execution mode ·{" "}
          {merchant.executionMode}
        </Pill>
      </div>

      <div className="panel mt-5 p-5">
        <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Human-in-the-loop workflow
        </div>

        <div className="mt-3">
          <WorkflowStrip current={stepIndex} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="panel p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-info" />

            <h2 className="text-sm font-semibold tracking-wide uppercase">
              AI Analysis
            </h2>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-6">
            <ProbabilityDial
              value={
                opportunity.recoveryProbability
              }
            />

            <div className="min-w-[220px] flex-1 space-y-3">
              <Fact
                label="Recovery probability"
                value={`${opportunity.recoveryProbability}%`}
              />

              <Fact
                label="Previous successful payments"
                value={String(
                  customer?.successfulPayments ??
                    0,
                )}
              />

              <Fact
                label="Customer lifetime value"
                value={inr(
                  customer?.lifetimeValue ?? 0,
                )}
              />

              <Fact
                label="Expected recovery"
                value={inr(
                  Math.round(
                    (opportunity.amount *
                      opportunity.recoveryProbability) /
                      100,
                  ),
                )}
              />
            </div>
          </div>

          <p className="mt-5 border-l-2 border-info/40 bg-info-soft/60 px-4 py-3 text-sm leading-relaxed">
            {opportunity.aiReasoning}
          </p>
        </section>

        <section className="panel flex flex-col p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />

            <h2 className="text-sm font-semibold tracking-wide uppercase">
              Recommended action
            </h2>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
            <div className="text-base font-semibold">
              {
                actionLabel[
                  opportunity.recommendedAction
                ]
              }
            </div>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {opportunity.actionRationale}
            </p>
          </div>

          {opportunity.status ===
          "RECOVERED" ? (
            <div className="mt-4 rounded-lg border border-success/25 bg-success-soft p-4 text-center">
              <BadgeCheck className="mx-auto size-6 text-success" />

              <div className="tabular mt-2 text-xl font-semibold text-success">
                {inr(opportunity.amount)}{" "}
                recovered
              </div>

              <p className="mt-1 text-sm text-success/80">
                RecoverAI successfully recovered
                this payment.
              </p>
            </div>
          ) : opportunity.status ===
            "REJECTED" ? (
            <div className="mt-4 rounded-lg border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
              Recovery rejected. No
              money-moving action was taken.
            </div>
          ) : inFlight ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border bg-muted p-4 text-sm">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />

              {busy === "verifying"
                ? "Verifying recovery…"
                : "Executing recovery…"}
            </div>
          ) : opportunity.status === "EXECUTING" ? (
            <div className="mt-4 space-y-2">
              {paymentLinkUrl ? (
                <a
                  href={paymentLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  Open Payment Link
                  <ArrowUpRight className="size-4" />
                </a>
              ) : (
                <div className="rounded-md border border-border bg-muted p-3 text-center text-xs text-muted-foreground">
                  Payment link is being prepared…
                </div>
              )}

              <button
                onClick={() => {
                  setBusy("verifying");
                  void verifyRecovery(opportunity.id).finally(() => {
                    setBusy(null);
                  });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ShieldCheck className="size-4" />
                Verify Payment
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Complete the Razorpay test payment first, then verify the recovery.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <button
                onClick={() =>
                  approveRecovery(
                    opportunity.id,
                  )
                }
                disabled={
                  opportunity.recommendedAction ===
                  "NO_ACTION"
                }
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check className="size-4" />
                Approve Recovery
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    rejectRecovery(
                      opportunity.id,
                    )
                  }
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <X className="size-3.5" />
                  Reject
                </button>

                <button
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Pencil className="size-3.5" />
                  Edit Action
                </button>
              </div>

              {opportunity.recommendedAction ===
                "NO_ACTION" && (
                <p className="text-xs text-muted-foreground">
                  RecoverAI does not recommend a
                  money-moving action here.
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            {!decided && (
              <ApprovalBoundaryNote />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="tabular text-sm font-medium">
        {value}
      </span>
    </div>
  );
}
