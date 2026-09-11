import { cn } from "@/lib/utils";

export function IusSeal({
  className,
  title = "IUS",
}: {
  className?: string;
  title?: string;
}) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    const n = (v: number) => v.toFixed(2);
    return {
      x1: n(100 + Math.cos(a) * 80),
      y1: n(100 + Math.sin(a) * 80),
      x2: n(100 + Math.cos(a) * 87),
      y2: n(100 + Math.sin(a) * 87),
    };
  });

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("text-current", className)}
      role="img"
      aria-label={title}
    >
      <circle
        cx="100"
        cy="100"
        r="96"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle
        cx="100"
        cy="100"
        r="88"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
      />
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="currentColor"
          strokeWidth="1.4"
        />
      ))}
      <line
        x1="50"
        y1="76"
        x2="150"
        y2="76"
        stroke="currentColor"
        strokeWidth="1"
      />
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fill="currentColor"
        fontSize="34"
        fontWeight="600"
        letterSpacing="8"
        fontFamily="Outfit, system-ui, sans-serif"
      >
        IUS
      </text>
      <line
        x1="50"
        y1="132"
        x2="150"
        y2="132"
        stroke="currentColor"
        strokeWidth="1"
      />
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
    <span
      aria-label="IUS"
      className={cn(
        "inline-flex shrink-0 items-center justify-center border-2 border-current font-semibold tracking-logo uppercase",
        size === "sm" && "h-8 min-w-14 px-2 text-xs rounded-xs",
        size === "md" && "h-9 min-w-16 px-2.5 text-xs rounded-xs",
        size === "lg" && "h-12 min-w-20 px-3 text-sm rounded-sm",
        className,
      )}
    >
      <span className="translate-x-px">IUS</span>
    </span>
  );
}

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-9";
  return <IusSeal className={cn(box, className)} />;
}
