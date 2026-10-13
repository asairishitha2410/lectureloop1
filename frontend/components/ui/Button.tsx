import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary to-blue text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:brightness-110",
  secondary:
    "bg-lavender-soft text-primary font-semibold border border-primary/15 hover:bg-primary/10",
  outline:
    "bg-white/70 text-slate-700 font-semibold border border-slate-200 hover:border-primary/40 hover:text-navy",
  ghost: "text-slate-600 font-medium hover:bg-slate-100/80 hover:text-navy",
  danger: "bg-rose-50 text-rose-600 font-semibold border border-rose-100 hover:bg-rose-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[var(--radius-control)] gap-1.5",
  md: "h-11 px-5 text-sm rounded-[var(--radius-control)] gap-2",
  lg: "h-12 px-6 text-[15px] rounded-xl gap-2",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center transition-all select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    variants[variant],
    sizes[size],
    className
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, className, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={buttonClass(variant, size, className)}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
});

export default Button;