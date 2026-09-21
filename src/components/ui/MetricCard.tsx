import type {
  LucideIcon,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  iconClassName?: string;
  footer?: ReactNode;
  className?: string;
};

export default function MetricCard({
  icon: Icon,
  label,
  value,
  iconClassName = "bg-emerald-50 text-emerald-700",
  footer,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

          {footer && (
            <p className="mt-1 text-xs text-slate-400">
              {footer}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}
