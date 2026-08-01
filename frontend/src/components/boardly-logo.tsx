type BoardlyLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const iconSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const textSizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export function BoardlyLogo({
  size = "md",
  showText = true,
  className = "",
}: BoardlyLogoProps) {
  return (
    <div
      aria-label={showText ? undefined : "Boardly"}
      className={`flex select-none items-center gap-3 ${className}`}
      role={showText ? undefined : "img"}
    >
      <span
        aria-hidden="true"
        className={`${iconSizes[size]} flex items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#6E36E4] to-[#5B21B6] text-white shadow-sm shadow-purple-700/25`}
      >
        <svg
          className="h-3/5 w-3/5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {showText ? (
        <span className={`${textSizes[size]} font-bold tracking-tight text-gray-950`}>
          Boardly
        </span>
      ) : null}
    </div>
  );
}
