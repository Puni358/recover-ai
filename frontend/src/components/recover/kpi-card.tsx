import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "risk" | "success";
  icon?: React.ReactNode;
}) {
  return (
    <div className="panel group p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-raised)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md border text-muted-foreground transition-colors",
            tone === "risk" && "border-risk/20 bg-risk-soft text-risk",
            tone === "success" && "border-success/20 bg-success-soft text-success",
            tone === "neutral" && "border-border bg-muted",
          )}
        >
          {icon}
        </span>
      </div>
      <div
        className={cn(
          "tabular mt-4 text-3xl font-semibold",
          tone === "risk" && "text-risk",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}
