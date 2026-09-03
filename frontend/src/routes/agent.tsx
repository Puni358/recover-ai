import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  CheckCircle2,
  Clock3,
  CornerDownLeft,
  Loader2,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/recover/app-shell";
import { AgentStatusBadge, Pill } from "@/components/recover/status-badge";
import {
  actionLabel,
  inr,
} from "@/lib/recover-format";
import { supabase } from "@/lib/supabase";
import { useRecover } from "@/lib/recover-store";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "AI Agent Console — RecoverAI" },
      {
        name: "description",
        content:
          "Operational console for the RecoverAI autonomous revenue recovery agent.",
      },
      {
        property: "og:title",
        content: "AI Agent Console — RecoverAI",
      },
      {
        property: "og:description",
        content:
          "Ask RecoverAI why an opportunity matters and what action it recommends.",
      },
    ],
  }),
  component: AgentPage,
});

const suggestions = [
  "Why is Rahul's payment worth recovering?",
  "Which opportunity should I prioritize?",
  "How much revenue can we potentially recover?",
  "Why did you choose a payment link?",
];

interface Message {
  id: number;
  role: "user" | "agent";
  text: string;
}

function AgentPage() {
  const ctx = useRecover();

  const {
    opportunities,
    metrics,
    audit,
    customerOf,
  } = ctx;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "agent",
      text:
        "I'm monitoring your payments in real time. Ask me anything about the current opportunities — I answer from your live merchant data.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counter = useRef(1);

  const awaiting = opportunities.filter(
    (o) =>
      o.status === "APPROVED" ||
      o.status === "EXECUTING",
  ).length;

  const recommended = opportunities.filter(
    (o) =>
      o.recommendedAction !== "NO_ACTION" &&
      o.status !== "RECOVERED" &&
      o.status !== "REJECTED",
  ).length;

  const topOpportunity = useMemo(() => {
    return [...opportunities]
      .filter(
        (o) =>
          o.status !== "RECOVERED" &&
          o.status !== "REJECTED",
      )
      .sort(
        (a, b) =>
          b.recoveryProbability -
          a.recoveryProbability,
      )[0];
  }, [opportunities]);

  const topCustomer = topOpportunity
    ? customerOf(topOpportunity.customerId)
    : undefined;

  /*
   * Clean the activity feed for presentation.
   *
   * Supabase already returns audit logs newest-first.
   * We:
   * 1. Ignore malformed timestamps.
   * 2. Keep recovery-related events.
   * 3. Collapse repeated events for the same opportunity.
   * 4. Show the latest meaningful event for each stage.
   */
  const recentActivity = useMemo(() => {
    const seen = new Set<string>();

    return audit
      .filter((event) => {
        const timestamp = event.timestamp;

        if (!timestamp) return false;

        const parsed = new Date(timestamp);

        if (Number.isNaN(parsed.getTime())) {
          return false;
        }

        return [
          "RECOVERY_APPROVED",
          "RECOVERY_EXECUTING",
          "RECOVERY_VERIFIED",
          "RECOVERY_REJECTED",
        ].includes(event.event);
      })
      .filter((event) => {
        /*
         * Collapse repeated testing noise.
         *
         * Example:
         * Rahul + RECOVERY_VERIFIED
         * Rahul + RECOVERY_VERIFIED
         *
         * Only the latest one is shown.
         */
        const key = `${event.opportunityId ?? event.customerName ?? "merchant"}:${event.event}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 5);
  }, [audit]);

  async function send(text: string) {
    const q = text.trim();

    if (!q || isThinking) return;

    setInput("");
    setError(null);
    setIsThinking(true);

    const userMessage: Message = {
      id: counter.current++,
      role: "user",
      text: q,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke(
          "ai-agent",
          {
            body: {
              question: q,
            },
          },
        );

      if (functionError) {
        throw functionError;
      }

      const answer =
        data?.answer ??
        data?.response ??
        data?.message;

      if (!answer) {
        throw new Error(
          "The AI agent returned an empty response.",
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: counter.current++,
          role: "agent",
          text: answer,
        },
      ]);
    } catch (err) {
      console.error(
        "RecoverAI agent error:",
        err,
      );

      const message =
        err instanceof Error
          ? err.message
          : "Unable to reach the AI agent.";

      setError(message);

      setMessages((prev) => [
        ...prev,
        {
          id: counter.current++,
          role: "agent",
          text:
            "I couldn't complete that analysis right now. Please try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>

              <span className="text-sm font-medium text-muted-foreground">
                Autonomous recovery intelligence
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              AI Agent
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Ask RecoverAI about your at-risk revenue,
              customer behavior, recovery decisions, and
              recommended actions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Pill tone="success">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
              Gemini 3.6 Flash
            </Pill>

            <Pill tone="default">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Grounded in live data
            </Pill>
          </div>
        </section>

        {/* Agent status */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Zap className="h-4 w-4" />}
            label="Current task"
            value="Monitoring payments"
            description="Continuous opportunity analysis"
          />

          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Opportunities analyzed"
            value={String(opportunities.length)}
            description="From your merchant data"
          />

          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Awaiting approval"
            value={String(awaiting)}
            description="Merchant-controlled actions"
          />

          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Recovered revenue"
            value={inr(metrics.recoveredRevenue)}
            description="Verified recoveries"
          />
        </section>

        {/* Main content */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Chat */}
          <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <div className="font-medium">
                    RecoverAI Agent
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                    Online · analyzing live merchant data
                  </div>
                </div>
              </div>

              <AgentStatusBadge status="ANALYZING" />
            </div>

            {/* Messages */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="space-y-5">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "agent" && (
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] ${
                        message.role === "user"
                          ? "order-first"
                          : ""
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.role === "user"
                            ? "rounded-tr-md bg-primary text-primary-foreground"
                            : "rounded-tl-md border bg-muted/40"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.text}
                        </div>
                      </div>

                      <div
                        className={`mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground ${
                          message.role === "user"
                            ? "justify-end"
                            : ""
                        }`}
                      >
                        {message.role === "agent"
                          ? "RecoverAI"
                          : "You"}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isThinking && (
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>

                    <div className="rounded-2xl rounded-tl-md border bg-muted/40 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing live merchant data…
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions */}
            <div className="border-t px-5 py-3">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Suggested questions
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isThinking}
                    onClick={() => send(suggestion)}
                    className="shrink-0 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t p-4">
              {error && (
                <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(input);
                }}
                className="relative"
              >
                <input
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  disabled={isThinking}
                  placeholder="Ask about an opportunity, customer, or recovery decision…"
                  className="h-12 w-full rounded-xl border bg-background pl-4 pr-12 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  aria-label="Send message"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isThinking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CornerDownLeft className="h-4 w-4" />
                  )}
                </button>
              </form>

              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Responses are grounded in your merchant
                  data.
                </span>

                <span>
                  {metrics.openCount} active opportunities ·{" "}
                  {inr(metrics.revenueAtRisk)} at risk
                </span>
              </div>
            </div>
          </section>

          {/* Right rail */}
          <aside className="space-y-4">
            {/* Agent decision */}
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    Highest-priority signal
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    Based on recovery probability
                  </div>
                </div>

                <Sparkles className="h-4 w-4 text-primary" />
              </div>

              {topOpportunity ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-muted/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {topCustomer?.name ??
                            "Customer"}
                        </div>

                        <div className="mt-1 text-xs capitalize text-muted-foreground">
                          {(
                            topOpportunity.opportunityType ??
                            topOpportunity.kind ??
                            "Recovery opportunity"
                          ).replace(/_/g, " ").toLowerCase()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">
                          {inr(
                            topOpportunity.amount,
                          )}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {topOpportunity.recoveryProbability}
                          % probability
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                      Recommended action
                    </div>

                    <div className="rounded-xl border px-3 py-3 text-sm">
                      {actionLabel[
                        topOpportunity
                          .recommendedAction
                      ] ??
                        topOpportunity.recommendedAction}
                    </div>
                  </div>

                  {topOpportunity.aiReasoning && (
                    <div>
                      <div className="mb-2 text-xs font-medium text-muted-foreground">
                        AI reasoning
                      </div>

                      <p className="text-sm leading-6 text-muted-foreground">
                        {topOpportunity.aiReasoning}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  No open recovery opportunities.
                </div>
              )}
            </section>

            {/* Agent activity */}
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    Recent agent activity
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    Latest recovery decisions
                  </div>
                </div>

                <Pill tone="default">
                  {recommended} recommended
                </Pill>
              </div>

              <div className="space-y-4">
                {recentActivity.map((event) => (
                  <ActivityItem
                    key={`${event.id}-${event.event}`}
                    event={event}
                  />
                ))}

                {recentActivity.length === 0 && (
                  <div className="py-5 text-center text-sm text-muted-foreground">
                    No recent agent activity.
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function ActivityItem({
  event,
}: {
  event: {
    id: string;
    event: string;
    customerName?: string;
    timestamp: string;
  };
}) {
  const date = new Date(event.timestamp);

  const relative = formatRelativeTime(date);
  const clock = formatClockTime(date);

  const eventLabel =
    event.event === "RECOVERY_APPROVED"
      ? "Recovery approved"
      : event.event === "RECOVERY_EXECUTING"
        ? "Recovery executing"
        : event.event === "RECOVERY_VERIFIED"
          ? "Recovery verified"
          : event.event === "RECOVERY_REJECTED"
            ? "Recovery rejected"
            : event.event;

  const isVerified =
    event.event === "RECOVERY_VERIFIED";

  const isExecuting =
    event.event === "RECOVERY_EXECUTING";

  return (
    <div className="flex gap-3">
      <div
        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isVerified
            ? "bg-success/10 text-success"
            : isExecuting
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {isVerified ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : isExecuting ? (
          <Zap className="h-3.5 w-3.5" />
        ) : (
          <Clock3 className="h-3.5 w-3.5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">
          {eventLabel}
        </div>

        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {event.customerName ??
            "Merchant activity"}
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground">
          {relative} · {clock}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();

  if (Number.isNaN(diff)) {
    return "Recently";
  }

  const seconds = Math.max(
    0,
    Math.floor(diff / 1000),
  );

  if (seconds < 10) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "Yesterday";
  }

  return `${days}d ago`;
}

function formatClockTime(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">
          {icon}
        </span>
        {label}
      </div>

      <div className="mt-2 text-lg font-semibold">
        {value}
      </div>

      <div className="mt-1 text-[11px] text-muted-foreground">
        {description}
      </div>
    </div>
  );
}
