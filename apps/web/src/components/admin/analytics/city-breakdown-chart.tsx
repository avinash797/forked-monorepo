"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CityBreakdown } from "@/lib/admin/analytics-queries";

type CityBreakdownChartProps = {
  data: CityBreakdown[];
};

export function CityBreakdownChart({ data }: CityBreakdownChartProps) {
  return (
    <div className="bg-surface border border-border rounded-sm p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        City Breakdown
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-text-secondary">No city data available.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="city_name"
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
              <Bar
                dataKey="total_ratings"
                name="Ratings"
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="total_battles"
                name="Battles"
                fill="var(--warning)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="total_restaurants"
                name="Restaurants"
                fill="var(--success)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
