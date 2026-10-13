"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
  className?: string;
  ariaLabel?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name,
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-[var(--radius-control)] bg-slate-100/90 border border-slate-200/70",
        className
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            name={name}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 h-9 rounded-[10px] text-sm font-semibold transition-all cursor-pointer",
              selected
                ? "bg-white text-primary shadow-sm border border-primary/10"
                : "text-slate-500 hover:text-navy"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}