"use client";

import {
  useState,
} from "react";

import {
  Copy,
  Loader2,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

type Props = {
  planId: string;
  planNombre: string;

  className?: string;
};

export default function DuplicarPlanButton({
  planId,
  planNombre,
  className = "",
}: Props) {
  const router =
    useRouter();

  const [
    duplicando,
    setDuplicando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function duplicar() {
    const confirmar =
      window.confirm(
        `¿Duplicar "${planNombre}"?\n\n` +
          "Se creará una copia completa como borrador."
      );

    if (!confirmar) {
      return;
    }

    try {
      setDuplicando(
        true
      );

      setError("");

      const response =
        await fetch(
          `/api/trainer/planes/${planId}/duplicar`,
          {
            method:
              "POST",
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;

          error?: string;

          plan?: {
            id: string;
            name: string;
          };
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo duplicar el plan."
        );
      }

      /*
       * Actualiza /trainer/planes
       * consultando nuevamente PostgreSQL.
       */
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo duplicar el plan."
      );
    } finally {
      setDuplicando(
        false
      );
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={
          duplicando
        }
        onClick={
          duplicar
        }
        className={`
          inline-flex h-10 items-center justify-center gap-2
          rounded-xl border border-violet-200
          bg-violet-50 px-4
          text-sm font-semibold text-violet-700
          transition hover:bg-violet-100
          disabled:cursor-not-allowed disabled:opacity-50
          ${className}
        `}
      >
        {duplicando ? (
          <Loader2
            size={16}
            className="animate-spin"
          />
        ) : (
          <Copy
            size={16}
          />
        )}

        {duplicando
          ? "Duplicando..."
          : "Duplicar"}
      </button>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}