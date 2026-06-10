type MetricCardProps = {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
};

export function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="bg-surface border border-border rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-secondary">{title}</span>
        {icon && <span className="text-text-secondary">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-text-primary">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
