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
    <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-5">
      <h3 className="text-lg font-semibold text-[#ECEDEE] mb-4">
        City Breakdown
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-[#9BA1A6]">No city data available.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(236,237,238,0.08)"
              />
              <XAxis
                dataKey="city_name"
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
              <Bar
                dataKey="total_ratings"
                name="Ratings"
                fill="#ee6c2b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="total_battles"
                name="Battles"
                fill="#FBBF24"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="total_restaurants"
                name="Restaurants"
                fill="#34D399"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
