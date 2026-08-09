import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "boardly-field min-h-11 px-3.5 py-2.5 text-sm placeholder:text-[#98a2b3] disabled:cursor-not-allowed disabled:bg-[var(--boardly-elevated)] disabled:text-[var(--boardly-muted)] aria-[invalid=true]:border-[var(--boardly-danger)]",
        className,
      )}
      {...props}
    />
  );
});
