"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  Rocket,
} from "lucide-react";

type EstadoPlan =
  | "DRAFT"
  | "ACTIVE"
  | null;

type Props = {
  clienteId: string;
};

export default function ActivarPlanButton({
  clienteId,
}: Props) {
  const [
    estado,
    setEstado,
  ] =
    useState<EstadoPlan>(
      null
    );

  const [
    activando,
    setActivando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargarEstado() {
      try {
        const response =
          await fetch(
            `/api/trainer/clientes/${clienteId}/plan/activar`,
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (
          response.ok &&
          !cancelado
        ) {
          setEstado(
            data.status ??
              null
          );
        }
      } catch {
        /*
         * No bloqueamos el editor
         * si falla esta consulta.
         */
      }
    }

    cargarEstado();

    return () => {
      cancelado = true;
    };
  }, [clienteId]);

  async function activarPlan() {
    try {
      setActivando(true);
      setError("");

      const response =
        await fetch(
          `/api/trainer/clientes/${clienteId}/plan/activar`,
          {
            method:
              "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo activar el plan."
        );
      }

      setEstado(
        "ACTIVE"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo activar el plan."
      );
    } finally {
      setActivando(false);
    }
  }

  if (
    estado === "ACTIVE"
  ) {
    return (
      <div className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
        <CheckCircle2
          size={18}
        />

        Plan activo
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={activarPlan}
        disabled={activando}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Rocket size={17} />

        {activando
          ? "Activando..."
          : "Activar plan"}
      </button>

      {error && (
        <p className="mt-2 max-w-56 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}