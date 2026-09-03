import { cn } from "@/lib/utils";

function tone(p: number) {
  if (p >= 75) return "bg-success";
  if (p >= 55) return "bg-info";
  return "bg-warning";
}

export function ProbabilityBar({
  value,
  className,
  showLabel = true,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", tone(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && <span className="tabular text-xs text-foreground">{value}%</span>}
    </div>
  );
}

export function ProbabilityDial({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 42;
  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={cn(
            "transition-[stroke-dashoffset] duration-1000",
            value >= 75 ? "stroke-success" : value >= 55 ? "stroke-info" : "stroke-warning",
          )}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * value) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-semibold">{value}%</span>
        <span className="text-[10px] tracking-wide text-muted-foreground uppercase">recovery</span>
      </div>
    </div>
  );
}
