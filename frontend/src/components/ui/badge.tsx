import { type HTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneStyles: Record<BadgeTone, string> = {
  neutral:
    "border-[var(--boardly-border)] bg-[var(--boardly-elevated)] text-[var(--boardly-muted)]",
  brand:
    "border-[#d9d0f5] bg-[var(--boardly-accent-soft)] text-[var(--boardly-accent-hover)]",
  success:
    "border-[#abefc6] bg-[var(--boardly-success-soft)] text-[var(--boardly-success)]",
  warning:
    "border-[#fedf89] bg-[var(--boardly-warning-soft)] text-[var(--boardly-warning)]",
  danger:
    "border-[#fecdca] bg-[var(--boardly-danger-soft)] text-[var(--boardly-danger)]",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-4",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
