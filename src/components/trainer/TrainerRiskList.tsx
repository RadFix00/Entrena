"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Search,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";

import type {
  TrainerRiskClient,
  TrainerRiskOverview,
} from "@/lib/trainer-risk-data";

import type {
  ClientRiskLevel,
} from "@/lib/client-risk";

type Props = {
  data:
    TrainerRiskOverview;
};

type Filter =
  | "ATTENTION"
  | "ALL"
  | ClientRiskLevel;

export default function TrainerRiskList({
  data,
}: Props) {
  const [
    filtro,
    setFiltro,
  ] =
    useState<Filter>(
      "ATTENTION"
    );

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const filtrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return data.clientes.filter(
        (cliente) => {
          const coincideTexto =
            !texto ||
            cliente.clientName
              .toLowerCase()
              .includes(
                texto
              ) ||
            cliente.clientEmail
              .toLowerCase()
              .includes(
                texto
              ) ||
            cliente.planName
              ?.toLowerCase()
              .includes(
                texto
              );

          if (
            !coincideTexto
          ) {
            return false;
          }

          if (
            filtro ===
            "ALL"
          ) {
            return true;
          }

          if (
            filtro ===
            "ATTENTION"
          ) {
            return (
              cliente.level ===
                "CRITICAL" ||
              cliente.level ===
                "HIGH" ||
              cliente.level ===
                "MEDIUM"
            );
          }

          return (
            cliente.level ===
            filtro
          );
        }
      );
    }, [
      data.clientes,
      filtro,
      busqueda,
    ]);

  return (
    <div className="mt-7 space-y-6">
      {/* RESUMEN */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          titulo="Requieren atención"
          valor={
            data.resumen
              .requierenAtencion
          }
          detalle="Riesgo medio o superior"
          tipo="attention"
        />

        <SummaryCard
          titulo="Críticos"
          valor={
            data.resumen
              .critical
          }
          detalle="Intervención prioritaria"
          tipo="critical"
        />

        <SummaryCard
          titulo="Riesgo alto"
          valor={
            data.resumen.high
          }
          detalle="Necesitan seguimiento"
          tipo="high"
        />

        <SummaryCard
          titulo="Estables"
          valor={
            data.resumen.low
          }
          detalle="Sin señales importantes"
          tipo="stable"
        />
      </section>

      {/* FILTROS */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={
                filtro ===
                "ATTENTION"
              }
              onClick={() =>
                setFiltro(
                  "ATTENTION"
                )
              }
            >
              Atención
            </FilterButton>

            <FilterButton
              active={
                filtro ===
                "CRITICAL"
              }
              onClick={() =>
                setFiltro(
                  "CRITICAL"
                )
              }
            >
              Crítico
            </FilterButton>

            <FilterButton
              active={
                filtro ===
                "HIGH"
              }
              onClick={() =>
                setFiltro(
                  "HIGH"
                )
              }
            >
              Alto
            </FilterButton>

            <FilterButton
              active={
                filtro ===
                "MEDIUM"
              }
              onClick={() =>
                setFiltro(
                  "MEDIUM"
                )
              }
            >
              Medio
            </FilterButton>

            <FilterButton
              active={
                filtro ===
                "LOW"
              }
              onClick={() =>
                setFiltro(
                  "LOW"
                )
              }
            >
              Estables
            </FilterButton>

            <FilterButton
              active={
                filtro ===
                "NO_DATA"
              }
              onClick={() =>
                setFiltro(
                  "NO_DATA"
                )
              }
            >
              Sin datos
            </FilterButton>

            <FilterButton
              active={
                filtro ===
                "ALL"
              }
              onClick={() =>
                setFiltro(
                  "ALL"
                )
              }
            >
              Todos
            </FilterButton>
          </div>

          <div className="relative w-full xl:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={
                busqueda
              }
              onChange={(
                event
              ) =>
                setBusqueda(
                  event.target
                    .value
                )
              }
              placeholder="Buscar cliente..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* CLIENTES */}

      {filtrados.length ===
      0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <ShieldCheck
            size={34}
            className="mx-auto text-emerald-400"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No hay clientes en este filtro
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            No encontramos señales que coincidan con la selección actual.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          {filtrados.map(
            (cliente) => (
              <ClientRiskCard
                key={
                  cliente.clientId
                }
                cliente={
                  cliente
                }
              />
            )
          )}
        </section>
      )}
    </div>
  );
}

