import Link from "next/link";

import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import prisma from "@/lib/prisma";

import {
  requireTrainer,
} from "@/lib/auth-user";

import {
  calcularAdherencia,
} from "@/lib/adherence";

import {
  calcularAnaliticaAdherencia,
} from "@/lib/adherence-analytics";

import TrainerAdherenceAnalytics from "@/components/trainer/TrainerAdherenceAnalytics";

export default async function AdherenciaClientePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  /*
   * ============================================
   * ENTRENADOR
   * ============================================
   */

  const trainer =
    await requireTrainer();

  const {
    id: clientId,
  } = await params;

  /*
   * ============================================
   * CLIENTE
   * ============================================
   */

  const relacion =
    await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId:
            trainer.id,

          clientId,
        },
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

  if (!relacion) {
    notFound();
  }

  const cliente =
    relacion.client;

  /*
   * ============================================
   * PLAN ACTIVO
   * ============================================
   *
   * Para adherencia utilizamos únicamente
   * el plan ACTIVO.
   *
   * Un borrador todavía no representa
   * obligaciones reales para el cliente.
   */

  const plan =
    await prisma.trainingPlan.findFirst({
      where: {
        trainerId:
          trainer.id,

        clientId:
          cliente.id,

        status:
          "ACTIVE",
      },

      orderBy: {
        updatedAt:
          "desc",
      },

      select: {
        id: true,
        name: true,
        startDate: true,

        weeks: {
          orderBy: {
            number:
              "asc",
          },

          select: {
            number: true,

            days: {
              orderBy: {
                position:
                  "asc",
              },

              select: {
                id: true,

                position:
                  true,

                scheduledDate:
                  true,
              },
            },
          },
        },
      },
    });

  /*
   * ============================================
   * SIN PLAN ACTIVO
   * ============================================
   */

  if (!plan) {
    return (
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <Link
          href={`/trainer/clientes/${cliente.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft
            size={17}
          />

          Volver al cliente
        </Link>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <BarChart3
            size={34}
            className="mx-auto text-slate-300"
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            No hay un plan activo para analizar
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            La adherencia se calcula únicamente sobre un plan activo con fechas de entrenamiento programadas.
          </p>

          <Link
            href={`/trainer/clientes/${cliente.id}/plan`}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Gestionar plan
          </Link>
        </div>
      </main>
    );
  }

  /*
   * ============================================
   * SESIONES COMPLETADAS
   * ============================================
   */

  const sesiones =
    await prisma.workoutSession.findMany({
      where: {
        trainerId:
          trainer.id,

        clientId:
          cliente.id,

        planId:
          plan.id,

        status:
          "COMPLETED",
      },

      orderBy: {
        completedAt:
          "asc",
      },

      select: {
        workoutDayId:
          true,

        weekNumber:
          true,

        dayPosition:
          true,

        completedAt:
          true,

        startedAt:
          true,
      },
    });

  /*
   * ============================================
   * DATOS PARA MOTOR DE ADHERENCIA
   * ============================================
   */

  const diasPlan =
    plan.weeks.flatMap(
      (semana) =>
        semana.days.map(
          (dia) => ({
            id:
              dia.id,

            weekNumber:
              semana.number,

            position:
              dia.position,

            scheduledDate:
              dia.scheduledDate,
          })
        )
    );

  const sesionesCompletadas =
    sesiones.map(
      (sesion) => ({
        workoutDayId:
          sesion.workoutDayId,

        weekNumber:
          sesion.weekNumber,

        dayPosition:
          sesion.dayPosition,

        completedAt:
          sesion.completedAt ??
          sesion.startedAt,
      })
    );

  /*
   * ============================================
   * MOTOR BASE
   * ============================================
   */

  const adherencia =
    calcularAdherencia({
      dias:
        diasPlan,

      sesiones:
        sesionesCompletadas,

      timeZone:
        "America/Bogota",
    });

  /*
   * ============================================
   * ANALÍTICA AVANZADA
   * ============================================
   */

  const analytics =
    calcularAnaliticaAdherencia({
      detalle:
        adherencia.detalle,

      timeZone:
        "America/Bogota",
    });

  /*
   * ============================================
   * UI
   * ============================================
   */

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/trainer/clientes/${cliente.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft
            size={17}
          />

          Volver al cliente
        </Link>

        <Link
          href={`/trainer/clientes/${cliente.id}/calendario`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <CalendarDays
            size={16}
          />

          Ver calendario
        </Link>
      </div>

      <header className="mt-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <BarChart3
            size={23}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Seguimiento
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Analítica de adherencia
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {cliente.name}
            {" · "}
            {plan.name}
          </p>
        </div>
      </header>

      <TrainerAdherenceAnalytics
        clientName={
          cliente.name
        }
        planName={
          plan.name
        }
        analytics={
          analytics
        }
      />
    </main>
  );
}