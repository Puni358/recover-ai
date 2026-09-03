import { createFileRoute } from "@tanstack/react-router";
import { Bot, CornerDownLeft, Sparkles, User } from "lucide-react";
import { useRef, useState } from "react";

import { AppShell } from "@/components/recover/app-shell";
import { AgentStatusBadge, Pill } from "@/components/recover/status-badge";
import {
  actionLabel,
  clockTime,
  inr,
  relativeTime,
} from "@/lib/recover-format";
import { answerAgentQuestion, useRecover } from "@/lib/recover-store";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "AI Agent Console — RecoverAI" },
      {
        name: "description",
        content:
          "Operational console for the RecoverAI agent: live status, analysed opportunities, recommended actions and a grounded chat interface.",
      },
      { property: "og:title", content: "AI Agent Console — RecoverAI" },
      {
        property: "og:description",
        content:
          "Ask the RecoverAI agent why an opportunity is worth recovering.",
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

  const { opportunities, metrics, audit, customerOf } = ctx;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "agent",
      text:
        "I'm monitoring your payments in real time. Ask me anything about the current opportunities — I answer only from your live data.",
    },
  ]);

  const [input, setInput] = useState("");

  const counter = useRef(1);

  const awaiting = opportunities.filter(
    (o) => o.status === "APPROVED" || o.status === "EXECUTING",
  ).length;

  const topOpportunity = opportunities[0];

  const topCustomer = topOpportunity
    ? customerOf(topOpportunity.customerId)
    : undefined;

  const recommended = opportunities.filter(
    (o) => o.recommendedAction !== "NO_ACTION",
  ).length;

  function send(text: string) {
    const q = text.trim();

    if (!q) return;

    const answer = answerAgentQuestion(q, {
      opportunities,
      metrics,
      customerOf,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: counter.current++,
        role: "user",
        text: q,
      },
      {
        id: counter.current++,
        role: "agent",
        text: answer,
      },
    ]);

    setInput("");
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Agent
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Operational console for the autonomous recovery agent.
          </p>
        </div>

        <AgentStatusBadge />
      </div>

      <div className="panel mt-5 grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
        <Stat
          label="Current task"
          value="Monitoring payments"
          mono={false}
        />

        <Stat
          label="Opportunities analyzed"
          value={String(opportunities.length)}
        />

        <Stat
          label="Actions recommended"
          value={String(recommended)}
        />

        <Stat
          label="Awaiting approval"
          value={String(awaiting)}
        />

        <Stat
          label="Recovered revenue"
          value={inr(metrics.recoveredRevenue)}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="panel flex h-[560px] flex-col lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <Sparkles className="size-4 text-info" />

            <span className="text-sm font-medium">
              Agent chat
            </span>

            <Pill className="ml-auto" tone="neutral">
              Grounded in live data
            </Pill>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((m) => (
              <div key={m.id} className="flex gap-3">
                <span
                  className={
                    m.role === "agent"
                      ? "flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
                      : "flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground"
                  }
                >
                  {m.role === "agent" ? (
                    <Bot className="size-3.5" />
                  ) : (
                    <User className="size-3.5" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    {m.role === "agent"
                      ? "RecoverAI Agent"
                      : "You"}
                  </div>

                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
                    {m.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border px-5 py-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 focus-within:border-border-strong"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the agent about an opportunity…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Send
                <CornerDownLeft className="size-3" />
              </button>
            </form>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Recent agent activity
          </h2>

          <ol className="mt-4 space-y-4">
            {audit.slice(0, 7).map((e) => (
              <li key={e.id} className="relative pl-5">
                <span className="absolute top-1.5 left-0 size-2 rounded-full bg-border" />

                <span className="absolute top-4 bottom-[-14px] left-[3.5px] w-px bg-border last:hidden" />

                <div className="text-sm font-medium">
                  {e.event}
                </div>

                <div className="text-xs text-muted-foreground">
                  {e.customerName ?? "System"}
                  {e.action ? ` · ${e.action}` : ""}
                </div>

                <div
                  className="text-xs text-muted-foreground/80"
                  title={clockTime(e.timestamp)}
                >
                  {e.actor} · {relativeTime(e.timestamp)}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Highest-value recommendation:{" "}
            <span className="font-medium text-foreground">
              {topOpportunity
                ? actionLabel[topOpportunity.recommendedAction]
                : "—"}
            </span>{" "}
            for{" "}
            <span className="font-medium text-foreground">
              {topCustomer?.name ?? "customer unavailable"}
            </span>
            .
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>

      <div
        className={
          mono
            ? "tabular mt-1 text-lg font-semibold"
            : "mt-1 text-lg font-semibold"
        }
      >
        {value}
      </div>
    </div>
  );
}
