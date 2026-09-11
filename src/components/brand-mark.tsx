import { cn } from "@/lib/utils";

/** Sello IUS — disco lleno, se lee igual a 40px que en el candado. */
export function IusSeal({
  className,
  title = "IUS",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("text-current", className)}
      role="img"
      aria-label={title}
    >
      <circle
        cx="32"
        cy="32"
        r="30.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="32" cy="32" r="26.5" fill="currentColor" />
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="none"
        stroke="var(--color-bg)"
        strokeWidth="0.7"
        opacity="0.35"
      />
      <text
        x="32"
        y="37.2"
        textAnchor="middle"
        fill="var(--color-bg)"
        fontSize="16.5"
        fontWeight="700"
        letterSpacing="0.8"
        fontFamily="Outfit, system-ui, sans-serif"
      >
        IUS
      </text>
    </svg>
  );
}

export function IusStamp({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <IusSeal
      className={cn(
        size === "sm" && "size-8",
        size === "md" && "size-10",
        size === "lg" && "size-12",
        className,
      )}
    />
  );
}

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return <IusStamp className={className} size={size} />;
}
