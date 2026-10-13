import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function Card({ children, className, id }: CardProps) {
  return (
    <div
      id={id}
      className={cn(
        "bg-white/80 backdrop-blur-xl rounded-[var(--radius-card)] border border-slate-200/60 shadow-[var(--shadow-card)]",
        className
      )}
    >
      {children}
    </div>
  );
}