import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";

const copiarPlanSchema =
  z.object({
    clientId: z
      .string()
      .trim()
      .min(
        1,
        "Debes seleccionar un cliente."
      ),
  });

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  /*
   * ============================================
   * 1. ENTRENADOR AUTENTICADO
   * ============================================
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

  /*
   * ============================================
   * 2. BODY
   * ============================================
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
    copiarPlanSchema.safeParse(
      body
    );

  if (!resultado.success) {
    return Response.json(
      {
        error:
          resultado.error
            .issues[0]
            ?.message ??
          "Cliente inválido.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    clientId,
  } = resultado.data;

  /*
   * ============================================
   * 3. PLAN ORIGINAL
   * ============================================
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
   * ============================================
   * 4. CLIENTE DESTINO
   * ============================================
   *
   * Comprobamos que realmente pertenece
   * a este entrenador.
   */

  const relacionDestino =
    await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId,
        },
      },

      select: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  if (!relacionDestino) {
    return Response.json(
      {
        error:
          "El cliente seleccionado no pertenece a este entrenador.",
      },
      {
        status: 403,
      }
    );
  }

  /*
   * Para duplicar dentro del mismo cliente
   * ya tenemos el botón Duplicar.
   */
  if (
    clientId ===
    original.clientId
  ) {
    return Response.json(
      {
        error:
          "Selecciona un cliente diferente. Para este cliente usa Duplicar.",
      },
      {
        status: 409,
      }
    );
  }

  /*
   * ============================================
   * 5. CREAR COPIA
   * ============================================
   *
   * Siempre DRAFT.
   *
   * No modificamos ningún plan ACTIVE
   * que tenga el cliente destino.
   */

  try {
    const copia =
      await prisma.trainingPlan.create({
        data: {
          trainerId,

          clientId,

          name:
            original.name,

          objective:
            original.objective,

          startDate:
            original.startDate,

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
          clientId: true,
          name: true,
          status: true,
        },
      });

    return Response.json(
      {
        ok: true,

        message:
          `Plan copiado a ${relacionDestino.client.name}.`,

        plan:
          copia,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error copiando plan a cliente:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo copiar el plan al cliente.",
      },
      {
        status: 500,
      }
    );
  }
}