import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/class-names";

type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  headingLevel?: 1 | 2;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  headingLevel = 1,
  className,
  ...props
}: PageHeaderProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--boardly-accent)]">
            {eyebrow}
          </p>
        ) : null}
        <Heading className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--boardly-text)] sm:text-3xl">
          {title}
        </Heading>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--boardly-muted)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
