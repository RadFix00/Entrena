import {
  notFound,
} from "next/navigation";

import prisma from "@/lib/prisma";
import { requireClient } from "@/lib/auth-user";

import WorkoutRunner from "@/components/client/WorkoutRunner";

export default async function EntrenamientoPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const currentUser =
    await requireClient();

  const { id } =
    await params;

  /*
   * Importantísimo:
   *
   * id de sesión
   * +
   * clientId autenticado
   */
  const sesion =
    await prisma.workoutSession.findFirst({
      where: {
        id,

        clientId:
          currentUser.id,
      },

      select: {
        id: true,
        planName: true,
        weekNumber: true,
        dayName: true,
        status: true,
        startedAt: true,
        completedAt: true,
        notes: true,

        exercises: {
          orderBy: {
            position: "asc",
          },

          select: {
            id: true,
            position: true,
            exerciseName: true,
            muscleGroup: true,

            prescribedSets:
              true,

            prescribedReps:
              true,

            prescribedLoadKg:
              true,

            prescribedRestSeconds:
              true,

            prescribedNotes:
              true,

            notes: true,

            sets: {
              orderBy: {
                setNumber:
                  "asc",
              },

              select: {
                id: true,
                setNumber: true,
                reps: true,
                loadKg: true,
                completed: true,
                notes: true,
              },
            },
          },
        },
      },
    });

  if (!sesion) {
    notFound();
  }

  /*
   * Convertimos Decimal/Date a valores
   * sencillos para pasarlos al Client
   * Component.
   */
  const workout = {
    id:
      sesion.id,

    planName:
      sesion.planName,

    weekNumber:
      sesion.weekNumber,

    dayName:
      sesion.dayName,

    status:
      sesion.status,

    startedAt:
      sesion.startedAt.toISOString(),

    completedAt:
      sesion.completedAt
        ?.toISOString() ??
      null,

    notes:
      sesion.notes ??
      "",

    exercises:
      sesion.exercises.map(
        (ejercicio) => ({
          id:
            ejercicio.id,

          position:
            ejercicio.position,

          exerciseName:
            ejercicio.exerciseName,

          muscleGroup:
            ejercicio.muscleGroup,

          prescribedSets:
            ejercicio.prescribedSets,

          prescribedReps:
            ejercicio.prescribedReps,

          prescribedLoadKg:
            ejercicio
              .prescribedLoadKg
              ?.toString() ??
            "",

          prescribedRestSeconds:
            ejercicio
              .prescribedRestSeconds,

          prescribedNotes:
            ejercicio
              .prescribedNotes ??
            "",

          notes:
            ejercicio.notes ??
            "",

          sets:
            ejercicio.sets.map(
              (serie) => ({
                id:
                  serie.id,

                setNumber:
                  serie.setNumber,

                reps:
                  serie.reps !=
                  null
                    ? String(
                        serie.reps
                      )
                    : "",

                loadKg:
                  serie.loadKg !=
                  null
                    ? serie.loadKg.toString()
                    : "",

                completed:
                  serie.completed,

                notes:
                  serie.notes ??
                  "",
              })
            ),
        })
      ),
  };

  return (
    <WorkoutRunner
      initialWorkout={
        workout
      }
    />
  );
}