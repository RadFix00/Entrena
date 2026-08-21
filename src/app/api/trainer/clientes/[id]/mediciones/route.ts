import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";
import { Prisma } from "@/generated/prisma/client";

/*
 * ============================================================
 * SCHEMA
 * ============================================================
 */

const medicionSchema = z
  .object({
    fecha: z
      .string()
      .trim()
      .optional()
      .default(""),

    pesoKg: z
      .string()
      .trim()
      .optional()
      .default(""),

    cinturaCm: z
      .string()
      .trim()
      .optional()
      .default(""),

    pechoCm: z
      .string()
      .trim()
      .optional()
      .default(""),

    caderaCm: z
      .string()
      .trim()
      .optional()
      .default(""),

    brazoCm: z
      .string()
      .trim()
      .optional()
      .default(""),

    musloCm: z
      .string()
      .trim()
      .optional()
      .default(""),

    notas: z
      .string()
      .trim()
      .max(
        1000,
        "Las notas son demasiado largas."
      )
      .optional()
      .default(""),
  })
  .refine(
    (datos) => {
      return [
        datos.pesoKg,
        datos.cinturaCm,
        datos.pechoCm,
        datos.caderaCm,
        datos.brazoCm,
        datos.musloCm,
      ].some(
        (valor) =>
          valor.trim() !== ""
      );
    },
    {
      message:
        "Debes registrar al menos una medición.",
    }
  );

/*
 * ============================================================
 * ERROR DE VALIDACIÓN
 * ============================================================
 */

class ErrorValidacion extends Error {
  constructor(
    message: string
  ) {
    super(message);

    this.name =
      "ErrorValidacion";
  }
}

/*
 * ============================================================
 * CONVERTIR DECIMAL
 * ============================================================
 *
 * Retorna:
 *
 * Prisma.Decimal
 * o
 * null
 *
 * Lanza ErrorValidacion si el valor
 * recibido no es válido.
 */

function convertirDecimal(
  valor: string,
  opciones: {
    campo: string;
    minimo: number;
    maximo: number;
  }
): Prisma.Decimal | null {
  const limpio =
    valor.trim();

  if (!limpio) {
    return null;
  }

  /*
   * Permitimos:
   *
   * 62
   * 62.5
   * 62.50
   * 62,5
   */
  const normalizado =
    limpio.replace(
      ",",
      "."
    );

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalizado
    )
  ) {
    throw new ErrorValidacion(
      `${opciones.campo} no es válido.`
    );
  }

  const numero =
    Number(normalizado);

  if (
    !Number.isFinite(
      numero
    )
  ) {
    throw new ErrorValidacion(
      `${opciones.campo} no es válido.`
    );
  }

  if (
    numero <
      opciones.minimo ||
    numero >
      opciones.maximo
  ) {
    throw new ErrorValidacion(
      `${opciones.campo} debe estar entre ${opciones.minimo} y ${opciones.maximo}.`
    );
  }

  return new Prisma.Decimal(
    normalizado
  );
}

/*
 * ============================================================
 * CONVERTIR FECHA
 * ============================================================
 *
 * Si viene vacía:
 * usamos la fecha actual.
 *
 * Si viene:
 * YYYY-MM-DD
 *
 * la convertimos a Date.
 */

function convertirFecha(
  valor: string
): Date {
  const limpio =
    valor.trim();

  if (!limpio) {
    return new Date();
  }

  const coincidencia =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      limpio
    );

  if (!coincidencia) {
    throw new ErrorValidacion(
      "La fecha de medición no es válida."
    );
  }

  const year =
    Number(
      coincidencia[1]
    );

  const month =
    Number(
      coincidencia[2]
    );

  const day =
    Number(
      coincidencia[3]
    );

  /*
   * Utilizamos mediodía UTC para
   * evitar desplazamientos de fecha
   * debido a zona horaria.
   */
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
   * Validar cosas como:
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
    throw new ErrorValidacion(
      "La fecha de medición no es válida."
    );
  }

  /*
   * Evitar fechas futuras.
   *
   * Permitimos hoy.
   */
  const ahora =
    new Date();

  const limite =
    new Date(
      Date.UTC(
        ahora.getUTCFullYear(),
        ahora.getUTCMonth(),
        ahora.getUTCDate() +
          1
      )
    );

  if (
    fecha.getTime() >=
    limite.getTime()
  ) {
    throw new ErrorValidacion(
      "La fecha de medición no puede estar en el futuro."
    );
  }

  return fecha;
}

