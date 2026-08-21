import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";
import { Prisma } from "@/generated/prisma/client";

const editarClienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(
      2,
      "El nombre es demasiado corto."
    )
    .max(120),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email(
      "El correo no es válido."
    ),

  telefono: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default(""),

  fechaNacimiento: z
    .string()
    .trim()
    .optional()
    .default(""),

  alturaCm: z
    .string()
    .trim()
    .optional()
    .default(""),

  pesoInicialKg: z
    .string()
    .trim()
    .optional()
    .default(""),

  pesoActualKg: z
    .string()
    .trim()
    .optional()
    .default(""),

  objetivo: z
    .string()
    .trim()
    .max(500)
    .optional()
    .default(""),

  estado: z.enum([
    "ACTIVE",
    "REVIEW",
    "PAUSED",
  ]),

  notas: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .default(""),
});

/*
 * ============================================================
 * CONVERTIR DECIMAL
 * ============================================================
 */

function convertirDecimal(
  valor: string,
  opciones: {
    campo: string;
    minimo: number;
    maximo: number;
  }
):
  | {
      value:
        | Prisma.Decimal
        | null;
      error: null;
    }
  | {
      value: null;
      error: string;
    } {
  if (!valor.trim()) {
    return {
      value: null,
      error: null,
    };
  }

  const normalizado =
    valor
      .trim()
      .replace(",", ".");

  /*
   * Permitimos:
   *
   * 62
   * 62.5
   * 62.50
   */
  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalizado
    )
  ) {
    return {
      value: null,

      error:
        `${opciones.campo} no es válido.`,
    };
  }

  const numero =
    Number(normalizado);

  if (
    !Number.isFinite(
      numero
    )
  ) {
    return {
      value: null,

      error:
        `${opciones.campo} no es válido.`,
    };
  }

  if (
    numero <
      opciones.minimo ||
    numero >
      opciones.maximo
  ) {
    return {
      value: null,

      error:
        `${opciones.campo} debe estar entre ` +
        `${opciones.minimo} y ${opciones.maximo}.`,
    };
  }

  return {
    value:
      new Prisma.Decimal(
        normalizado
      ),

    error: null,
  };
}

/*
 * ============================================================
 * CONVERTIR FECHA
 * ============================================================
 */

function convertirFecha(
  valor: string
):
  | {
      value: Date | null;
      error: null;
    }
  | {
      value: null;
      error: string;
    } {
  if (!valor.trim()) {
    return {
      value: null,
      error: null,
    };
  }

  const coincidencia =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      valor
    );

  if (!coincidencia) {
    return {
      value: null,

      error:
        "La fecha de nacimiento no es válida.",
    };
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
   * Mediodía UTC para evitar
   * desplazamientos por zona horaria.
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
   * Validar fechas imposibles.
   *
   * Ejemplo:
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
    return {
      value: null,

      error:
        "La fecha de nacimiento no es válida.",
    };
  }

  /*
   * No permitir nacimiento
   * en el futuro.
   */
  const hoy =
    new Date();

  if (
    fecha.getTime() >
    hoy.getTime()
  ) {
    return {
      value: null,

      error:
        "La fecha de nacimiento no puede estar en el futuro.",
    };
  }

  return {
    value: fecha,
    error: null,
  };
}

