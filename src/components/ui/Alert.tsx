import type {
  ReactNode,
} from "react";

type Variant =
  | "error"
  | "success"
  | "warning"
  | "info";

const variantClasses: Record<
  Variant,
  string
> = {
  error:
    "border-red-200 bg-red-50 text-red-700",

  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800",

  warning:
    "border-amber-200 bg-amber-50 text-amber-800",

  info:
    "border-blue-200 bg-blue-50 text-blue-700",
};

type Props = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export default function Alert({
  variant = "error",
  className = "",
  children,
}: Props) {
  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
