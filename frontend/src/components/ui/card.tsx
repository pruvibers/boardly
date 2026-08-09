import { type HTMLAttributes } from "react";
import { cn } from "@/lib/class-names";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "header";
  variant?: "surface" | "subtle";
  padding?: "none" | "sm" | "md" | "lg";
};

const variantStyles = {
  surface:
    "border border-[var(--boardly-border)] bg-[var(--boardly-surface)] shadow-[var(--boardly-shadow-surface)]",
  subtle:
    "border border-[var(--boardly-border)] bg-[var(--boardly-elevated)]",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({
  as: Component = "div",
  variant = "surface",
  padding = "md",
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        "rounded-[var(--boardly-radius-surface)]",
        variantStyles[variant],
        paddingStyles[padding],
        className,
      )}
      {...props}
    />
  );
}