/*
 * ============================================================
 * PATCH
 * /api/trainer/clientes/[id]
 * ============================================================
 */

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
   * 2. COMPROBAR RELACIÓN
   * ==========================================================
   *
   * Además traemos el peso actual
   * para saber si realmente cambió.
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

            profile: {
              select: {
                currentWeightKg:
                  true,
              },
            },
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
    editarClienteSchema.safeParse(
      body
    );

  if (!resultado.success) {
    return Response.json(
      {
        error:
          resultado.error
            .issues[0]
            ?.message ??
          "Los datos no son válidos.",
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
   * 5. EMAIL ÚNICO
   * ==========================================================
   */

  const usuarioEmail =
    await prisma.user.findUnique({
      where: {
        email:
          datos.email,
      },

      select: {
        id: true,
      },
    });

  if (
    usuarioEmail &&
    usuarioEmail.id !==
      clientId
  ) {
    return Response.json(
      {
        error:
          "Ya existe otro usuario registrado con ese correo.",
      },
      {
        status: 409,
      }
    );
  }

  /*
   * ==========================================================
   * 6. DATOS FÍSICOS
   * ==========================================================
   */

  const altura =
    convertirDecimal(
      datos.alturaCm,
      {
        campo:
          "La altura",

        minimo: 50,
        maximo: 300,
      }
    );

  if (altura.error) {
    return Response.json(
      {
        error:
          altura.error,
      },
      {
        status: 400,
      }
    );
  }

  const pesoInicial =
    convertirDecimal(
      datos.pesoInicialKg,
      {
        campo:
          "El peso inicial",

        minimo: 1,
        maximo: 1000,
      }
    );

  if (
    pesoInicial.error
  ) {
    return Response.json(
      {
        error:
          pesoInicial.error,
      },
      {
        status: 400,
      }
    );
  }

  const pesoActual =
    convertirDecimal(
      datos.pesoActualKg,
      {
        campo:
          "El peso actual",

        minimo: 1,
        maximo: 1000,
      }
    );

  if (
    pesoActual.error
  ) {
    return Response.json(
      {
        error:
          pesoActual.error,
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ==========================================================
   * 7. ¿CAMBIÓ EL PESO?
   * ==========================================================
   *
   * Si:
   *
   * 62.0 -> 62.7
   *
   * crearemos un BodyMeasurement.
   *
   * Si sigue igual:
   *
   * 62.7 -> 62.7
   *
   * no creamos una medición duplicada.
   */

  const pesoAnterior =
    relacion.client.profile
      ?.currentWeightKg
      ?.toString() ??
    null;

  const pesoNuevo =
    pesoActual.value
      ?.toString() ??
    null;

  const cambioPeso =
    pesoNuevo !== null &&
    pesoNuevo !==
      pesoAnterior;

  /*
   * ==========================================================
   * 8. FECHA DE NACIMIENTO
   * ==========================================================
   */

  const fechaNacimiento =
    convertirFecha(
      datos.fechaNacimiento
    );

  if (
    fechaNacimiento.error
  ) {
    return Response.json(
      {
        error:
          fechaNacimiento.error,
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ==========================================================
   * 9. ACTUALIZACIÓN ATÓMICA
   * ==========================================================
   *
   * Actualizamos:
   *
   * User
   * Profile
   * TrainerClient
   *
   * Y, si cambió el peso:
   *
   * BodyMeasurement
   *
   * Todo dentro de la misma transacción.
   */

  try {
    const cliente =
      await prisma.$transaction(
        async (tx) => {
          /*
           * =======================================
           * USER + PROFILE
           * =======================================
           */

          const usuario =
            await tx.user.update({
              where: {
                id:
                  clientId,
              },

              data: {
                name:
                  datos.nombre,

                email:
                  datos.email,

                /*
                 * Si Profile no existe:
                 * create
                 *
                 * Si existe:
                 * update
                 */
                profile: {
                  upsert: {
                    create: {
                      phone:
                        datos.telefono ||
                        null,

                      birthDate:
                        fechaNacimiento.value,

                      goal:
                        datos.objetivo ||
                        null,

                      heightCm:
                        altura.value,

                      startWeightKg:
                        pesoInicial.value,

                      currentWeightKg:
                        pesoActual.value,
                    },

                    update: {
                      phone:
                        datos.telefono ||
                        null,

                      birthDate:
                        fechaNacimiento.value,

                      goal:
                        datos.objetivo ||
                        null,

                      heightCm:
                        altura.value,

                      startWeightKg:
                        pesoInicial.value,

                      currentWeightKg:
                        pesoActual.value,
                    },
                  },
                },
              },

              select: {
                id: true,
                name: true,
                email: true,
              },
            });

          /*
           * =======================================
           * TRAINER CLIENT
           * =======================================
           */

          await tx.trainerClient.update({
            where: {
              trainerId_clientId: {
                trainerId,
                clientId,
              },
            },

            data: {
              status:
                datos.estado,

              notes:
                datos.notas ||
                null,
            },
          });

          /*
           * =======================================
           * HISTORIAL DE PESO
           * =======================================
           *
           * IMPORTANTE:
           *
           * Solo creamos una medición
           * si el peso realmente cambió.
           */

          if (
            cambioPeso &&
            pesoActual.value !==
              null
          ) {
            await tx.bodyMeasurement.create({
              data: {
                clientId,

                weightKg:
                  pesoActual.value,

                measuredAt:
                  new Date(),
              },
            });
          }

          return usuario;
        }
      );

    /*
     * ========================================================
     * 10. RESPUESTA
     * ========================================================
     */

    return Response.json({
      ok: true,

      cliente: {
        id:
          cliente.id,

        nombre:
          cliente.name,

        email:
          cliente.email,
      },

      /*
       * Esto nos servirá después para
       * mostrar un mensaje diferente
       * en la interfaz.
       */
      medicionCreada:
        cambioPeso,

      message:
        cambioPeso
          ? "Cliente actualizado y nueva medición de peso registrada."
          : "Cliente actualizado correctamente.",
    });
  } catch (error) {
    console.error(
      "Error actualizando cliente:",
      error
    );

    /*
     * P2002:
     * unique constraint.
     *
     * Normalmente aquí sería email
     * duplicado debido a una condición
     * de carrera.
     */
    if (
      typeof error ===
        "object" &&
      error !== null &&
      "code" in error &&
      error.code ===
        "P2002"
    ) {
      return Response.json(
        {
          error:
            "Ya existe otro usuario registrado con ese correo.",
        },
        {
          status: 409,
        }
      );
    }

    return Response.json(
      {
        error:
          "No se pudo actualizar el cliente.",
      },
      {
        status: 500,
      }
    );
  }
}