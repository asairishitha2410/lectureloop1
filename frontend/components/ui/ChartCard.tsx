import Card from "./Card";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, actions, children, className }: ChartCardProps) {
  return (
    <Card className={`p-6 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="font-bold text-navy">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}