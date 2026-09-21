import {
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import Input from "./Input";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete?: string;
};

export default function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete = "new-password",
}: Props) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <LockKeyhole
          size={15}
          className="text-slate-400"
        />

        {label}
      </span>

      <div className="mt-2">
        <Input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          autoComplete={
            autoComplete
          }
          rightElement={
            <button
              type="button"
              onClick={onToggle}
              aria-label={
                visible
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {visible ? (
                <EyeOff
                  size={17}
                />
              ) : (
                <Eye
                  size={17}
                />
              )}
            </button>
          }
        />
      </div>
    </label>
  );
}
