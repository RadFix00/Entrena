import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";
import {
  convertirDecimal,
  leerJson,
} from "@/lib/validators";

class ForbiddenError extends Error {}

type EjercicioPayload = {
  id?: number;
  exerciseId: string;
  nombre: string;
  series: number;
  repeticiones: string;
  carga: string;
  descanso: number;
  notas: string;
};

type DiaPayload = {
  id?: number;
  nombre: string;
  descripcion: string;
  ejercicios: EjercicioPayload[];
};

type SemanaPayload = {
  id?: number;
  numero: number;
  dias: DiaPayload[];
};

type PlanPayload = {
  nombrePlan: string;
  objetivo: string;
  semanas: SemanaPayload[];
};

/*
 * Verifica que el cliente pertenezca
 * al entrenador autenticado.
 */
async function obtenerContexto(
  clientId: string,
  trainerId: string
) {
  const relacion =
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
            email: true,

            profile: {
              select: {
                goal: true,
              },
            },
          },
        },
      },
    });

  if (!relacion) {
    return null;
  }

  return {
    trainerId,
    relacion,
  };
}

/*
 * ============================================================
 * GET
 * ============================================================
 */

export async function GET(
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
   * 1. Autenticación.
   */
  const acceso =
    await requireApiTrainer();

  if (!acceso.ok) {
    return acceso.response;
  }

  const trainerId =
    acceso.user.id;

  /*
   * 2. Cliente solicitado.
   */
  const { id: clientId } =
    await params;

  if (!clientId) {
    return Response.json(
      {
        error:
          "Cliente inválido.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * 3. Ownership:
   * comprobar que pertenece al entrenador.
   */
  const contexto =
    await obtenerContexto(
      clientId,
      trainerId
    );

  if (!contexto) {
    return Response.json(
      {
        error:
          "Cliente no encontrado o no pertenece al entrenador.",
      },
      {
        status: 404,
      }
    );
  }

  /*
   * 4. Cargar plan.
   */
  const plan =
    await prisma.trainingPlan.findFirst({
      where: {
        trainerId,
        clientId,

        status: {
          in: [
            "ACTIVE",
            "DRAFT",
          ],
        },
      },

      orderBy: {
        updatedAt: "desc",
      },

      include: {
        weeks: {
          orderBy: {
            number: "asc",
          },

          include: {
            days: {
              orderBy: {
                position: "asc",
              },

              include: {
                exercises: {
                  orderBy: {
                    position:
                      "asc",
                  },

                  include: {
                    exercise: {
                      select: {
                        id: true,
                        name: true,
                        muscleGroup:
                          true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

  /*
   * IDs temporales para React.
   */
  let contadorId = 1;

  const semanas: SemanaPayload[] =
    plan?.weeks.map(
      (semana) => ({
        id: contadorId++,

        numero:
          semana.number,

        dias:
          semana.days.map(
            (dia) => ({
              id:
                contadorId++,

              nombre:
                dia.name,

              descripcion:
                dia.description ??
                "",

              ejercicios:
                dia.exercises.map(
                  (
                    asignacion
                  ) => ({
                    id:
                      contadorId++,

                    /*
                     * ID real de Exercise.
                     */
                    exerciseId:
                      asignacion
                        .exercise
                        .id,

                    nombre:
                      asignacion
                        .exercise
                        .name,

                    series:
                      asignacion
                        .sets,

                    repeticiones:
                      asignacion
                        .reps,

                    carga:
                      asignacion
                        .loadKg !==
                      null
                        ? asignacion.loadKg.toString()
                        : "",

                    descanso:
                      asignacion
                        .restSeconds,

                    notas:
                      asignacion
                        .notes ??
                      "",
                  })
                ),
            })
          ),
      })
    ) ?? [];

  /*
   * Un plan nuevo empieza
   * visualmente con Semana 1.
   */
  if (
    semanas.length === 0
  ) {
    semanas.push({
      id: contadorId++,
      numero: 1,
      dias: [],
    });
  }

  return Response.json({
    cliente:
      contexto.relacion
        .client.name,

    nombrePlan:
      plan?.name ??
      "Nuevo plan",

    objetivo:
      plan?.objective ??
      contexto.relacion.client
        .profile?.goal ??
      "",

    semanas,
  });
}

/*
 * ============================================================
 * PUT
 * ============================================================
 */

export async function PUT(
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
   * 1. Autenticación.
   */
  const acceso =
    await requireApiTrainer();

  if (!acceso.ok) {
    return acceso.response;
  }

  const trainerId =
    acceso.user.id;

  /*
   * 2. Cliente.
   */
  const { id: clientId } =
    await params;

  if (!clientId) {
    return Response.json(
      {
        error:
          "Cliente inválido.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * 3. Body.
   */
  const rawBody =
    await leerJson(request);

  if (
    !rawBody ||
    typeof rawBody !==
      "object" ||
    Array.isArray(rawBody)
  ) {
    return Response.json(
      {
        error:
          "El contenido enviado no es válido.",
      },
      {
        status: 400,
      }
    );
  }

  const body =
    rawBody as PlanPayload;

  const nombrePlan =
    body.nombrePlan?.trim();

  const objetivo =
    body.objetivo?.trim() ??
    "";

  const semanas =
    Array.isArray(
      body.semanas
    )
      ? body.semanas
      : [];

  if (!nombrePlan) {
    return Response.json(
      {
        error:
          "El plan debe tener un nombre.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * Validar estructura.
   */
  for (
    const semana of semanas
  ) {
    if (
      !Array.isArray(
        semana.dias
      )
    ) {
      return Response.json(
        {
          error:
            "La estructura de las semanas no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    for (
      const dia of semana.dias
    ) {
      if (
        !Array.isArray(
          dia.ejercicios
        )
      ) {
        return Response.json(
          {
            error:
              "La estructura de los días no es válida.",
          },
          {
            status: 400,
          }
        );
      }

      for (
        const ejercicio of dia.ejercicios
      ) {
        if (
          !ejercicio.exerciseId
        ) {
          return Response.json(
            {
              error:
                `El ejercicio "${ejercicio.nombre || "Sin nombre"}" no tiene un exerciseId válido.`,
            },
            {
              status: 400,
            }
          );
        }
      }
    }
  }

  /*
   * 4. Verificar que el cliente
   * pertenezca al entrenador autenticado.
   */
  const contexto =
    await obtenerContexto(
      clientId,
      trainerId
    );

  if (!contexto) {
    return Response.json(
      {
        error:
          "El cliente no pertenece a este entrenador.",
      },
      {
        status: 404,
      }
    );
  }

  try {
    const planId =
      await prisma.$transaction(
        async (tx) => {
          /*
           * ==================================================
           * EJERCICIOS UTILIZADOS
           * ==================================================
           */

          const idsEjercicios =
            Array.from(
              new Set(
                semanas
                  .flatMap(
                    (semana) =>
                      semana.dias
                  )
                  .flatMap(
                    (dia) =>
                      dia.ejercicios
                  )
                  .map(
                    (ejercicio) =>
                      ejercicio.exerciseId
                  )
                  .filter(Boolean)
              )
            );

          /*
           * Muy importante:
           *
           * solamente admitimos ejercicios
           * propiedad del entrenador conectado.
           */
          const ejerciciosValidos =
            idsEjercicios.length >
            0
              ? await tx.exercise.findMany(
                  {
                    where: {
                      trainerId,

                      id: {
                        in: idsEjercicios,
                      },
                    },

                    select: {
                      id: true,
                    },
                  }
                )
              : [];

          const idsValidos =
            new Set(
              ejerciciosValidos.map(
                (ejercicio) =>
                  ejercicio.id
              )
            );

          for (
            const id of idsEjercicios
          ) {
            if (
              !idsValidos.has(id)
            ) {
              throw new ForbiddenError(
                "Uno de los ejercicios seleccionados no pertenece al entrenador."
              );
            }
          }

          /*
           * ==================================================
           * CONSTRUIR SEMANAS
           * ==================================================
           */

          const semanasParaCrear =
            semanas.map(
              (
                semana,
                indexSemana
              ) => ({
                number:
                  indexSemana +
                  1,

                days: {
                  create:
                    semana.dias.map(
                      (
                        dia,
                        indexDia
                      ) => ({
                        name:
                          dia.nombre?.trim() ||
                          `Día ${
                            indexDia +
                            1
                          }`,

                        description:
                          dia.descripcion?.trim() ||
                          null,

                        position:
                          indexDia +
                          1,

                        exercises: {
                          create:
                            dia.ejercicios.map(
                              (
                                ejercicio,
                                indexEjercicio
                              ) => ({
                                exerciseId:
                                  ejercicio.exerciseId,

                                position:
                                  indexEjercicio +
                                  1,

                                sets:
                                  Math.max(
                                    1,
                                    Math.trunc(
                                      Number(
                                        ejercicio.series
                                      ) ||
                                        1
                                    )
                                  ),

                                reps:
                                  ejercicio.repeticiones?.trim() ||
                                  "1",

                                loadKg:
                                  convertirDecimal(
                                    ejercicio.carga
                                  ),

                                restSeconds:
                                  Math.max(
                                    0,
                                    Math.trunc(
                                      Number(
                                        ejercicio.descanso
                                      ) ||
                                        0
                                    )
                                  ),

                                notes:
                                  ejercicio.notas?.trim() ||
                                  null,
                              })
                            ),
                        },
                      })
                    ),
                },
              })
            );

          /*
           * ==================================================
           * BUSCAR PLAN DEL ENTRENADOR
           * ==================================================
           */

          const planExistente =
            await tx.trainingPlan.findFirst(
              {
                where: {
                  trainerId,
                  clientId,

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
                },
              }
            );

          /*
           * ==================================================
           * ACTUALIZAR
           * ==================================================
           */

          if (
            planExistente
          ) {
            await tx.planWeek.deleteMany(
              {
                where: {
                  planId:
                    planExistente.id,
                },
              }
            );

            const planActualizado =
              await tx.trainingPlan.update(
                {
                  where: {
                    id:
                      planExistente.id,
                  },

                  data: {
                    name:
                      nombrePlan,

                    objective:
                      objetivo ||
                      null,

                    weeks: {
                      create:
                        semanasParaCrear,
                    },
                  },

                  select: {
                    id: true,
                  },
                }
              );

            return planActualizado.id;
          }

          /*
           * ==================================================
           * CREAR
           * ==================================================
           */

          const nuevoPlan =
            await tx.trainingPlan.create(
              {
                data: {
                  trainerId,
                  clientId,

                  name:
                    nombrePlan,

                  objective:
                    objetivo ||
                    null,

                  status:
                    "DRAFT",

                  weeks: {
                    create:
                      semanasParaCrear,
                  },
                },

                select: {
                  id: true,
                },
              }
            );

          return nuevoPlan.id;
        }
      );

    return Response.json({
      ok: true,
      planId,

      message:
        "Plan guardado correctamente.",
    });
  } catch (error) {
    if (
      error instanceof
      ForbiddenError
    ) {
      return Response.json(
        {
          error:
            error.message,
        },
        {
          status: 403,
        }
      );
    }

    console.error(
      "Error guardando plan:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo guardar el plan.",
      },
      {
        status: 500,
      }
    );
  }
}