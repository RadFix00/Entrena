"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function ResetPasswordForm({
  token,
}: {
  token: string;
}) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const requirements = [
    {
      label: "Mínimo 8 caracteres",
      completed: password.length >= 8,
    },
    {
      label: "Una mayúscula",
      completed: /[A-Z]/.test(password),
    },
    {
      label: "Una minúscula",
      completed: /[a-z]/.test(password),
    },
    {
      label: "Un número",
      completed: /\d/.test(password),
    },
  ];

  const passwordValida =
    requirements.every(
      (item) => item.completed
    );

  const coinciden =
    password.length > 0 &&
    password === confirmPassword;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!passwordValida) {
      setError(
        "La nueva contraseña no cumple todos los requisitos."
      );

      return;
    }

    if (!coinciden) {
      setError(
        "Las contraseñas no coinciden."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        }
      );

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo actualizar la contraseña."
        );
      }

      router.replace(
        "/login?reset=success"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la contraseña."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <PasswordField
        label="Nueva contraseña"
        value={password}
        onChange={setPassword}
        visible={showPassword}
        onToggle={() =>
          setShowPassword(
            (current) => !current
          )
        }
      />

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Requisitos de seguridad
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {requirements.map(
            (requirement) => (
              <div
                key={requirement.label}
                className="flex items-center gap-2"
              >
                <CheckCircle2
                  size={15}
                  className={
                    requirement.completed
                      ? "text-emerald-600"
                      : "text-slate-300"
                  }
                />

                <span
                  className={`text-xs ${
                    requirement.completed
                      ? "font-semibold text-emerald-700"
                      : "text-slate-500"
                  }`}
                >
                  {requirement.label}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      <PasswordField
        label="Confirmar contraseña"
        value={confirmPassword}
        onChange={setConfirmPassword}
        visible={showConfirm}
        onToggle={() =>
          setShowConfirm(
            (current) => !current
          )
        }
      />

      {confirmPassword && (
        <p
          className={`text-xs font-semibold ${
            coinciden
              ? "text-emerald-600"
              : "text-red-500"
          }`}
        >
          {coinciden
            ? "Las contraseñas coinciden."
            : "Las contraseñas no coinciden."}
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2
            size={17}
            className="animate-spin"
          />
        ) : (
          <LockKeyhole size={17} />
        )}

        {loading
          ? "Actualizando..."
          : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <LockKeyhole
          size={15}
          className="text-slate-400"
        />

        {label}
      </span>

      <div className="relative mt-2">
        <input
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
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        />

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
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </label>
  );
}