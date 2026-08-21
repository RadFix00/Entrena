import Link from "next/link";

import {
  ArrowLeft,
  Dumbbell,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import prisma from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth-user";

import StrengthProgressClient from "@/components/trainer/StrengthProgressClient";

import type {
  FuerzaEjercicioUI,
} from "@/components/trainer/StrengthProgressClient";

function decimalANumero(
  valor:
    | {
        toString(): string;
      }
    | null
    | undefined
) {
  if (
    valor == null
  ) {
    return null;
  }

  const numero =
    Number(
      valor.toString()
    );

  return Number.isFinite(
    numero
  )
    ? numero
    : null;
}

function normalizarNombre(
  nombre: string
) {
  return nombre
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}

export default async function FuerzaClientePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  /*
   * ============================================
   * 1. ENTRENADOR
   * ============================================
   */

  const trainer =
    await requireTrainer();

  const {
    id: clientId,
  } = await params;

  /*
   * ============================================
   * 2. COMPROBAR PROPIEDAD DEL CLIENTE
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
   * 3. SESIONES COMPLETADAS
   * ============================================
   *
   * Toda la información necesaria ya
   * existe dentro de:
   *
   * WorkoutSession
   *   -> ExerciseLog
   *      -> SetLog
   */

  const sesiones =
    await prisma.workoutSession.findMany({
      where: {
        clientId:
          cliente.id,

        trainerId:
          trainer.id,

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

                completed:
                  true,
              },
            },
          },
        },
      },
    });

  /*
   * ============================================
   * 4. AGRUPAR POR EJERCICIO
   * ============================================
   */

  const mapa =
    new Map<
      string,
      FuerzaEjercicioUI
    >();

  for (
    const sesion of
      sesiones
  ) {
    /*
     * Completed debería tener completedAt,
     * pero mantenemos startedAt como fallback
     * para no perder datos antiguos.
     */
    const fecha =
      sesion.completedAt ??
      sesion.startedAt;

    for (
      const ejercicioLog of
        sesion.exercises
    ) {
      /*
       * Ignoramos logs sin ninguna
       * serie realmente completada.
       */
      if (
        ejercicioLog.sets.length ===
        0
      ) {
        continue;
      }

      /*
       * Si exerciseId todavía existe,
       * lo usamos como identidad.
       *
       * Si el ejercicio fue eliminado
       * de la biblioteca, usamos el
       * nombre snapshot almacenado en
       * ExerciseLog.
       */
      const key =
        ejercicioLog.exerciseId
          ? `exercise:${ejercicioLog.exerciseId}`
          : `snapshot:${normalizarNombre(
              ejercicioLog.exerciseName
            )}`;

      let ejercicio =
        mapa.get(
          key
        );

      if (!ejercicio) {
        ejercicio = {
          key,

          exerciseId:
            ejercicioLog.exerciseId,

          nombre:
            ejercicioLog.exerciseName,

          grupoMuscular:
            ejercicioLog.muscleGroup,

          sesiones:
            [],
        };

        mapa.set(
          key,
          ejercicio
        );
      }

      const sets =
        ejercicioLog.sets.map(
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

      /*
       * Si el mismo ejercicio apareciera
       * dos veces dentro del mismo día,
       * agrupamos ambos ExerciseLog dentro
       * de la misma sesión.
       */

      const sesionExistente =
        ejercicio.sesiones.find(
          (item) =>
            item.sessionId ===
            sesion.id
        );

      if (
        sesionExistente
      ) {
        const inicio =
          sesionExistente.sets.length;

        sesionExistente.sets.push(
          ...sets.map(
            (
              set,
              index
            ) => ({
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

  /*
   * ============================================
   * 5. LISTA FINAL
   * ============================================
   */

  const ejercicios =
    Array.from(
      mapa.values()
    ).sort(
      (
        a,
        b
      ) =>
        a.nombre.localeCompare(
          b.nombre,
          "es"
        )
    );

  /*
   * ============================================
   * 6. RENDER
   * ============================================
   */

  return (
    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      {/* VOLVER */}

      <Link
        href={`/trainer/clientes/${cliente.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver al cliente
      </Link>

      {/* HEADER */}

      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Dumbbell
            size={23}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Rendimiento
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Progreso de fuerza
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {cliente.name}
            {" · "}
            {
              cliente.email
            }
          </p>
        </div>
      </header>

      {/* CONTENIDO */}

      <StrengthProgressClient
        ejercicios={
          ejercicios
        }
      />
    </main>
  );
}