import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "boardly-field min-h-11 px-3.5 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-[var(--boardly-elevated)] disabled:text-[var(--boardly-muted)] aria-[invalid=true]:border-[var(--boardly-danger)]",
        className,
      )}
      {...props}
    />
  );
});
