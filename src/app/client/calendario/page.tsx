import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
} from "lucide-react";

import prisma from "@/lib/prisma";

import {
  requireClient,
} from "@/lib/auth-user";

import {
  calcularAdherencia,
} from "@/lib/adherence";

import {
  calcularAnaliticaAdherencia,
} from "@/lib/adherence-analytics";

import ClientTrainingCalendar from "@/components/client/ClientTrainingCalendar";

import type {
  ClientCalendarDayUI,
} from "@/components/client/ClientTrainingCalendar";

/*
 * ============================================================
 * FECHA ACTUAL BOGOTÁ
 * ============================================================
 */

function fechaBogotaKey(
  date = new Date()
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Bogota",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      date
    );

  const year =
    partes.find(
      (parte) =>
        parte.type ===
        "year"
    )?.value;

  const month =
    partes.find(
      (parte) =>
        parte.type ===
        "month"
    )?.value;

  const day =
    partes.find(
      (parte) =>
        parte.type ===
        "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

/*
 * ============================================================
 * PÁGINA
 * ============================================================
 */

export default async function ClientCalendarPage() {
  /*
   * ============================================
   * CLIENTE AUTENTICADO
   * ============================================
   */

  const currentUser =
    await requireClient();

  const cliente =
    await prisma.user.findUnique({
      where: {
        id:
          currentUser.id,
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (!cliente) {
    return null;
  }

  /*
   * ============================================
   * PLAN ACTIVO
   * ============================================
   */

  const plan =
    await prisma.trainingPlan.findFirst({
      where: {
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

                name: true,

                description:
                  true,

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
   * SIN PLAN
   * ============================================
   */

  if (!plan) {
    return (
      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft
            size={17}
          />

          Volver al dashboard
        </Link>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <CalendarDays
            size={34}
            className="mx-auto text-slate-300"
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Todavía no tienes un calendario activo
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Cuando tu entrenador active y programe tu plan, aquí aparecerán tus próximos entrenamientos.
          </p>
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
   * PREPARAR DÍAS
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
   * ADHERENCIA
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
   * ANALÍTICA
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
   * DATOS VISUALES
   * ============================================
   */

  const infoDias =
    new Map(
      plan.weeks.flatMap(
        (semana) =>
          semana.days.map(
            (dia) => [
              dia.id,
              {
                name:
                  dia.name,

                description:
                  dia.description,
              },
            ] as const
          )
      )
    );

  const dias: ClientCalendarDayUI[] =
    adherencia.detalle.map(
      (dia) => {
        const informacion =
          infoDias.get(
            dia.workoutDayId
          );

        return {
          id:
            dia.workoutDayId,

          name:
            informacion
              ?.name ??
            `Sesión ${dia.position}`,

          description:
            informacion
              ?.description ??
            null,

          weekNumber:
            dia.weekNumber,

          position:
            dia.position,

          scheduledDate:
            dia.scheduledDate
              ? dia.scheduledDate
                  .toISOString()
                  .slice(
                    0,
                    10
                  )
              : null,

          completedAt:
            dia.completedAt
              ? dia.completedAt.toISOString()
              : null,

          status:
            dia.status,
        };
      }
    );

  /*
   * ============================================
   * UI
   * ============================================
   */

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/client/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver al dashboard
      </Link>

      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CalendarDays
            size={23}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Mi programación
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Calendario de entrenamiento
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {cliente.name}
            {" · "}
            {plan.name}
          </p>
        </div>
      </header>

      <ClientTrainingCalendar
        planName={
          plan.name
        }
        todayKey={
          fechaBogotaKey()
        }
        dias={
          dias
        }
        analytics={
          analytics
        }
      />
    </main>
  );
}