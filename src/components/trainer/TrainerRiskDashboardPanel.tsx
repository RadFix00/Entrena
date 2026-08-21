"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import type {
  TrainerRiskOverview,
} from "@/lib/trainer-risk-data";

export default function TrainerRiskDashboardPanel() {
  const [
    data,
    setData,
  ] =
    useState<TrainerRiskOverview | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState(false);

  useEffect(() => {
    let activo =
      true;

    async function cargar() {
      try {
        const response =
          await fetch(
            "/api/trainer/riesgo",
            {
              cache:
                "no-store",
            }
          );

        if (
          !response.ok
        ) {
          throw new Error();
        }

        const json =
          (await response.json()) as TrainerRiskOverview;

        if (activo) {
          setData(
            json
          );
        }
      } catch {
        if (activo) {
          setError(
            true
          );
        }
      } finally {
        if (activo) {
          setLoading(
            false
          );
        }
      }
    }

    cargar();

    return () => {
      activo =
        false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />

        <div className="mt-4 h-16 animate-pulse rounded-xl bg-slate-50" />
      </div>
    );
  }

  if (
    error ||
    !data
  ) {
    return null;
  }

  const requierenAtencion =
    data.clientes.filter(
      (cliente) =>
        cliente.level ===
          "CRITICAL" ||
        cliente.level ===
          "HIGH" ||
        cliente.level ===
          "MEDIUM"
    );

  /*
   * Todo bien.
   */
  if (
    requierenAtencion.length ===
    0
  ) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={21}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <h2 className="font-bold text-slate-900">
              Clientes estables
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              No se detectaron señales importantes de riesgo de adherencia.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={19}
              className="text-amber-500"
            />

            <h2 className="font-bold text-slate-900">
              Requieren atención
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {
              requierenAtencion.length
            }{" "}
            clientes presentan señales de riesgo.
          </p>
        </div>

        <Link
          href="/trainer/alertas"
          className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800"
        >
          Ver todas

          <ArrowRight
            size={15}
          />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {requierenAtencion
          .slice(
            0,
            3
          )
          .map(
            (cliente) => (
              <Link
                key={
                  cliente.clientId
                }
                href={`/trainer/clientes/${cliente.clientId}/adherencia`}
                className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      cliente.level ===
                      "CRITICAL"
                        ? "bg-red-100 text-red-600"
                        : cliente.level ===
                            "HIGH"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {cliente.level ===
                    "CRITICAL" ? (
                      <AlertCircle
                        size={18}
                      />
                    ) : (
                      <AlertTriangle
                        size={18}
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {
                        cliente.clientName
                      }
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {cliente.reasons[0]}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-slate-800">
                    {cliente.adherence30 !==
                    null
                      ? `${cliente.adherence30}%`
                      : "—"}
                  </p>

                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    adherencia
                  </p>
                </div>
              </Link>
            )
          )}
      </div>
    </section>
  );
}