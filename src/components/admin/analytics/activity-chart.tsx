"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailyStat } from "@/lib/admin/analytics-queries";

type ActivityChartProps = {
  data: DailyStat[];
};

export function ActivityChart({ data }: ActivityChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    day: new Date(d.day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-5">
      <h3 className="text-lg font-semibold text-[#ECEDEE] mb-4">
        Daily Activity
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(236,237,238,0.08)"
            />
            <XAxis
              dataKey="day"
              stroke="#9BA1A6"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#9BA1A6" fontSize={12} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#221610",
                border: "1px solid rgba(236,237,238,0.12)",
                borderRadius: "6px",
                color: "#ECEDEE",
                fontSize: 13,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#9BA1A6" }}
            />
            <Line
              type="monotone"
              dataKey="new_users"
              name="Users"
              stroke="#ee6c2b"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="new_ratings"
              name="Ratings"
              stroke="#34D399"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="new_battles"
              name="Battles"
              stroke="#FBBF24"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
