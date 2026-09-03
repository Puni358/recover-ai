import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const workflowSteps = [
  "AI recommends",
  "Merchant reviews",
  "Merchant approves",
  "RecoverAI executes",
  "RecoverAI verifies",
  "Audit event recorded",
] as const;

export function WorkflowStrip({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {workflowSteps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                done && "border-success/20 bg-success-soft text-success",
                active && "border-transparent bg-primary text-primary-foreground",
                !done && !active && "border-border bg-muted text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-3" />
              ) : (
                <span className="tabular text-[10px] opacity-70">{i + 1}</span>
              )}
              {step}
            </span>
            {i < workflowSteps.length - 1 && (
              <span className="hidden h-px w-4 bg-border sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function ApprovalBoundaryNote() {
  return (
    <p className="text-xs text-muted-foreground">
      RecoverAI never moves money silently — every money-moving action stops here until you approve
      it.
    </p>
  );
}
