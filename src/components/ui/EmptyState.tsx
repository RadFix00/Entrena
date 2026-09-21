import type {
  LucideIcon,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center ${className}`}
    >
      <Icon
        size={30}
        className="mx-auto text-slate-300"
      />

      <h2 className="mt-4 font-bold text-slate-800">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}
