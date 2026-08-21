"use client";

import {
  useState,
} from "react";

import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  Medal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import type {
  AdherenceAnalytics,
  AdherencePeriodMetric,
} from "@/lib/adherence-analytics";

type Props = {
  clientName: string;

  planName: string;

  analytics:
    AdherenceAnalytics;
};

type Vista =
  | "WEEKLY"
  | "MONTHLY";

export default function TrainerAdherenceAnalytics({
  clientName,
  planName,
  analytics,
}: Props) {
  const [
    vista,
    setVista,
  ] =
    useState<Vista>(
      "WEEKLY"
    );

  const periodos =
    vista ===
    "WEEKLY"
      ? analytics.semanas
      : analytics.meses;

  return (
    <div className="mt-7 space-y-6">
      {/* ====================================== */}
      {/* MÉTRICAS PRINCIPALES */}
      {/* ====================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica
          titulo="Adherencia 30 días"
          valor={
            analytics
              .ultimos30
              .adherencia !==
            null
              ? `${analytics.ultimos30.adherencia}%`
              : "—"
          }
          detalle={`${analytics.ultimos30.completadas}/${analytics.ultimos30.evaluadas} sesiones`}
          icono={
            <CheckCircle2
              size={20}
            />
          }
        />

        <Metrica
          titulo="Puntualidad"
          valor={
            analytics
              .ultimos30
              .puntualidad !==
            null
              ? `${analytics.ultimos30.puntualidad}%`
              : "—"
          }
          detalle={`${analytics.ultimos30.aTiempo} a tiempo · ${analytics.ultimos30.tarde} tarde`}
          icono={
            <Clock
              size={20}
            />
          }
        />

        <Metrica
          titulo="Racha actual"
          valor={`${analytics.rachaActual}`}
          detalle="Sesiones consecutivas cumplidas"
          icono={
            <Flame
              size={20}
            />
          }
        />

        <Metrica
          titulo="Mejor racha"
          valor={`${analytics.mejorRacha}`}
          detalle="Récord de sesiones consecutivas"
          icono={
            <Medal
              size={20}
            />
          }
        />
      </section>

      {/* ====================================== */}
      {/* TENDENCIA */}
      {/* ====================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Tendencia de adherencia
            </p>

            <div className="mt-2 flex items-end gap-3">
              <p className="text-3xl font-bold text-slate-900">
                {analytics
                  .ultimos30
                  .adherencia !==
                null
                  ? `${analytics.ultimos30.adherencia}%`
                  : "—"}
              </p>

              {analytics.tendencia30 !==
                null && (
                <div
                  className={`mb-1 inline-flex items-center gap-1 text-sm font-bold ${
                    analytics.tendencia30 >
                    0
                      ? "text-emerald-600"
                      : analytics.tendencia30 <
                          0
                        ? "text-red-500"
                        : "text-slate-400"
                  }`}
                >
                  {analytics.tendencia30 >
                  0 ? (
                    <TrendingUp
                      size={17}
                    />
                  ) : analytics.tendencia30 <
                    0 ? (
                    <TrendingDown
                      size={17}
                    />
                  ) : null}

                  {analytics.tendencia30 >
                  0
                    ? "+"
                    : ""}
                  {
                    analytics.tendencia30
                  }{" "}
                  pp
                </div>
              )}
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Comparación de los últimos 30 días contra los 30 días anteriores.
            </p>
          </div>

          <div
            className={`rounded-2xl px-5 py-4 ${
              analytics.tendencia30 ===
              null
                ? "bg-slate-50"
                : analytics.tendencia30 >
                    0
                  ? "bg-emerald-50"
                  : analytics.tendencia30 <
                      0
                    ? "bg-red-50"
                    : "bg-slate-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Diagnóstico
            </p>

            <p className="mt-1 font-bold text-slate-800">
              {analytics.tendencia30 ===
              null
                ? "Aún no hay suficiente historial"
                : analytics.tendencia30 >=
                    10
                  ? "Mejora importante"
                  : analytics.tendencia30 >
                      0
                    ? "Tendencia positiva"
                    : analytics.tendencia30 <=
                        -10
                      ? "Requiere atención"
                      : analytics.tendencia30 <
                          0
                        ? "Ligera caída"
                        : "Se mantiene estable"}
            </p>
          </div>
        </div>
      </section>

      {/* ====================================== */}
      {/* 7 / 30 / 90 */}
      {/* ====================================== */}

      <section>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Cumplimiento por periodo
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Permite detectar cambios recientes sin confundirlos con todo el historial.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <PeriodSummary
            periodo={
              analytics.ultimos7
            }
          />

          <PeriodSummary
            periodo={
              analytics.ultimos30
            }
          />

          <PeriodSummary
            periodo={
              analytics.ultimos90
            }
          />
        </div>
      </section>

      {/* ====================================== */}
      {/* ESTADO GENERAL */}
      {/* ====================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SmallMetric
          titulo="Completadas"
          valor={
            analytics.totales
              .completadas
          }
          detalle={`${analytics.totales.aTiempo} a tiempo`}
          icono={
            <CheckCircle2
              size={18}
            />
          }
        />

        <SmallMetric
          titulo="Completadas tarde"
          valor={
            analytics.totales
              .tarde
          }
          detalle="Dentro del plan"
          icono={
            <Clock
              size={18}
            />
          }
        />

        <SmallMetric
          titulo="Perdidas"
          valor={
            analytics.totales
              .perdidas
          }
          detalle="Fechas ya vencidas"
          icono={
            <AlertTriangle
              size={18}
            />
          }
        />

        <SmallMetric
          titulo="Pendientes"
          valor={
            analytics.totales
              .hoy +
            analytics.totales
              .proximas
          }
          detalle={`${analytics.totales.hoy} para hoy`}
          icono={
            <CalendarDays
              size={18}
            />
          }
        />
      </section>

      {/* ====================================== */}
      {/* EVOLUCIÓN */}
      {/* ====================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3
                size={20}
                className="text-emerald-600"
              />

              <h2 className="font-bold text-slate-900">
                Evolución de adherencia
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Comportamiento histórico de las sesiones programadas.
            </p>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() =>
                setVista(
                  "WEEKLY"
                )
              }
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                vista ===
                "WEEKLY"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Semanal
            </button>

            <button
              type="button"
              onClick={() =>
                setVista(
                  "MONTHLY"
                )
              }
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                vista ===
                "MONTHLY"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Mensual
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {periodos.map(
            (periodo) => (
              <PeriodBar
                key={
                  periodo.key
                }
                periodo={
                  periodo
                }
              />
            )
          )}
        </div>
      </section>

      {/* ====================================== */}
      {/* RESUMEN */}
      {/* ====================================== */}

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
          Resumen
        </p>

        <h3 className="mt-2 text-lg font-bold text-slate-900">
          {clientName}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          Tiene{" "}
          <strong>
            {
              analytics
                .totales
                .completadas
            }
          </strong>{" "}
          sesiones cumplidas de{" "}
          <strong>
            {
              analytics
                .totales
                .evaluadas
            }
          </strong>{" "}
          que ya pueden evaluarse en el plan{" "}
          <strong>
            {planName}
          </strong>
          .
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Actualmente mantiene una racha de{" "}
          <strong>
            {
              analytics
                .rachaActual
            }
          </strong>{" "}
          sesiones consecutivas y su mejor racha histórica es de{" "}
          <strong>
            {
              analytics
                .mejorRacha
            }
          </strong>
          .
        </p>
      </section>
    </div>
  );
}

