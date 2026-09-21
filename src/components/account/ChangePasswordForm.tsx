"use client";

import {
  useState,
} from "react";

import {
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import {
  signOut,
} from "next-auth/react";

import PasswordField from "@/components/ui/PasswordField";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

import {
  calcularRequisitosPassword,
} from "@/lib/password";

export default function ChangePasswordForm() {
  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrent,
    setShowCurrent,
  ] = useState(false);

  const [
    showNew,
    setShowNew,
  ] = useState(false);

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

  const requirements =
    calcularRequisitosPassword(
      newPassword
    );

  const passwordValida =
    requirements.every(
      (item) =>
        item.completed
    );

  const coinciden =
    newPassword.length >
      0 &&
    newPassword ===
      confirmPassword;

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (guardando) {
      return;
    }

    setError("");
    setSuccess(false);

    if (!currentPassword) {
      setError(
        "Ingresa tu contraseña actual."
      );

      return;
    }

    if (!passwordValida) {
      setError(
        "La nueva contraseña no cumple todos los requisitos."
      );

      return;
    }

    if (!coinciden) {
      setError(
        "Las contraseñas nuevas no coinciden."
      );

      return;
    }

    try {
      setGuardando(true);

      const response =
        await fetch(
          "/api/profile/password",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              currentPassword,
              newPassword,
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
            "No se pudo cambiar la contraseña."
        );
      }

      setSuccess(true);

      /*
       * Damos un pequeño momento
       * para mostrar confirmación.
       */
      window.setTimeout(
        async () => {
          await signOut({
            callbackUrl:
              "/login?passwordChanged=1",
          });
        },
        1200
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar la contraseña."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* CONTRASEÑA ACTUAL */}

      <PasswordField
        label="Contraseña actual"
        value={currentPassword}
        onChange={setCurrentPassword}
        visible={showCurrent}
        onToggle={() =>
          setShowCurrent(
            (actual) => !actual
          )
        }
        autoComplete="current-password"
      />

      <div className="border-t border-slate-100" />

      {/* NUEVA */}

      <PasswordField
        label="Nueva contraseña"
        value={newPassword}
        onChange={setNewPassword}
        visible={showNew}
        onToggle={() =>
          setShowNew(
            (actual) => !actual
          )
        }
      />

      {/* REQUISITOS */}

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Requisitos
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {requirements.map(
            (item) => (
              <div
                key={item.label}
                className="flex items-center gap-2"
              >
                <CheckCircle2
                  size={15}
                  className={
                    item.completed
                      ? "text-emerald-600"
                      : "text-slate-300"
                  }
                />

                <span
                  className={`text-xs ${
                    item.completed
                      ? "font-semibold text-emerald-700"
                      : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* CONFIRMAR */}

      <PasswordField
        label="Confirmar nueva contraseña"
        value={confirmPassword}
        onChange={setConfirmPassword}
        visible={showConfirm}
        onToggle={() =>
          setShowConfirm(
            (actual) => !actual
          )
        }
      />

      {confirmPassword &&
        newPassword && (
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

      {/* ERROR */}

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* ÉXITO */}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <p className="text-sm font-bold text-emerald-800">
              Contraseña actualizada
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              Cerraremos tu sesión para que vuelvas a ingresar con la nueva contraseña.
            </p>
          </div>
        </div>
      )}

      {/* BOTÓN */}

      <Button
        type="submit"
        variant="primary"
        loading={guardando}
        disabled={
          guardando || success
        }
        className="sm:w-auto"
      >
        {guardando
          ? "Actualizando..."
          : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
