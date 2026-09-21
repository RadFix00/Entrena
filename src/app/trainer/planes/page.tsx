import {
  Archive,
  CheckCircle2,
  FileEdit,
  Layers3,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth-user";
import { calcularProgresoPlan } from "@/lib/training-metrics";
import { formatearFecha } from "@/lib/format";

import PlanesClient from "@/components/trainer/PlanesClient";

import type {
  PlanUI,
} from "@/components/trainer/PlanesClient";

/*
 * ============================================================
 * PÁGINA GLOBAL DE PLANES
 * /trainer/planes
 * ============================================================
 */

export default async function PlanesPage() {
  /*
   * ==========================================================
   * 1. ENTRENADOR AUTENTICADO
   * ==========================================================
   */

  const trainer =
    await requireTrainer();

  const relacionesClientes =
    await prisma.trainerClient.findMany({
      where: {
        trainerId:
          trainer.id,
      },

      orderBy: {
        joinedAt:
          "desc",
      },

      select: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

  const clientesDestino =
    relacionesClientes.map(
      (relacion) => ({
        id:
          relacion.client.id,

        nombre:
          relacion.client.name,

        email:
          relacion.client.email,
      })
    );

  /*
   * ==========================================================
   * 2. BUSCAR TODOS LOS PLANES DEL ENTRENADOR
   * ==========================================================
   */

  const planesDB =
    await prisma.trainingPlan.findMany({
      where: {
        trainerId:
          trainer.id,
      },

      orderBy: {
        updatedAt:
          "desc",
      },

      select: {
        id: true,

        clientId:
          true,

        name: true,

        objective:
          true,

        status:
          true,

        updatedAt:
          true,

        /*
         * Cliente al que pertenece
         * el plan.
         */
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        /*
         * Estructura del plan.
         *
         * Solamente necesitamos:
         *
         * semana
         * posición del día
         *
         * para calcular el progreso.
         */
        weeks: {
          orderBy: {
            number:
              "asc",
          },

          select: {
            number:
              true,

            days: {
              orderBy: {
                position:
                  "asc",
              },

              select: {
                position:
                  true,
              },
            },
          },
        },
      },
    });

  /*
   * ==========================================================
   * 3. IDS DE PLANES
   * ==========================================================
   */

  const planIds =
    planesDB.map(
      (plan) =>
        plan.id
    );

  /*
   * ==========================================================
   * 4. SESIONES COMPLETADAS DE ESOS PLANES
   * ==========================================================
   *
   * WorkoutSession conserva:
   *
   * planId
   * weekNumber
   * dayPosition
   *
   * así podemos calcular cuántos días
   * del plan ya fueron completados.
   */

  const sesionesCompletadas =
    planIds.length > 0
      ? await prisma.workoutSession.findMany({
          where: {
            trainerId:
              trainer.id,

            status:
              "COMPLETED",

            planId: {
              in:
                planIds,
            },
          },

          select: {
            planId:
              true,

            weekNumber:
              true,

            dayPosition:
              true,
          },
        })
      : [];

  /*
   * ==========================================================
   * 5. AGRUPAR SESIONES POR PLAN
   * ==========================================================
   *
   * Resultado:
   *
   * planA => [
   *   { weekNumber: 1, dayPosition: 1 },
   *   { weekNumber: 1, dayPosition: 2 }
   * ]
   *
   * planB => [...]
   */

  const sesionesPorPlan =
    new Map<
      string,
      {
        weekNumber: number;

        dayPosition:
          | number
          | null;
      }[]
    >();

  for (
    const sesion of
      sesionesCompletadas
  ) {
    /*
     * planId puede ser null porque
     * WorkoutSession conserva sesiones
     * históricas incluso si el plan
     * desaparece.
     */
    if (!sesion.planId) {
      continue;
    }

    const existentes =
      sesionesPorPlan.get(
        sesion.planId
      ) ?? [];

    existentes.push({
      weekNumber:
        sesion.weekNumber,

      dayPosition:
        sesion.dayPosition,
    });

    sesionesPorPlan.set(
      sesion.planId,
      existentes
    );
  }

  /*
   * ==========================================================
   * 6. CONVERTIR LOS PLANES DE PRISMA A PLANUI
   * ==========================================================
   */

  const planes =
    planesDB.map(
      (plan): PlanUI => {
        const sesionesDelPlan =
          sesionesPorPlan.get(
            plan.id
          ) ?? [];

        /*
         * Utilizamos el mismo helper
         * que ya usamos en otras
         * pantallas de Entrena.
         */
        const progreso =
          calcularProgresoPlan(
            plan.weeks,
            sesionesDelPlan
          );

        return {
          id:
            plan.id,

          clientId:
            plan.clientId,

          nombre:
            plan.name,

          objetivo:
            plan.objective,

          /*
           * plan.status viene directamente
           * del enum PlanStatus generado
           * por Prisma.
           */
          estado:
            plan.status,

          clienteNombre:
            plan.client.name,

          clienteEmail:
            plan.client.email,

          semanas:
            plan.weeks.length,

          sesiones:
            progreso.totalSesiones,

          sesionesCompletadas:
            progreso.sesionesCompletadas,

          progreso:
            progreso.porcentaje,

          actualizado:
            formatearFecha(
              plan.updatedAt
            ),
        };
      }
    );

  /*
   * ==========================================================
   * 7. MÉTRICAS GENERALES
   * ==========================================================
   */

  const activos =
    planes.filter(
      (plan) =>
        plan.estado ===
        "ACTIVE"
    ).length;

  const borradores =
    planes.filter(
      (plan) =>
        plan.estado ===
        "DRAFT"
    ).length;

  const archivados =
    planes.filter(
      (plan) =>
        plan.estado ===
        "ARCHIVED"
    ).length;

  /*
   * ==========================================================
   * 8. RENDER
   * ==========================================================
   */

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <header>
        <p className="text-sm font-semibold text-emerald-700">
          Entrenamiento
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Planes
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Gestiona los programas de
          entrenamiento de todos tus
          clientes desde un solo lugar.
        </p>
      </header>

      {/* ===================================== */}
      {/* MÉTRICAS */}
      {/* ===================================== */}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta
          titulo="Total"
          valor={
            planes.length
          }
          icono={
            <Layers3
              size={20}
            />
          }
        />

        <Tarjeta
          titulo="Activos"
          valor={
            activos
          }
          icono={
            <CheckCircle2
              size={20}
            />
          }
        />

        <Tarjeta
          titulo="Borradores"
          valor={
            borradores
          }
          icono={
            <FileEdit
              size={20}
            />
          }
        />

        <Tarjeta
          titulo="Archivados"
          valor={
            archivados
          }
          icono={
            <Archive
              size={20}
            />
          }
        />
      </section>

      {/* ===================================== */}
      {/* LISTADO + FILTROS */}
      {/* ===================================== */}

      <PlanesClient
        planes={planes}
        clientes={
          clientesDestino
        }
      />
    </main>
  );
}

/*
 * ============================================================
 * TARJETA MÉTRICA
 * ============================================================
 */

function Tarjeta({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: number;
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

      <p className="mt-1 text-3xl font-bold text-slate-900">
        {valor}
      </p>
    </div>
  );
}