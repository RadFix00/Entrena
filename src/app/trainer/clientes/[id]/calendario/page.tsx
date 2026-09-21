import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  Dumbbell,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import prisma from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth-user";
import { fechaParaInput } from "@/lib/format";

import TrainerCalendarClient from "@/components/trainer/TrainerCalendarClient";

import type {
  CalendarDayUI,
} from "@/components/trainer/TrainerCalendarClient";

/*
 * ============================================================
 * PÁGINA
 * ============================================================
 */

export default async function CalendarioClientePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const trainer =
    await requireTrainer();

  const {
    id: clientId,
  } = await params;

  /*
   * ============================================
   * 1. COMPROBAR CLIENTE
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
   * 2. PLANES DISPONIBLES
   * ============================================
   *
   * Preferencia:
   *
   * ACTIVE
   * ↓
   * DRAFT más reciente
   */

  const candidatos =
    await prisma.trainingPlan.findMany({
      where: {
        trainerId:
          trainer.id,

        clientId:
          cliente.id,

        status: {
          in: [
            "ACTIVE",
            "DRAFT",
          ],
        },
      },

      orderBy: {
        updatedAt:
          "desc",
      },

      select: {
        id: true,
        name: true,
        status: true,
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
                name: true,
                description: true,
                position: true,
                scheduledDate: true,
              },
            },
          },
        },
      },
    });

  const plan =
    candidatos.find(
      (item) =>
        item.status ===
        "ACTIVE"
    ) ??
    candidatos[0] ??
    null;

  /*
   * ============================================
   * SIN PLAN
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
          <Dumbbell
            size={32}
            className="mx-auto text-slate-300"
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Este cliente no tiene un plan disponible
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Crea o activa un plan antes de programar su calendario.
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
   * 3. SESIONES COMPLETADAS DEL PLAN
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
   * 4. MAPAS DE SESIONES
   * ============================================
   */

  const sesionesPorId =
    new Map<
      string,
      (typeof sesiones)[number]
    >();

  const sesionesPorPosicion =
    new Map<
      string,
      (typeof sesiones)[number]
    >();

  for (
    const sesion of
      sesiones
  ) {
    if (
      sesion.workoutDayId
    ) {
      sesionesPorId.set(
        sesion.workoutDayId,
        sesion
      );
    }

    if (
      sesion.dayPosition !==
      null
    ) {
      sesionesPorPosicion.set(
        `${sesion.weekNumber}:${sesion.dayPosition}`,
        sesion
      );
    }
  }

  /*
   * ============================================
   * 5. SERIALIZAR DÍAS
   * ============================================
   */

  const dias: CalendarDayUI[] =
    plan.weeks.flatMap(
      (semana) =>
        semana.days.map(
          (dia) => {
            const sesion =
              sesionesPorId.get(
                dia.id
              ) ??
              sesionesPorPosicion.get(
                `${semana.number}:${dia.position}`
              ) ??
              null;

            const completedAt =
              sesion
                ? sesion.completedAt ??
                  sesion.startedAt
                : null;

            return {
              id:
                dia.id,

              name:
                dia.name,

              description:
                dia.description,

              weekNumber:
                semana.number,

              position:
                dia.position,

              scheduledDate:
                fechaParaInput(
                  dia.scheduledDate
                ),

              completedAt:
                completedAt
                  ? completedAt.toISOString()
                  : null,
            };
          }
        )
    );

  /*
   * ============================================
   * 6. UI
   * ============================================
   */

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <Link
        href={`/trainer/clientes/${cliente.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver al cliente
      </Link>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CalendarDays
              size={23}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Programación
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
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
            plan.status ===
            "ACTIVE"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {plan.status ===
          "ACTIVE"
            ? "PLAN ACTIVO"
            : "BORRADOR"}
        </span>
      </header>

      <TrainerCalendarClient
        clientId={
          cliente.id
        }
        clientName={
          cliente.name
        }
        plan={{
          id:
            plan.id,

          name:
            plan.name,

          status:
            plan.status,

          startDate:
            fechaParaInput(
              plan.startDate
            ),
        }}
        dias={
          dias
        }
      />
    </main>
  );
}