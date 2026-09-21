"use client";

import {
  useState,
} from "react";

import {
  Mail,
} from "lucide-react";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

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
    event:
      React.FormEvent<HTMLFormElement>
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

      const response =
        await fetch(
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

        <div className="mt-2">
          <Input
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
            leftIcon={
              <Mail
                size={17}
              />
            }
          />
        </div>
      </label>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          {success}
        </Alert>
      )}

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={
          loading || Boolean(success)
        }
        className="w-full"
      >
        {loading
          ? "Procesando..."
          : "Enviar enlace de recuperación"}
      </Button>
    </form>
  );
}
