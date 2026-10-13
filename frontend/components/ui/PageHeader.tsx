export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-7">
      <div className="min-w-0">
        {eyebrow ? (
          <span className="text-xs font-semibold text-primary tracking-widest uppercase">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mt-1">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div> : null}
    </div>
  );
}