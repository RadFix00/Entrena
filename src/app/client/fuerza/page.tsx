import Link from "next/link";

import {
  ArrowLeft,
  Dumbbell,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { requireClient } from "@/lib/auth-user";

import ClientStrengthProgress from "@/app/client/ClientStrengthProgress";

import type {
  ClientStrengthExercise,
} from "@/app/client/ClientStrengthProgress";

function decimalANumero(
  valor:
    | {
        toString(): string;
      }
    | null
    | undefined
) {
  if (valor == null) {
    return null;
  }

  const numero =
    Number(valor.toString());

  return Number.isFinite(numero)
    ? numero
    : null;
}

function normalizarNombre(
  nombre: string
) {
  return nombre
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export default async function ClientStrengthPage() {
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
        id: currentUser.id,
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
   * SESIONES COMPLETADAS
   * ============================================
   */

  const sesiones =
    await prisma.workoutSession.findMany({
      where: {
        clientId:
          cliente.id,

        status:
          "COMPLETED",
      },

      orderBy: [
        {
          completedAt:
            "asc",
        },
        {
          startedAt:
            "asc",
        },
      ],

      select: {
        id: true,

        dayName:
          true,

        startedAt:
          true,

        completedAt:
          true,

        exercises: {
          orderBy: {
            position:
              "asc",
          },

          select: {
            exerciseId:
              true,

            exerciseName:
              true,

            muscleGroup:
              true,

            sets: {
              where: {
                completed:
                  true,
              },

              orderBy: {
                setNumber:
                  "asc",
              },

              select: {
                setNumber:
                  true,

                reps:
                  true,

                loadKg:
                  true,
              },
            },
          },
        },
      },
    });

  /*
   * ============================================
   * AGRUPAR POR EJERCICIO
   * ============================================
   */

  const mapa =
    new Map<
      string,
      ClientStrengthExercise
    >();

  for (const sesion of sesiones) {
    const fecha =
      sesion.completedAt ??
      sesion.startedAt;

    for (
      const log of
        sesion.exercises
    ) {
      if (
        log.sets.length === 0
      ) {
        continue;
      }

      const key =
        log.exerciseId
          ? `exercise:${log.exerciseId}`
          : `snapshot:${normalizarNombre(
              log.exerciseName
            )}`;

      let ejercicio =
        mapa.get(key);

      if (!ejercicio) {
        ejercicio = {
          key,

          nombre:
            log.exerciseName,

          grupoMuscular:
            log.muscleGroup,

          sesiones: [],
        };

        mapa.set(
          key,
          ejercicio
        );
      }

      const sets =
        log.sets.map(
          (set) => ({
            setNumber:
              set.setNumber,

            reps:
              set.reps,

            loadKg:
              decimalANumero(
                set.loadKg
              ),
          })
        );

      const existente =
        ejercicio.sesiones.find(
          (item) =>
            item.sessionId ===
            sesion.id
        );

      if (existente) {
        const inicio =
          existente.sets.length;

        existente.sets.push(
          ...sets.map(
            (set, index) => ({
              ...set,

              setNumber:
                inicio +
                index +
                1,
            })
          )
        );
      } else {
        ejercicio.sesiones.push({
          sessionId:
            sesion.id,

          fecha:
            fecha.toISOString(),

          dia:
            sesion.dayName,

          sets,
        });
      }
    }
  }

  const ejercicios =
    Array.from(
      mapa.values()
    ).sort(
      (a, b) =>
        a.nombre.localeCompare(
          b.nombre,
          "es"
        )
    );

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
          <Dumbbell
            size={23}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Mi rendimiento
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Progreso de fuerza
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Revisa tus récords y cómo ha evolucionado tu rendimiento.
          </p>
        </div>
      </header>

      <ClientStrengthProgress
        ejercicios={
          ejercicios
        }
      />
    </main>
  );
}