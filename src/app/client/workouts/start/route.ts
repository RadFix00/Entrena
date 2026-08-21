import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiClient } from "@/lib/api-auth";

const startWorkoutSchema = z.object({
  workoutDayId: z
    .string()
    .min(1),
});

export async function POST(
  request: Request
) {
  /*
   * =============================================
   * 1. CLIENTE AUTENTICADO
   * =============================================
   */

  const acceso =
    await requireApiClient();

  if (!acceso.ok) {
    return acceso.response;
  }

  const clientId =
    acceso.user.id;

  /*
   * =============================================
   * 2. BODY
   * =============================================
   */

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return Response.json(
      {
        error:
          "Los datos enviados no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  const resultado =
    startWorkoutSchema.safeParse(
      body
    );

  if (!resultado.success) {
    return Response.json(
      {
        error:
          "Debes seleccionar un entrenamiento válido.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    workoutDayId,
  } = resultado.data;

  /*
   * =============================================
   * 3. COMPROBAR QUE EL DÍA PERTENECE
   *    AL PLAN ACTIVO DEL CLIENTE
   * =============================================
   */

  const dia =
    await prisma.workoutDay.findFirst({
      where: {
        id: workoutDayId,

        week: {
          plan: {
            clientId,

            status:
              "ACTIVE",
          },
        },
      },

      select: {
        id: true,
        name: true,
        description: true,
        position: true,

        week: {
          select: {
            number: true,

            plan: {
              select: {
                id: true,
                name: true,
                trainerId: true,
                clientId: true,
                status: true,
              },
            },
          },
        },

        exercises: {
          orderBy: {
            position: "asc",
          },

          select: {
            position: true,
            sets: true,
            reps: true,
            loadKg: true,
            restSeconds: true,
            notes: true,

            exercise: {
              select: {
                id: true,
                name: true,
                muscleGroup: true,
              },
            },
          },
        },
      },
    });

  if (!dia) {
    return Response.json(
      {
        error:
          "El entrenamiento no pertenece a tu plan activo.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    dia.exercises.length === 0
  ) {
    return Response.json(
      {
        error:
          "Este entrenamiento no tiene ejercicios configurados.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * =============================================
   * 4. SOLO UNA SESIÓN EN PROGRESO
   * =============================================
   *
   * Si el cliente refresca o vuelve a
   * pulsar el botón no creamos duplicados.
   */

  const sesionExistente =
    await prisma.workoutSession.findFirst({
      where: {
        clientId,

        status:
          "IN_PROGRESS",
      },

      orderBy: {
        startedAt:
          "desc",
      },

      select: {
        id: true,
      },
    });

  if (sesionExistente) {
    return Response.json({
      ok: true,

      sessionId:
        sesionExistente.id,

      existing: true,
    });
  }

  /*
   * =============================================
   * 5. CREAR SNAPSHOT DEL ENTRENAMIENTO
   * =============================================
   *
   * Importante:
   *
   * SetLog representa lo REAL.
   *
   * Por eso NO precargamos reps/carga
   * reales. Esos campos comienzan null.
   *
   * La prescripción vive en ExerciseLog.
   */

  try {
    const sesion =
      await prisma.workoutSession.create({
        data: {
          trainerId:
            dia.week.plan
              .trainerId,

          clientId,

          planId:
            dia.week.plan.id,

          workoutDayId:
            dia.id,

          planName:
            dia.week.plan.name,

          weekNumber:
            dia.week.number,

          dayName:
            dia.name,

          dayPosition:
            dia.position,

          status:
            "IN_PROGRESS",

          exercises: {
            create:
              dia.exercises.map(
                (asignacion) => ({
                  exerciseId:
                    asignacion
                      .exercise.id,

                  position:
                    asignacion
                      .position,

                  exerciseName:
                    asignacion
                      .exercise.name,

                  muscleGroup:
                    asignacion
                      .exercise
                      .muscleGroup,

                  prescribedSets:
                    asignacion.sets,

                  prescribedReps:
                    asignacion.reps,

                  prescribedLoadKg:
                    asignacion.loadKg,

                  prescribedRestSeconds:
                    asignacion
                      .restSeconds,

                  prescribedNotes:
                    asignacion.notes,

                  sets: {
                    create:
                      Array.from(
                        {
                          length:
                            asignacion.sets,
                        },
                        (
                          _,
                          index
                        ) => ({
                          setNumber:
                            index +
                            1,

                          completed:
                            false,
                        })
                      ),
                  },
                })
              ),
          },
        },

        select: {
          id: true,
        },
      });

    return Response.json(
      {
        ok: true,

        sessionId:
          sesion.id,

        existing:
          false,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error iniciando entrenamiento:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo iniciar el entrenamiento.",
      },
      {
        status: 500,
      }
    );
  }
}