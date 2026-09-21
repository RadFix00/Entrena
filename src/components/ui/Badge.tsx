import type {
  ReactNode,
} from "react";

type Variant =
  | "emerald"
  | "amber"
  | "slate"
  | "blue"
  | "violet"
  | "red";

const variantClasses: Record<
  Variant,
  string
> = {
  emerald:
    "bg-emerald-50 text-emerald-700",

  amber:
    "bg-amber-50 text-amber-700",

  slate:
    "bg-slate-100 text-slate-500",

  blue:
    "bg-blue-50 text-blue-700",

  violet:
    "bg-violet-50 text-violet-700",

  red:
    "bg-red-50 text-red-600",
};

type Props = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export default function Badge({
  variant = "emerald",
  className = "",
  children,
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
