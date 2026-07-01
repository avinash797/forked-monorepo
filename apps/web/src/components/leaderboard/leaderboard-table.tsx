import Image from "next/image";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardEntry } from "@forked/supabase";

export type { LeaderboardEntry };

function getRankBadgeVariant(
  rank: number
): "gold" | "silver" | "bronze" | "default" {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "default";
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function ConfidenceBar({ score }: { score: number }) {
  const maxConfidence = 3;
  const percentage = Math.min((score / maxConfidence) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-text-tertiary">{score.toFixed(2)}</span>
    </div>
  );
}

export function LeaderboardTable({
  entries,
}: {
  entries: LeaderboardEntry[];
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 bg-surface rounded-lg border border-border">
        <p className="text-xl font-semibold text-text-primary mb-2">
          No rankings yet
        </p>
        <p className="text-text-secondary">
          Be the first to rate! Download the app and start the leaderboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.restaurant_id}
          className="flex items-center gap-4 bg-surface rounded-lg border border-border p-4 hover:border-accent/30 transition-colors"
        >
          {/* Rank */}
          <div className="flex-shrink-0 w-12 text-center">
            <Badge variant={getRankBadgeVariant(entry.rank)}>
              {getRankDisplay(entry.rank)}
            </Badge>
          </div>

          {/* Photo */}
          {entry.featured_photo_url && (
            <div className="flex-shrink-0 w-14 h-14 rounded-md overflow-hidden bg-surface-2">
              <Image
                src={entry.featured_photo_url}
                alt={`${entry.restaurant_name} dish`}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text-primary truncate">
              {entry.restaurant_name}
            </p>
            <div className="mt-1 flex items-center gap-4 text-xs text-text-tertiary">
              <span>{entry.total_ratings} ratings</span>
              <span>|</span>
              <span>Confidence: {entry.confidence_tier}</span>
            </div>
          </div>

          {/* Score + Confidence */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            <ScoreBadge score={entry.bayesian_score ?? 0} />
          </div>
        </div>
      ))}
    </div>
  );
}
