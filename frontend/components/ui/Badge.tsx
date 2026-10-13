import { cn } from "@/lib/utils";
import { badgeTones, type BadgeTone } from "@/lib/theme";

export default function Badge({
  children,
  tone = "purple",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}