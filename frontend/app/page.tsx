"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Opportunity = {
  id: string;
  amount: number;
  opportunity_type: string;
  status: string;
  failure_reason: string | null;
  recovery_probability: number;
  recommended_action: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  } | null;
  transaction: {
    amount: number;
    status: string;
    payment_method: string;
    failure_reason: string | null;
  } | null;
  ai_analysis: {
    reasoning: string;
    recovery_probability: number;
    recommended_action: string;
  } | null;
};

type DashboardData = {
  merchant: {
    name: string;
    email: string;
    currency: string;
  };
  metrics: {
    totalRevenue: number;
    revenueAtRisk: number;
    recoveredRevenue: number;
    opportunityCount: number;
    recoveredCount: number;
    recoveryRate: number;
  };
  topOpportunities: Opportunity[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getOpportunityLabel(type: string) {
  switch (type) {
    case "FAILED_PAYMENT":
      return "Failed Payment";
    case "ABANDONED_CHECKOUT":
      return "Abandoned Checkout";
    case "FAILED_SUBSCRIPTION":
      return "Failed Subscription";
    default:
      return type;
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case "CREATE_PAYMENT_LINK":
      return "Create Payment Link";
    case "RETRY_PAYMENT":
      return "Retry Payment";
    case "SEND_RECOVERY_MESSAGE":
      return "Send Recovery Message";
    case "NO_ACTION":
      return "No Action";
    default:
      return action;
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case "CREATE_PAYMENT_LINK":
      return "↗";
    case "RETRY_PAYMENT":
      return "↻";
    case "SEND_RECOVERY_MESSAGE":
      return "✉";
    default:
      return "—";
  }
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError(
            sessionError?.message ?? "No active Supabase session"
          );
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey:
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
              "Content-Type": "application/json",
            },
          }
        );

        const responseText = await response.text();

        if (!response.ok) {
          setError(
            `Dashboard API returned ${response.status}: ${responseText}`
          );
          return;
        }

        const dashboardData = JSON.parse(responseText);
        setData(dashboardData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-sm text-gray-500">
            Loading RecoverAI...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-3xl">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900">
            Unable to load dashboard
          </h1>
          <p className="mt-2 whitespace-pre-wrap text-sm text-red-600">
            {error ?? "No dashboard data received"}
          </p>
        </div>
      </main>
    );
  }

  const { merchant, metrics, topOpportunities } = data;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg font-bold text-white">
              R
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                RecoverAI
              </h1>
              <p className="text-xs text-gray-500">
                Autonomous revenue recovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {merchant.name}
              </p>
              <p className="text-xs text-gray-500">
                {merchant.email}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">
              DM
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page heading */}
        <div className="mb-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-500">
                Revenue Intelligence
              </p>

              <h2 className="text-3xl font-bold tracking-tight">
                Good evening 👋
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                RecoverAI found{" "}
                <span className="font-semibold text-gray-900">
                  {metrics.opportunityCount} opportunities
                </span>{" "}
                worth{" "}
                <span className="font-semibold text-gray-900">
                  {formatCurrency(metrics.revenueAtRisk)}
                </span>
                .
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              AI Agent Active
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Total Revenue
              </p>
              <span className="text-lg">₹</span>
            </div>

            <p className="mt-4 text-2xl font-bold">
              {formatCurrency(metrics.totalRevenue)}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Successfully processed
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-orange-700">
                Revenue at Risk
              </p>
              <span className="text-lg">⚠</span>
            </div>

            <p className="mt-4 text-2xl font-bold text-orange-900">
              {formatCurrency(metrics.revenueAtRisk)}
            </p>

            <p className="mt-2 text-xs text-orange-700">
              Across {metrics.opportunityCount} opportunities
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-emerald-700">
                Recovered Revenue
              </p>
              <span className="text-lg">↗</span>
            </div>

            <p className="mt-4 text-2xl font-bold text-emerald-900">
              {formatCurrency(metrics.recoveredRevenue)}
            </p>

            <p className="mt-2 text-xs text-emerald-700">
              {metrics.recoveredCount} recovered
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Recovery Rate
              </p>
              <span className="text-lg">%</span>
            </div>

            <p className="mt-4 text-2xl font-bold">
              {metrics.recoveryRate}%
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Current recovery performance
            </p>
          </div>
        </section>

        {/* AI Banner */}
        <section className="mt-6 rounded-2xl border border-gray-200 bg-black p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                ✦
              </div>

              <div>
                <p className="text-sm font-semibold">
                  RecoverAI Agent
                </p>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-300">
                  Your AI agent continuously identifies failed
                  payments, abandoned checkouts and subscription
                  failures, then recommends the safest recovery
                  action.
                </p>
              </div>
            </div>

            <button className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-100">
              Open AI Agent →
            </button>
          </div>
        </section>

        {/* Opportunities */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">
                Revenue Opportunities
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                AI-ranked opportunities that could recover lost
                revenue.
              </p>
            </div>

            <button className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-white sm:block">
              View all →
            </button>
          </div>

          <div className="space-y-3">
            {topOpportunities.map((opportunity) => {
              const probability =
                opportunity.recovery_probability ?? 0;

              return (
                <div
                  key={opportunity.id}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    {/* Customer */}
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold">
                        {opportunity.customer?.name
                          ?.split(" ")
                          .map((name) => name[0])
                          .join("")
                          .slice(0, 2) ?? "?"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {opportunity.customer?.name ??
                              "Unknown customer"}
                          </p>

                          <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            {getOpportunityLabel(
                              opportunity.opportunity_type
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {opportunity.customer?.email}
                        </p>

                        {opportunity.failure_reason && (
                          <p className="mt-1 text-xs text-red-500">
                            {opportunity.failure_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="lg:min-w-[130px]">
                      <p className="text-xs text-gray-400">
                        Amount at risk
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {formatCurrency(opportunity.amount)}
                      </p>
                    </div>

                    {/* Probability */}
                    <div className="lg:min-w-[170px]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Recovery probability
                        </span>

                        <span className="font-bold">
                          {probability}%
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-black transition-all"
                          style={{
                            width: `${probability}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between gap-3 lg:min-w-[220px] lg:justify-end">
                      <div className="hidden text-right sm:block">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          AI recommendation
                        </p>

                        <p className="mt-1 text-xs font-semibold">
                          {getActionLabel(
                            opportunity.recommended_action
                          )}
                        </p>
                      </div>

                      <button className="flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800">
                        <span>
                          {getActionIcon(
                            opportunity.recommended_action
                          )}
                        </span>
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom insight */}
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold">
              Highest-value opportunity
            </p>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    Math.max(
                      ...topOpportunities.map(
                        (item) => item.amount
                      )
                    )
                  )}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Potential revenue recovery
                </p>
              </div>

              <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                Needs attention
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold">
              Agent decision logic
            </p>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              RecoverAI prioritizes opportunities using payment
              history, failure reason, transaction value and
              estimated recovery probability — while keeping the
              merchant in control before money-moving actions.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-center text-xs text-gray-400">
          RecoverAI · AI-powered revenue recovery · Demo Mode
        </footer>
      </div>
    </main>
  );
}
