import type { LeaderboardHealth } from "@/lib/admin/analytics-queries";

type LeaderboardHealthProps = {
  health: LeaderboardHealth;
};

export function LeaderboardHealthCard({ health }: LeaderboardHealthProps) {
  const { total_entries, high_confidence, medium_confidence, low_confidence } =
    health;

  const highPct =
    total_entries > 0
      ? Math.round((high_confidence / total_entries) * 100)
      : 0;
  const medPct =
    total_entries > 0
      ? Math.round((medium_confidence / total_entries) * 100)
      : 0;
  const lowPct =
    total_entries > 0
      ? Math.round((low_confidence / total_entries) * 100)
      : 0;

  return (
    <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-5">
      <h3 className="text-lg font-semibold text-[#ECEDEE] mb-4">
        Leaderboard Health
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#9BA1A6]">Total Entries</span>
          <span className="text-[#ECEDEE] font-semibold">
            {total_entries.toLocaleString()}
          </span>
        </div>

        {/* Bar visualization */}
        <div className="h-4 rounded-pill overflow-hidden flex bg-[#221610]">
          {highPct > 0 && (
            <div
              className="bg-[#34D399] transition-all"
              style={{ width: `${highPct}%` }}
            />
          )}
          {medPct > 0 && (
            <div
              className="bg-[#FBBF24] transition-all"
              style={{ width: `${medPct}%` }}
            />
          )}
          {lowPct > 0 && (
            <div
              className="bg-[#F87171] transition-all"
              style={{ width: `${lowPct}%` }}
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#34D399]" />
            <div>
              <p className="text-[#ECEDEE] font-medium">{high_confidence}</p>
              <p className="text-xs text-[#9BA1A6]">High ({highPct}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FBBF24]" />
            <div>
              <p className="text-[#ECEDEE] font-medium">{medium_confidence}</p>
              <p className="text-xs text-[#9BA1A6]">Medium ({medPct}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F87171]" />
            <div>
              <p className="text-[#ECEDEE] font-medium">{low_confidence}</p>
              <p className="text-xs text-[#9BA1A6]">Low ({lowPct}%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