/*
 * ============================================================
 * COMPONENTES
 * ============================================================
 */

function Metrica({
  titulo,
  valor,
  detalle,
  icono,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icono}
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {valor}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {detalle}
      </p>
    </div>
  );
}

function SmallMetric({
  titulo,
  valor,
  detalle,
  icono,
}: {
  titulo: string;
  valor: number;
  detalle: string;
  icono: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icono}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500">
            {titulo}
          </p>

          <p className="text-xl font-bold text-slate-900">
            {valor}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {detalle}
      </p>
    </div>
  );
}

function PeriodSummary({
  periodo,
}: {
  periodo:
    AdherencePeriodMetric;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {periodo.label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {periodo.adherencia !==
        null
          ? `${periodo.adherencia}%`
          : "—"}
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor(
            periodo.adherencia
          )}`}
          style={{
            width: `${
              periodo.adherencia ??
              0
            }%`,
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>
          {
            periodo.completadas
          }{" "}
          cumplidas
        </span>

        <span>
          {
            periodo.perdidas
          }{" "}
          perdidas
        </span>
      </div>
    </div>
  );
}

function PeriodBar({
  periodo,
}: {
  periodo:
    AdherencePeriodMetric;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold capitalize text-slate-700">
            {periodo.label}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            {
              periodo.completadas
            }
            /
            {
              periodo.evaluadas
            }{" "}
            cumplidas
            {periodo.tarde >
              0 &&
              ` · ${periodo.tarde} tarde`}
          </p>
        </div>

        <p className="text-sm font-bold text-slate-800">
          {periodo.adherencia !==
          null
            ? `${periodo.adherencia}%`
            : "—"}
        </p>
      </div>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barColor(
            periodo.adherencia
          )}`}
          style={{
            width: `${
              periodo.adherencia ??
              0
            }%`,
          }}
        />
      </div>
    </div>
  );
}

function barColor(
  valor:
    | number
    | null
) {
  if (valor === null) {
    return "bg-slate-200";
  }

  if (valor >= 90) {
    return "bg-emerald-500";
  }

  if (valor >= 75) {
    return "bg-blue-500";
  }

  if (valor >= 60) {
    return "bg-amber-500";
  }

  return "bg-red-500";
}