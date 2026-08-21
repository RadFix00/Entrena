"use client";

import { useState } from "react";

import {
  CheckCircle2,
  Loader2,
  Mail,
  Send,
} from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      setError(
        "Ingresa tu correo electrónico."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
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
            "No se pudo procesar la solicitud."
        );
      }

      setSuccess(
        data.message ??
          "Si existe una cuenta asociada a ese correo, recibirás instrucciones."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo procesar la solicitud."
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
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Correo electrónico
        </span>

        <div className="relative mt-2">
          <Mail
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            required
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            disabled={loading}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <p className="text-sm font-bold text-emerald-800">
              Solicitud recibida
            </p>

            <p className="mt-1 text-sm leading-5 text-emerald-700">
              {success}
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          Boolean(success)
        }
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2
            size={17}
            className="animate-spin"
          />
        ) : (
          <Send size={17} />
        )}

        {loading
          ? "Procesando..."
          : "Enviar enlace de recuperación"}
      </button>
    </form>
  );
}