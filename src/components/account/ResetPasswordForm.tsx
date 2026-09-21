"use client";

import {
  useState,
} from "react";

import {
  CheckCircle2,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

import {
  calcularRequisitosPassword,
} from "@/lib/password";

export default function ResetPasswordForm({
  token,
}: {
  token: string;
}) {
  const router =
    useRouter();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const requirements =
    calcularRequisitosPassword(
      password
    );

  const passwordValida =
    requirements.every(
      (item) =>
        item.completed
    );

  const coinciden =
    password.length > 0 &&
    password === confirmPassword;

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

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

      const response =
        await fetch(
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

      const data =
        (await response.json()) as {
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

      {/* REQUISITOS */}

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Requisitos de seguridad
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {requirements.map(
            (requirement) => (
              <div
                key={
                  requirement.label
                }
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
                  {
                    requirement.label
                  }
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
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading}
        className="w-full"
      >
        {loading
          ? "Actualizando..."
          : "Guardar nueva contraseña"}
      </Button>
    </form>
  );
}
