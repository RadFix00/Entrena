import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";

/*
 * ============================================================
 * POST
 * /api/trainer/planes/[id]/duplicar
 * ============================================================
 *
 * Duplica:
 *
 * TrainingPlan
 *   └─ PlanWeek
 *       └─ WorkoutDay
 *           └─ WorkoutExercise
 *
 * NO duplica:
 *
 * WorkoutSession
 * ExerciseLog
 * SetLog
 *
 * La nueva copia siempre queda DRAFT.
 */

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  /*
   * ==========================================================
   * 1. ENTRENADOR AUTENTICADO
   * ==========================================================
   */

  const acceso =
    await requireApiTrainer();

  if (!acceso.ok) {
    return acceso.response;
  }

  const trainerId =
    acceso.user.id;

  const {
    id: planId,
  } = await params;

  if (!planId) {
    return Response.json(
      {
        error:
          "Plan inválido.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ==========================================================
   * 2. BUSCAR PLAN ORIGINAL
   * ==========================================================
   *
   * Importante:
   * trainerId forma parte del filtro.
   *
   * Un entrenador no puede duplicar
   * un plan que no le pertenece.
   */

  const original =
    await prisma.trainingPlan.findFirst({
      where: {
        id:
          planId,

        trainerId,
      },

      select: {
        id: true,

        clientId:
          true,

        name:
          true,

        objective:
          true,

        startDate:
          true,

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
                name:
                  true,

                description:
                  true,

                position:
                  true,

                exercises: {
                  orderBy: {
                    position:
                      "asc",
                  },

                  select: {
                    exerciseId:
                      true,

                    position:
                      true,

                    sets:
                      true,

                    reps:
                      true,

                    loadKg:
                      true,

                    restSeconds:
                      true,

                    notes:
                      true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!original) {
    return Response.json(
      {
        error:
          "Plan no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  /*
   * ==========================================================
   * 3. NOMBRE DE LA COPIA
   * ==========================================================
   */

  const nombreCopia =
    original.name
      .toLowerCase()
      .endsWith("(copia)")
      ? original.name
      : `${original.name} (copia)`;

  /*
   * ==========================================================
   * 4. CREAR COPIA COMPLETA
   * ==========================================================
   *
   * Nested write:
   *
   * TrainingPlan
   *  ↓
   * weeks.create
   *  ↓
   * days.create
   *  ↓
   * exercises.create
   *
   * Si una parte falla, Prisma revierte
   * toda la creación.
   */

  try {
    const copia =
      await prisma.trainingPlan.create({
        data: {
          trainerId,

          clientId:
            original.clientId,

          name:
            nombreCopia,

          objective:
            original.objective,

          /*
           * Conservamos la fecha del
           * plan original por ahora.
           *
           * Al editar el borrador se
           * podrá cambiar.
           */
          startDate:
            original.startDate,

          /*
           * Nunca duplicamos como ACTIVE.
           */
          status:
            "DRAFT",

          weeks: {
            create:
              original.weeks.map(
                (week) => ({
                  number:
                    week.number,

                  days: {
                    create:
                      week.days.map(
                        (day) => ({
                          name:
                            day.name,

                          description:
                            day.description,

                          position:
                            day.position,

                          exercises: {
                            create:
                              day.exercises.map(
                                (
                                  asignacion
                                ) => ({
                                  exerciseId:
                                    asignacion.exerciseId,

                                  position:
                                    asignacion.position,

                                  sets:
                                    asignacion.sets,

                                  reps:
                                    asignacion.reps,

                                  loadKg:
                                    asignacion.loadKg,

                                  restSeconds:
                                    asignacion.restSeconds,

                                  notes:
                                    asignacion.notes,
                                })
                              ),
                          },
                        })
                      ),
                  },
                })
              ),
          },
        },

        select: {
          id: true,

          clientId:
            true,

          name:
            true,

          status:
            true,

          _count: {
            select: {
              weeks:
                true,
            },
          },
        },
      });

    return Response.json(
      {
        ok: true,

        message:
          "Plan duplicado correctamente.",

        plan: {
          id:
            copia.id,

          clientId:
            copia.clientId,

          name:
            copia.name,

          status:
            copia.status,

          weeks:
            copia._count.weeks,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error duplicando plan:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo duplicar el plan.",
      },
      {
        status: 500,
      }
    );
  }
}