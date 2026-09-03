import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bot,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Target,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

import { AgentStatusBadge } from "./status-badge";
import { useRecover } from "@/lib/recover-store";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/opportunities", label: "Opportunities", icon: Target },
  { to: "/agent", label: "AI Agent", icon: Bot },
  { to: "/actions", label: "Recovery Actions", icon: Zap },
  { to: "/audit", label: "Audit Trail", icon: ScrollText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { merchant, metrics, signOut } = useRecover();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="size-3.5" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">RecoverAI</span>
          </Link>
          <span className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden text-sm text-muted-foreground sm:block">{merchant.name}</span>

          <div className="ml-auto flex items-center gap-3">
            <AgentStatusBadge />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  NR
                </span>
                <span className="hidden sm:inline">Ops</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-surface p-1.5 shadow-lg">
                  <div className="px-2.5 py-2">
                    <p className="text-xs font-medium text-foreground">
                      Merchant workspace
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {merchant.name}
                    </p>
                  </div>

                  <div className="my-1 border-t border-border" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <LogOut className="size-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-border bg-sidebar px-3 py-5 lg:block">
          <NavList />
          <div className="mt-6 rounded-lg border border-border bg-muted/50 p-3">
            <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Revenue at risk
            </div>
            <div className="tabular mt-1 text-lg font-semibold text-risk">
              ₹{metrics.revenueAtRisk.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.openCount} open opportunities
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-border bg-surface px-4 py-2 lg:hidden">
            <div className="flex gap-1 overflow-x-auto">
              <NavList compact />
            </div>
          </div>
          <main className="mx-auto w-full max-w-[1200px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function NavList({ compact = false }: { compact?: boolean }) {
  return (
    <nav className={compact ? "flex gap-1" : "space-y-0.5"}>
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          activeProps={{
            className: "bg-primary text-primary-foreground hover:bg-primary",
          }}
          inactiveProps={{ className: "text-muted-foreground hover:bg-accent hover:text-foreground" }}
          className={
            compact
              ? "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
              : "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          }
        >
          <Icon className={compact ? "size-3.5" : "size-4"} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
