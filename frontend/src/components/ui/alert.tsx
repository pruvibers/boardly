import { type HTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

type AlertTone = "info" | "success" | "warning" | "danger";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone;
  title?: string;
};

const toneStyles: Record<AlertTone, string> = {
  info: "border-[#d9d0f5] bg-[var(--boardly-accent-soft)] text-[#42307d]",
  success:
    "border-[#abefc6] bg-[var(--boardly-success-soft)] text-[#05603a]",
  warning:
    "border-[#fedf89] bg-[var(--boardly-warning-soft)] text-[#7a2e0e]",
  danger: "border-[#fecdca] bg-[var(--boardly-danger-soft)] text-[#912018]",
};

export function Alert({
  tone = "info",
  title,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] border px-4 py-3 text-sm leading-6",
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1" : undefined}>{children}</div> : null}
    </div>
  );
}
