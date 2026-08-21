"use client";

import Link from "next/link";

import CopiarPlanClienteButton from "@/components/trainer/CopiarPlanClienteButton";

import type {
  ClienteDestino,
} from "@/components/trainer/CopiarPlanClienteButton";

import DuplicarPlanButton from "@/components/trainer/DuplicarPlanButton";

import {
  useMemo,
  useState,
} from "react";

import {
  Archive,
  ArrowRight,
  CheckCircle2,
  FileEdit,
  Loader2,
  RotateCcw,
  Search,
  UserRound,
  Zap,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import type {
  PlanStatus,
} from "@/generated/prisma/client";

type EstadoPlan =
  PlanStatus;

type AccionPlan =
  | "ACTIVATE"
  | "ARCHIVE"
  | "RESTORE_DRAFT";

export type PlanUI = {
  id: string;

  clientId:
    string;

  nombre:
    string;

  objetivo:
    | string
    | null;

  estado:
    EstadoPlan;

  clienteNombre:
    string;

  clienteEmail:
    string;

  semanas:
    number;

  sesiones:
    number;

  sesionesCompletadas:
    number;

  progreso:
    number;

  actualizado:
    string;
};

type Props = {
  planes:
    PlanUI[];

  clientes:
    ClienteDestino[];
};

type Filtro =
  | "ALL"
  | EstadoPlan;

export default function PlanesClient({
  planes,
  clientes,
}: Props) {
  const router =
    useRouter();

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtro,
    setFiltro,
  ] =
    useState<Filtro>(
      "ALL"
    );

  const [
    procesando,
    setProcesando,
  ] =
    useState<{
      planId: string;
      accion: AccionPlan;
    } | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState("");

  /*
   * ============================================
   * FILTROS
   * ============================================
   */

  const filtrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return planes.filter(
        (plan) => {
          const coincideEstado =
            filtro ===
              "ALL" ||
            plan.estado ===
              filtro;

          const coincideBusqueda =
            !texto ||
            plan.nombre
              .toLowerCase()
              .includes(
                texto
              ) ||
            plan.clienteNombre
              .toLowerCase()
              .includes(
                texto
              ) ||
            plan.clienteEmail
              .toLowerCase()
              .includes(
                texto
              );

          return (
            coincideEstado &&
            coincideBusqueda
          );
        }
      );
    }, [
      planes,
      busqueda,
      filtro,
    ]);

  /*
   * ============================================
   * CONTADORES
   * ============================================
   */

  const cantidades = {
    ALL:
      planes.length,

    ACTIVE:
      planes.filter(
        (plan) =>
          plan.estado ===
          "ACTIVE"
      ).length,

    DRAFT:
      planes.filter(
        (plan) =>
          plan.estado ===
          "DRAFT"
      ).length,

    ARCHIVED:
      planes.filter(
        (plan) =>
          plan.estado ===
          "ARCHIVED"
      ).length,
  };

  /*
   * ============================================
   * CAMBIAR ESTADO
   * ============================================
   */

  async function cambiarEstado(
    plan:
      PlanUI,
    accion:
      AccionPlan
  ) {
    /*
     * Confirmación para acciones
     * importantes.
     */

    if (
      accion ===
      "ACTIVATE"
    ) {
      const confirmar =
        window.confirm(
          `¿Activar "${plan.nombre}"?\n\n` +
            "Si este cliente ya tiene otro plan activo, ese plan será archivado."
        );

      if (!confirmar) {
        return;
      }
    }

    if (
      accion ===
      "ARCHIVE"
    ) {
      const confirmar =
        window.confirm(
          `¿Archivar "${plan.nombre}"?\n\n` +
            "El cliente dejará de verlo como plan activo."
        );

      if (!confirmar) {
        return;
      }
    }

    try {
      setError("");

      setProcesando({
        planId:
          plan.id,

        accion,
      });

      const response =
        await fetch(
          `/api/trainer/planes/${plan.id}/estado`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                accion,
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
            "No se pudo actualizar el plan."
        );
      }

      /*
       * Refrescamos el Server Component.
       *
       * Así los estados, contadores
       * y porcentajes vienen nuevamente
       * desde PostgreSQL.
       */
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el plan."
      );
    } finally {
      setProcesando(
        null
      );
    }
  }

  return (
    <>
      {/* ====================================== */}
      {/* FILTROS */}
      {/* ====================================== */}

      <div className="mt-7 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <BotonFiltro
            activo={
              filtro ===
              "ALL"
            }
            onClick={() =>
              setFiltro(
                "ALL"
              )
            }
          >
            Todos{" "}
            <span className="opacity-60">
              (
              {
                cantidades.ALL
              }
              )
            </span>
          </BotonFiltro>

          <BotonFiltro
            activo={
              filtro ===
              "ACTIVE"
            }
            onClick={() =>
              setFiltro(
                "ACTIVE"
              )
            }
          >
            Activos{" "}
            <span className="opacity-60">
              (
              {
                cantidades.ACTIVE
              }
              )
            </span>
          </BotonFiltro>

          <BotonFiltro
            activo={
              filtro ===
              "DRAFT"
            }
            onClick={() =>
              setFiltro(
                "DRAFT"
              )
            }
          >
            Borradores{" "}
            <span className="opacity-60">
              (
              {
                cantidades.DRAFT
              }
              )
            </span>
          </BotonFiltro>

          <BotonFiltro
            activo={
              filtro ===
              "ARCHIVED"
            }
            onClick={() =>
              setFiltro(
                "ARCHIVED"
              )
            }
          >
            Archivados{" "}
            <span className="opacity-60">
              (
              {
                cantidades.ARCHIVED
              }
              )
            </span>
          </BotonFiltro>
        </div>

        {/* BUSCADOR */}

        <div className="relative max-w-lg">
          <Search
            size={18}
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
            placeholder="Buscar plan o cliente..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {/* ====================================== */}
      {/* ERROR */}
      {/* ====================================== */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ====================================== */}
      {/* RESULTADOS */}
      {/* ====================================== */}

      {filtrados.length ===
      0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <FileEdit
            size={30}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 font-bold text-slate-800">
            No encontramos planes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Cambia el filtro o la búsqueda.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {filtrados.map(
            (plan) => (
              <PlanCard
                key={
                  plan.id
                }
                plan={
                  plan
                }
                clientes={
                  clientes
                }
                procesando={
                  procesando
                }
                cambiarEstado={
                  cambiarEstado
                }
              />
            )
          )}
        </div>
      )}
    </>
  );
}

