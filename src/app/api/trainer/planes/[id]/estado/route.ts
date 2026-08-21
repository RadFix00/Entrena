import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";

const cambiarEstadoSchema =
  z.object({
    accion: z.enum([
      "ACTIVATE",
      "ARCHIVE",
      "RESTORE_DRAFT",
    ]),
  });

export async function PATCH(
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
    cambiarEstadoSchema.safeParse(
      body
    );

  if (!resultado.success) {
    return Response.json(
      {
        error:
          resultado.error
            .issues[0]
            ?.message ??
          "Acción no válida.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    accion,
  } = resultado.data;

  /*
   * ============================================
   * 3. COMPROBAR PROPIEDAD DEL PLAN
   * ============================================
   */

  const plan =
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

        status:
          true,
      },
    });

  if (!plan) {
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
   * 4. ACTIVAR
   * ============================================
   *
   * DRAFT -> ACTIVE
   *
   * Si existe otro ACTIVE para
   * el mismo cliente, lo archivamos.
   */

  if (
    accion ===
    "ACTIVATE"
  ) {
    /*
     * Si ya está activo, no hacemos
     * nada destructivo.
     */
    if (
      plan.status ===
      "ACTIVE"
    ) {
      return Response.json({
        ok: true,

        message:
          "El plan ya está activo.",

        plan: {
          id:
            plan.id,

          status:
            plan.status,
        },
      });
    }

    /*
     * Un archivado primero debe
     * volver a borrador.
     */
    if (
      plan.status ===
      "ARCHIVED"
    ) {
      return Response.json(
        {
          error:
            "Primero reactiva el plan como borrador.",
        },
        {
          status: 409,
        }
      );
    }

    try {
      const actualizado =
        await prisma.$transaction(
          async (tx) => {
            /*
             * Archivar otros planes activos
             * del mismo cliente.
             */
            await tx.trainingPlan.updateMany({
              where: {
                trainerId,

                clientId:
                  plan.clientId,

                status:
                  "ACTIVE",

                id: {
                  not:
                    plan.id,
                },
              },

              data: {
                status:
                  "ARCHIVED",
              },
            });

            /*
             * Activar el borrador elegido.
             */
            return tx.trainingPlan.update({
              where: {
                id:
                  plan.id,
              },

              data: {
                status:
                  "ACTIVE",
              },

              select: {
                id: true,
                name: true,
                status: true,
              },
            });
          }
        );

      return Response.json({
        ok: true,

        message:
          "Plan activado correctamente.",

        plan:
          actualizado,
      });
    } catch (error) {
      console.error(
        "Error activando plan:",
        error
      );

      return Response.json(
        {
          error:
            "No se pudo activar el plan.",
        },
        {
          status: 500,
        }
      );
    }
  }

  /*
   * ============================================
   * 5. ARCHIVAR
   * ============================================
   *
   * ACTIVE -> ARCHIVED
   *
   * También dejamos preparada la API
   * para archivar un DRAFT en el futuro.
   */

  if (
    accion ===
    "ARCHIVE"
  ) {
    if (
      plan.status ===
      "ARCHIVED"
    ) {
      return Response.json({
        ok: true,

        message:
          "El plan ya está archivado.",

        plan: {
          id:
            plan.id,

          status:
            plan.status,
        },
      });
    }

    try {
      const actualizado =
        await prisma.trainingPlan.update({
          where: {
            id:
              plan.id,
          },

          data: {
            status:
              "ARCHIVED",
          },

          select: {
            id: true,
            name: true,
            status: true,
          },
        });

      return Response.json({
        ok: true,

        message:
          "Plan archivado correctamente.",

        plan:
          actualizado,
      });
    } catch (error) {
      console.error(
        "Error archivando plan:",
        error
      );

      return Response.json(
        {
          error:
            "No se pudo archivar el plan.",
        },
        {
          status: 500,
        }
      );
    }
  }

  /*
   * ============================================
   * 6. REACTIVAR COMO BORRADOR
   * ============================================
   *
   * ARCHIVED -> DRAFT
   */

  if (
    accion ===
    "RESTORE_DRAFT"
  ) {
    if (
      plan.status ===
      "DRAFT"
    ) {
      return Response.json({
        ok: true,

        message:
          "El plan ya es un borrador.",

        plan: {
          id:
            plan.id,

          status:
            plan.status,
        },
      });
    }

    /*
     * Un plan ACTIVE no debería pasar
     * directamente a DRAFT.
     *
     * Primero se archiva.
     */
    if (
      plan.status ===
      "ACTIVE"
    ) {
      return Response.json(
        {
          error:
            "Primero archiva el plan activo.",
        },
        {
          status: 409,
        }
      );
    }

    try {
      const actualizado =
        await prisma.trainingPlan.update({
          where: {
            id:
              plan.id,
          },

          data: {
            status:
              "DRAFT",
          },

          select: {
            id: true,
            name: true,
            status: true,
          },
        });

      return Response.json({
        ok: true,

        message:
          "Plan restaurado como borrador.",

        plan:
          actualizado,
      });
    } catch (error) {
      console.error(
        "Error restaurando plan:",
        error
      );

      return Response.json(
        {
          error:
            "No se pudo restaurar el plan.",
        },
        {
          status: 500,
        }
      );
    }
  }

  return Response.json(
    {
      error:
        "Acción no soportada.",
    },
    {
      status: 400,
    }
  );
}