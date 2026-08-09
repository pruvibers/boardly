import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "inverse";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--boardly-accent)] text-white shadow-sm hover:bg-[var(--boardly-accent-hover)]",
  secondary:
    "border border-[var(--boardly-border-strong)] bg-white text-[var(--boardly-text)] shadow-sm hover:bg-[var(--boardly-elevated)]",
  ghost:
    "text-[var(--boardly-muted)] hover:bg-[var(--boardly-elevated)] hover:text-[var(--boardly-text)]",
  danger:
    "bg-[var(--boardly-danger)] text-white shadow-sm hover:bg-[#912018]",
  inverse:
    "border border-white/25 bg-white/10 text-white hover:bg-white/15",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-xs",
  md: "min-h-10 px-4 py-2.5 text-sm",
  lg: "min-h-11 px-5 py-3 text-sm",
  icon: "h-10 w-10 p-0",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonStyles({ variant, size, className })}
        {...props}
      />
    );
  },
);