/*
 * ============================================================
 * POST
 * /api/trainer/clientes/[id]/mediciones
 * ============================================================
 */

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
   * 2. COMPROBAR QUE EL CLIENTE PERTENECE AL ENTRENADOR
   * ==========================================================
   */

  const relacion =
    await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId,
          clientId,
        },
      },

      select: {
        id: true,

        client: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!relacion) {
    return Response.json(
      {
        error:
          "Cliente no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  /*
   * ==========================================================
   * 3. LEER BODY
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

  /*
   * ==========================================================
   * 4. VALIDACIÓN ZOD
   * ==========================================================
   */

  const resultado =
    medicionSchema.safeParse(
      body
    );

  if (!resultado.success) {
    return Response.json(
      {
        error:
          resultado.error
            .issues[0]
            ?.message ??
          "La medición no es válida.",
      },
      {
        status: 400,
      }
    );
  }

  const datos =
    resultado.data;

  /*
   * ==========================================================
   * 5. CONVERSIONES
   * ==========================================================
   */

  let peso:
    | Prisma.Decimal
    | null;

  let cintura:
    | Prisma.Decimal
    | null;

  let pecho:
    | Prisma.Decimal
    | null;

  let cadera:
    | Prisma.Decimal
    | null;

  let brazo:
    | Prisma.Decimal
    | null;

  let muslo:
    | Prisma.Decimal
    | null;

  let fecha:
    Date;

  try {
    peso =
      convertirDecimal(
        datos.pesoKg,
        {
          campo:
            "El peso",

          minimo: 1,
          maximo: 1000,
        }
      );

    cintura =
      convertirDecimal(
        datos.cinturaCm,
        {
          campo:
            "La cintura",

          minimo: 1,
          maximo: 500,
        }
      );

    pecho =
      convertirDecimal(
        datos.pechoCm,
        {
          campo:
            "El pecho",

          minimo: 1,
          maximo: 500,
        }
      );

    cadera =
      convertirDecimal(
        datos.caderaCm,
        {
          campo:
            "La cadera",

          minimo: 1,
          maximo: 500,
        }
      );

    brazo =
      convertirDecimal(
        datos.brazoCm,
        {
          campo:
            "El brazo",

          minimo: 1,
          maximo: 500,
        }
      );

    muslo =
      convertirDecimal(
        datos.musloCm,
        {
          campo:
            "El muslo",

          minimo: 1,
          maximo: 500,
        }
      );

    fecha =
      convertirFecha(
        datos.fecha
      );
  } catch (error) {
    if (
      error instanceof
      ErrorValidacion
    ) {
      return Response.json(
        {
          error:
            error.message,
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      "Error convirtiendo medición:",
      error
    );

    return Response.json(
      {
        error:
          "Los valores de la medición no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ==========================================================
   * 6. GUARDAR MEDICIÓN
   * ==========================================================
   *
   * Si hay peso hacemos DOS operaciones:
   *
   * 1. BodyMeasurement
   *
   * 2. Profile.currentWeightKg
   *
   * dentro de una transacción.
   */

  try {
    const medicion =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Crear registro histórico.
           */
          const nuevaMedicion =
            await tx.bodyMeasurement.create({
              data: {
                clientId,

                weightKg:
                  peso,

                waistCm:
                  cintura,

                chestCm:
                  pecho,

                hipCm:
                  cadera,

                armCm:
                  brazo,

                thighCm:
                  muslo,

                notes:
                  datos.notas ||
                  null,

                measuredAt:
                  fecha,
              },

              select: {
                id: true,

                weightKg:
                  true,

                waistCm:
                  true,

                chestCm:
                  true,

                hipCm:
                  true,

                armCm:
                  true,

                thighCm:
                  true,

                notes:
                  true,

                measuredAt:
                  true,

                createdAt:
                  true,
              },
            });

          /*
           * Si la medición contiene peso,
           * actualizar también el peso
           * actual del Profile.
           */
          if (
            peso !== null
          ) {
            await tx.profile.upsert({
              where: {
                userId:
                  clientId,
              },

              create: {
                userId:
                  clientId,

                currentWeightKg:
                  peso,
              },

              update: {
                currentWeightKg:
                  peso,
              },
            });
          }

          return nuevaMedicion;
        }
      );

    /*
     * ========================================================
     * 7. RESPUESTA
     * ========================================================
     */

    return Response.json(
      {
        ok: true,

        message:
          "Medición registrada correctamente.",

        medicion: {
          id:
            medicion.id,

          pesoKg:
            medicion
              .weightKg
              ?.toString() ??
            null,

          cinturaCm:
            medicion
              .waistCm
              ?.toString() ??
            null,

          pechoCm:
            medicion
              .chestCm
              ?.toString() ??
            null,

          caderaCm:
            medicion
              .hipCm
              ?.toString() ??
            null,

          brazoCm:
            medicion
              .armCm
              ?.toString() ??
            null,

          musloCm:
            medicion
              .thighCm
              ?.toString() ??
            null,

          notas:
            medicion.notes,

          measuredAt:
            medicion
              .measuredAt
              .toISOString(),

          createdAt:
            medicion
              .createdAt
              .toISOString(),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error registrando medición:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo registrar la medición.",
      },
      {
        status: 500,
      }
    );
  }
}