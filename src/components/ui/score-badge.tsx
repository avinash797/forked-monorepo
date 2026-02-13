interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 7.0) return "from-emerald-500 to-emerald-600 text-white";
  if (score >= 4.0) return "from-amber-400 to-amber-500 text-white";
  return "from-red-400 to-red-500 text-white";
}

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
      className={`inline-flex items-center justify-center font-bold rounded-sm bg-gradient-to-b ${getScoreColor(score)} ${sizeStyles[size]} ${className}`}
    >
      {score.toFixed(1)}
    </span>
  );
}
