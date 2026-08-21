import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";

/*
 * ============================================================
 * VALIDACIÓN
 * ============================================================
 */

const calendarioSchema =
  z.object({
    planId: z
      .string()
      .trim()
      .min(
        1,
        "El plan es obligatorio."
      ),

    dias: z
      .array(
        z.object({
          workoutDayId: z
            .string()
            .trim()
            .min(1),

          scheduledDate: z
            .string()
            .trim()
            .nullable(),
        })
      )
      .max(
        200,
        "Hay demasiadas sesiones."
      ),
  });

/*
 * ============================================================
 * FECHA
 * ============================================================
 *
 * Guardamos la fecha a las 12:00 UTC.
 *
 * Así tratamos scheduledDate como una
 * fecha de calendario y reducimos problemas
 * por desplazamientos de zona horaria.
 */

function convertirFecha(
  value: string | null
): Date | null {
  if (
    value === null ||
    !value.trim()
  ) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value.trim()
    );

  if (!match) {
    throw new Error(
      "Una de las fechas no es válida."
    );
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  const fecha =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12,
        0,
        0
      )
    );

  /*
   * Detectar fechas imposibles:
   *
   * 2026-02-31
   */
  if (
    fecha.getUTCFullYear() !==
      year ||
    fecha.getUTCMonth() !==
      month - 1 ||
    fecha.getUTCDate() !==
      day
  ) {
    throw new Error(
      "Una de las fechas no es válida."
    );
  }

  return fecha;
}

/*
 * ============================================================
 * PUT
 * /api/trainer/clientes/[id]/calendario
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
   * ==========================================================
   * 1. AUTENTICACIÓN
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
    id: clientId,
  } = await params;

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
   * ==========================================================
   * 2. BODY
   * ==========================================================
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
    calendarioSchema.safeParse(
      body
    );

  if (!resultado.success) {
    return Response.json(
      {
        error:
          resultado.error
            .issues[0]
            ?.message ??
          "El calendario no es válido.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    planId,
    dias,
  } = resultado.data;

  /*
   * ==========================================================
   * 3. COMPROBAR PLAN
   * ==========================================================
   *
   * Importantísimo:
   *
   * plan
   * entrenador
   * cliente
   *
   * deben coincidir.
   */

  const plan =
    await prisma.trainingPlan.findFirst({
      where: {
        id:
          planId,

        trainerId,

        clientId,
      },

      select: {
        id: true,
        name: true,

        weeks: {
          select: {
            days: {
              select: {
                id: true,
              },
            },
          },
        },
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
   * ==========================================================
   * 4. IDS PERMITIDOS
   * ==========================================================
   */

  const idsPermitidos =
    new Set(
      plan.weeks.flatMap(
        (week) =>
          week.days.map(
            (day) =>
              day.id
          )
      )
    );

  /*
   * Impedir que alguien modifique
   * mediante la API un WorkoutDay
   * que pertenece a otro cliente.
   */

  for (const dia of dias) {
    if (
      !idsPermitidos.has(
        dia.workoutDayId
      )
    ) {
      return Response.json(
        {
          error:
            "Una de las sesiones no pertenece al plan.",
        },
        {
          status: 403,
        }
      );
    }
  }

  /*
   * ==========================================================
   * 5. CONVERTIR FECHAS
   * ==========================================================
   */

  let diasConvertidos: {
    workoutDayId: string;
    scheduledDate: Date | null;
  }[];

  try {
    diasConvertidos =
      dias.map(
        (dia) => ({
          workoutDayId:
            dia.workoutDayId,

          scheduledDate:
            convertirFecha(
              dia.scheduledDate
            ),
        })
      );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Las fechas no son válidas.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ==========================================================
   * 6. GUARDAR
   * ==========================================================
   *
   * Todo dentro de una transacción.
   */

  try {
    await prisma.$transaction(
      async (tx) => {
        for (
          const dia of
            diasConvertidos
        ) {
          await tx.workoutDay.update({
            where: {
              id:
                dia.workoutDayId,
            },

            data: {
              scheduledDate:
                dia.scheduledDate,
            },
          });
        }
      }
    );

    return Response.json({
      ok: true,

      message:
        "Calendario actualizado correctamente.",

      sesionesActualizadas:
        diasConvertidos.length,
    });
  } catch (error) {
    console.error(
      "Error actualizando calendario:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo actualizar el calendario.",
      },
      {
        status: 500,
      }
    );
  }
}