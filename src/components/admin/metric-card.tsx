type MetricCardProps = {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
};

export function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#9BA1A6]">{title}</span>
        {icon && <span className="text-[#c9a492]">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-[#ECEDEE]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