function ClientRiskCard({
  cliente,
}: {
  cliente:
    TrainerRiskClient;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {
                  cliente.clientName
                }
              </h2>

              <RiskBadge
                level={
                  cliente.level
                }
              />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {
                cliente.clientEmail
              }
            </p>

            {cliente.planName && (
              <p className="mt-1 text-xs text-slate-400">
                {
                  cliente.planName
                }
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniMetric
              label="Adherencia"
              value={
                cliente.adherence30 !==
                null
                  ? `${cliente.adherence30}%`
                  : "—"
              }
            />

            <MiniMetric
              label="Perdidas"
              value={String(
                cliente.missed30
              )}
            />

            <MiniMetric
              label="Racha perdida"
              value={String(
                cliente.consecutiveMissed
              )}
            />

            <MiniMetric
              label="Tendencia"
              value={
                cliente.trend30 !==
                null
                  ? `${
                      cliente.trend30 >
                      0
                        ? "+"
                        : ""
                    }${cliente.trend30} pp`
                  : "—"
              }
            />
          </div>
        </div>

        {/* MOTIVOS */}

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Diagnóstico automático
          </p>

          <div className="mt-3 space-y-2">
            {cliente.reasons.map(
              (
                reason,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="flex items-start gap-2"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />

                  <p className="text-sm leading-5 text-slate-600">
                    {reason}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* DATOS EXTRA */}

        {(cliente.today >
          0 ||
          cliente.nextScheduledDate ||
          cliente.overdueDays >
            0) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {cliente.today >
              0 && (
              <span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                {cliente.today} para hoy
              </span>
            )}

            {cliente.overdueDays >
              0 && (
              <span className="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-700">
                Hasta{" "}
                {
                  cliente.overdueDays
                }{" "}
                días de atraso
              </span>
            )}

            {cliente.nextScheduledDate && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">
                Próxima:{" "}
                {
                  cliente.nextScheduledDate
                }
              </span>
            )}
          </div>
        )}
      </div>

      {/* ACCIONES */}

      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
        <Link
          href={`/trainer/clientes/${cliente.clientId}`}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800"
        >
          Ver cliente
        </Link>

        {cliente.planId && (
          <>
            <Link
              href={`/trainer/clientes/${cliente.clientId}/calendario`}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <CalendarDays
                size={14}
              />

              Calendario
            </Link>

            <Link
              href={`/trainer/clientes/${cliente.clientId}/adherencia`}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <TrendingDown
                size={14}
              />

              Analítica
            </Link>
          </>
        )}
      </div>
    </article>
  );
}

function RiskBadge({
  level,
}: {
  level:
    ClientRiskLevel;
}) {
  const config = {
    CRITICAL: {
      label:
        "Crítico",

      className:
        "bg-red-100 text-red-700",

      icon:
        <AlertCircle
          size={13}
        />,
    },

    HIGH: {
      label:
        "Riesgo alto",

      className:
        "bg-orange-100 text-orange-700",

      icon:
        <AlertTriangle
          size={13}
        />,
    },

    MEDIUM: {
      label:
        "Atención",

      className:
        "bg-amber-100 text-amber-700",

      icon:
        <AlertTriangle
          size={13}
        />,
    },

    LOW: {
      label:
        "Estable",

      className:
        "bg-emerald-100 text-emerald-700",

      icon:
        <CheckCircle2
          size={13}
        />,
    },

    NO_DATA: {
      label:
        "Sin datos",

      className:
        "bg-slate-100 text-slate-500",

      icon:
        <CircleHelp
          size={13}
        />,
    },
  }[
    level
  ];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${config.className}`}
    >
      {config.icon}

      {config.label}
    </span>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-24 rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  titulo,
  valor,
  detalle,
  tipo,
}: {
  titulo: string;
  valor: number;
  detalle: string;

  tipo:
    | "attention"
    | "critical"
    | "high"
    | "stable";
}) {
  const icon =
    tipo ===
    "critical" ? (
      <AlertCircle
        size={20}
      />
    ) : tipo ===
      "high" ? (
      <AlertTriangle
        size={20}
      />
    ) : tipo ===
      "stable" ? (
      <CheckCircle2
        size={20}
      />
    ) : (
      <AlertTriangle
        size={20}
      />
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-3xl font-bold text-slate-900">
        {valor}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {detalle}
      </p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}