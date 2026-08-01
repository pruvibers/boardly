import Image from "next/image";

type BoardlyLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const logoSizes = {
  sm: "w-28",
  md: "w-36",
  lg: "w-44",
};

export function BoardlyLogo({
  size = "md",
  showText = true,
  className = "",
}: BoardlyLogoProps) {
  return (
    <span className={`inline-flex shrink-0 ${className}`}>
      <Image
        src="/boardly-logo.png"
        alt={showText ? "Boardly" : "Boardly logo"}
        width={1536}
        height={1024}
        priority
        className={`${logoSizes[size]} h-auto select-none object-contain`}
      />
    </span>
  );
}