/*
 * ============================================================
 * PLAN CARD
 * ============================================================
 */

function PlanCard({
  plan,
  clientes,
  procesando,
  cambiarEstado,
}: {
  plan:
    PlanUI;

  clientes:
    ClienteDestino[];

  procesando: {
    planId: string;
    accion: AccionPlan;
  } | null;

  cambiarEstado: (
    plan: PlanUI,
    accion: AccionPlan
  ) => Promise<void>;
}) {
  const estaProcesando =
    procesando?.planId ===
    plan.id;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <Estado
            estado={
              plan.estado
            }
          />

          <h2 className="mt-3 truncate text-xl font-bold text-slate-900">
            {
              plan.nombre
            }
          </h2>

          {plan.objetivo && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {
                plan.objetivo
              }
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-right">
          <p className="text-xs text-slate-400">
            Actualizado
          </p>

          <p className="mt-0.5 text-xs font-semibold text-slate-700">
            {
              plan.actualizado
            }
          </p>
        </div>
      </div>

      {/* CLIENTE */}

      <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <UserRound
            size={18}
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">
            {
              plan.clienteNombre
            }
          </p>

          <p className="truncate text-xs text-slate-400">
            {
              plan.clienteEmail
            }
          </p>
        </div>
      </div>

      {/* MÉTRICAS */}

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metrica
          label="Semanas"
          valor={String(
            plan.semanas
          )}
        />

        <Metrica
          label="Sesiones"
          valor={String(
            plan.sesiones
          )}
        />

        <Metrica
          label="Completadas"
          valor={`${plan.sesionesCompletadas}/${plan.sesiones}`}
        />
      </div>

      {/* PROGRESO */}

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Progreso
          </p>

          <p className="text-sm font-bold text-slate-800">
            {
              plan.progreso
            }
            %
          </p>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${plan.progreso}%`,
            }}
          />
        </div>
      </div>

      {/* ====================================== */}
      {/* ACCIONES */}
      {/* ====================================== */}

      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {/* VER CLIENTE */}

          <Link
            href={`/trainer/clientes/${plan.clientId}`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ver cliente
          </Link>
          
          <DuplicarPlanButton
            planId={
                plan.id
            }
            planNombre={
                plan.nombre
            }
            
            />

          {/* ================================== */}
          {/* ACTIVE */}
          {/* ================================== */}

          {plan.estado ===
            "ACTIVE" && (
            <>
              <Link
                href={`/trainer/clientes/${plan.clientId}/plan`}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Gestionar

                <ArrowRight
                  size={16}
                />
              </Link>

              <button
                type="button"
                disabled={
                  estaProcesando
                }
                onClick={() =>
                  cambiarEstado(
                    plan,
                    "ARCHIVE"
                  )
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {procesando?.planId ===
                  plan.id &&
                procesando.accion ===
                  "ARCHIVE" ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Archive
                    size={16}
                  />
                )}

                Archivar
              </button>
            </>
          )}

          {/* ================================== */}
          {/* DRAFT */}
          {/* ================================== */}

          {plan.estado ===
            "DRAFT" && (
            <>
              <Link
                href={`/trainer/clientes/${plan.clientId}/plan`}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <FileEdit
                  size={16}
                />

                Editar
              </Link>

              <button
                type="button"
                disabled={
                  estaProcesando
                }
                onClick={() =>
                  cambiarEstado(
                    plan,
                    "ACTIVATE"
                  )
                }
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {procesando?.planId ===
                  plan.id &&
                procesando.accion ===
                  "ACTIVATE" ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Zap
                    size={16}
                  />
                )}

                Activar
              </button>
            </>
          )}

          {/* ================================== */}
          {/* ARCHIVED */}
          {/* ================================== */}

          {plan.estado ===
            "ARCHIVED" && (
            <button
              type="button"
              disabled={
                estaProcesando
              }
              onClick={() =>
                cambiarEstado(
                  plan,
                  "RESTORE_DRAFT"
                )
              }
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesando?.planId ===
                plan.id &&
              procesando.accion ===
                "RESTORE_DRAFT" ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <RotateCcw
                  size={16}
                />
              )}

              Reactivar como borrador
            </button>
          )}

          
        </div>
      </div>
    </article>
  );
}

/*
 * ============================================================
 * ESTADO
 * ============================================================
 */

function Estado({
  estado,
}: {
  estado:
    EstadoPlan;
}) {
  if (
    estado ===
    "ACTIVE"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2
          size={13}
        />

        ACTIVO
      </span>
    );
  }

  if (
    estado ===
    "DRAFT"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
        <FileEdit
          size={13}
        />

        BORRADOR
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
      <Archive
        size={13}
      />

      ARCHIVADO
    </span>
  );
}

/*
 * ============================================================
 * MÉTRICA
 * ============================================================
 */

function Metrica({
  label,
  valor,
}: {
  label:
    string;

  valor:
    string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-900">
        {valor}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * FILTRO
 * ============================================================
 */

function BotonFiltro({
  activo,
  onClick,
  children,
}: {
  activo:
    boolean;

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
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        activo
          ? "bg-slate-900 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}