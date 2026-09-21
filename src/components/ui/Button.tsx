import { Loader2 } from "lucide-react";

import type {
  ButtonHTMLAttributes,
} from "react";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

type Size =
  | "sm"
  | "md";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<
  Variant,
  string
> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover",

  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",

  ghost:
    "text-slate-600 hover:bg-slate-50 hover:text-slate-900",

  danger:
    "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<
  Size,
  string
> = {
  sm: "h-10 px-4 text-sm",

  md: "h-11 px-5 text-sm",
};

/*
 * Clases reutilizables para poder estilizar
 * también <Link> como botón.
 */
export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className = ""
) {
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

type Props =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
  };

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      type="button"
      disabled={
        disabled || loading
      }
      className={buttonClasses(
        variant,
        size,
        className
      )}
      {...props}
    >
      {loading && (
        <Loader2
          size={16}
          className="animate-spin"
        />
      )}

      {children}
    </button>
  );
}
