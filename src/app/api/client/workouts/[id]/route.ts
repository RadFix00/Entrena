import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiClient } from "@/lib/api-auth";
import { Prisma } from "@/generated/prisma/client";

const repsSchema = z
  .string()
  .trim()
  .refine(
    (valor) => {
      if (!valor) {
        return true;
      }

      if (
        !/^\d+$/.test(valor)
      ) {
        return false;
      }

      const numero =
        Number(valor);

      return (
        Number.isInteger(
          numero
        ) &&
        numero >= 0 &&
        numero <= 1000
      );
    },
    {
      message:
        "Las repeticiones no son válidas.",
    }
  );

const cargaSchema = z
  .string()
  .trim()
  .refine(
    (valor) => {
      if (!valor) {
        return true;
      }

      const normalizado =
        valor.replace(
          ",",
          "."
        );

      if (
        !/^\d+(?:\.\d{1,2})?$/.test(
          normalizado
        )
      ) {
        return false;
      }

      const numero =
        Number(
          normalizado
        );

      return (
        Number.isFinite(
          numero
        ) &&
        numero >= 0 &&
        numero <=
          99999.99
      );
    },
    {
      message:
        "La carga no es válida.",
    }
  );

const guardarSchema = z.object({
  finalizar:
    z.boolean(),

  notes: z
    .string()
    .max(2000)
    .optional()
    .default(""),

  exercises:
    z.array(
      z.object({
        id: z
          .string()
          .min(1),

        notes: z
          .string()
          .max(1000)
          .optional()
          .default(""),

        sets:
          z.array(
            z.object({
              id: z
                .string()
                .min(1),

              reps:
                repsSchema,

              loadKg:
                cargaSchema,

              completed:
                z.boolean(),

              notes: z
                .string()
                .max(500)
                .optional()
                .default(""),
            })
          ),
      })
    ),
});

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
   * =============================================
   * 1. AUTENTICACIÓN
   * =============================================
   */

  const acceso =
    await requireApiClient();

  if (!acceso.ok) {
    return acceso.response;
  }

  const clientId =
    acceso.user.id;

  const { id } =
    await params;

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
    guardarSchema.safeParse(
      body
    );

  if (!resultado.success) {
    return Response.json(
      {
        error:
          resultado.error
            .issues[0]
            ?.message ??
          "Los datos del entrenamiento no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  const datos =
    resultado.data;

  /*
   * =============================================
   * 3. SESIÓN DEL CLIENTE
   * =============================================
   */

  const sesion =
    await prisma.workoutSession.findFirst({
      where: {
        id,
        clientId,
      },

      select: {
        id: true,
        status: true,

        exercises: {
          select: {
            id: true,

            sets: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

  if (!sesion) {
    return Response.json(
      {
        error:
          "Entrenamiento no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    sesion.status ===
    "COMPLETED"
  ) {
    return Response.json(
      {
        error:
          "Este entrenamiento ya fue finalizado.",
      },
      {
        status: 409,
      }
    );
  }

  /*
   * =============================================
   * 4. VALIDAR OWNERSHIP DE LOGS
   * =============================================
   *
   * No confiamos en IDs enviados por
   * el navegador.
   */

  const ejerciciosPermitidos =
    new Map(
      sesion.exercises.map(
        (ejercicio) => [
          ejercicio.id,

          new Set(
            ejercicio.sets.map(
              (serie) =>
                serie.id
            )
          ),
        ]
      )
    );

  for (
    const ejercicio of
    datos.exercises
  ) {
    const seriesPermitidas =
      ejerciciosPermitidos.get(
        ejercicio.id
      );

    if (!seriesPermitidas) {
      return Response.json(
        {
          error:
            "Uno de los ejercicios no pertenece a esta sesión.",
        },
        {
          status: 403,
        }
      );
    }

    for (
      const serie of
      ejercicio.sets
    ) {
      if (
        !seriesPermitidas.has(
          serie.id
        )
      ) {
        return Response.json(
          {
            error:
              "Una de las series no pertenece a esta sesión.",
          },
          {
            status: 403,
          }
        );
      }

      /*
       * Si una serie se marca completada,
       * necesitamos conocer sus reps.
       */
      if (
        serie.completed &&
        !serie.reps
      ) {
        return Response.json(
          {
            error:
              "Indica las repeticiones de todas las series completadas.",
          },
          {
            status: 400,
          }
        );
      }
    }
  }

  /*
   * =============================================
   * 5. GUARDAR TODO EN UNA TRANSACCIÓN
   * =============================================
   */

  try {
    await prisma.$transaction(
      async (tx) => {
        for (
          const ejercicio of
          datos.exercises
        ) {
          await tx.exerciseLog.update({
            where: {
              id:
                ejercicio.id,
            },

            data: {
              notes:
                ejercicio.notes ||
                null,
            },
          });

          for (
            const serie of
            ejercicio.sets
          ) {
            const reps =
              serie.reps
                ? Number(
                    serie.reps
                  )
                : null;

            const loadKg =
              serie.loadKg
                ? new Prisma.Decimal(
                    serie.loadKg.replace(
                      ",",
                      "."
                    )
                  )
                : null;

            await tx.setLog.update({
              where: {
                id:
                  serie.id,
              },

              data: {
                reps,
                loadKg,

                completed:
                  serie.completed,

                notes:
                  serie.notes ||
                  null,
              },
            });
          }
        }

        await tx.workoutSession.update({
          where: {
            id:
              sesion.id,
          },

          data: {
            notes:
              datos.notes ||
              null,

            ...(datos.finalizar
              ? {
                  status:
                    "COMPLETED" as const,

                  completedAt:
                    new Date(),
                }
              : {}),
          },
        });
      }
    );

    return Response.json({
      ok: true,

      status:
        datos.finalizar
          ? "COMPLETED"
          : "IN_PROGRESS",
    });
  } catch (error) {
    console.error(
      "Error guardando entrenamiento:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo guardar el entrenamiento.",
      },
      {
        status: 500,
      }
    );
  }
}