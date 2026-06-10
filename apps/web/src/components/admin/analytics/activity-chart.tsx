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
    <div className="bg-surface border border-border rounded-sm p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Daily Activity
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="day"
              stroke="var(--text-secondary)"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-primary)",
                fontSize: 13,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
            />
            <Line
              type="monotone"
              dataKey="new_users"
              name="Users"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="new_ratings"
              name="Ratings"
              stroke="var(--success)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="new_battles"
              name="Battles"
              stroke="var(--warning)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
