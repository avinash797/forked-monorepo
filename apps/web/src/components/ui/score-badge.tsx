import { formatScore, getScoreTier, type ScoreTier } from "@forked/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const tierStyles: Record<ScoreTier, string> = {
  high: "from-emerald-500 to-emerald-600 text-white",
  mid: "from-amber-400 to-amber-500 text-white",
  low: "from-red-400 to-red-500 text-white",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5 min-w-[36px]",
  md: "text-sm px-2.5 py-1 min-w-[44px]",
  lg: "text-base px-3 py-1.5 min-w-[52px]",
};

export function ScoreBadge({
  score,
  size = "md",
  className = "",
}: ScoreBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-sm bg-gradient-to-b ${tierStyles[getScoreTier(score)]} ${sizeStyles[size]} ${className}`}
    >
      {formatScore(score)}
    </span>
  );
}
