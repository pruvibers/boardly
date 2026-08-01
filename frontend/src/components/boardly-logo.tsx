import Image from "next/image";

type BoardlyLogoProps = {
  variant?: "compact" | "header" | "landing";
  tone?: "light" | "dark";
  showText?: boolean;
  className?: string;
};

const logoVariants = {
  compact: {
    frame: "h-8 w-8",
    text: "text-xl",
    gap: "gap-2",
  },
  header: {
    frame: "h-10 w-10",
    text: "text-2xl",
    gap: "gap-2.5",
  },
  landing: {
    frame: "h-14 w-14",
    text: "text-4xl",
    gap: "gap-3",
  },
};

export function BoardlyLogo({
  variant = "header",
  tone = "light",
  showText = true,
  className = "",
}: BoardlyLogoProps) {
  const styles = logoVariants[variant];
  return (
    <span
      className={`inline-flex shrink-0 items-center ${styles.gap} ${className}`}
    >
      <span
        className={`relative shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ${styles.frame}`}
      >
        <Image
          src="/boardly-logo.png"
          alt={showText ? "" : "Boardly"}
          width={1536}
          height={1024}
          priority
          className="pointer-events-none absolute left-[-104%] top-[-130%] h-[380%] w-auto max-w-none select-none object-contain"
        />
      </span>
      {showText ? (
        <span
          className={`${styles.text} font-extrabold leading-none ${
            tone === "dark" ? "text-white" : "text-[#3B18A8]"
          }`}
        >
          Boardly
        </span>
      ) : null}
    </span>
  );
}
