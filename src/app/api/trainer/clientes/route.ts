import { hash } from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";
import { Prisma } from "@/generated/prisma/client";

const clienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre es demasiado corto.")
    .max(120),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("El correo no es válido."),

  telefono: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("")),

  fechaNacimiento: z
    .string()
    .optional()
    .or(z.literal("")),

  alturaCm: z
    .string()
    .optional()
    .or(z.literal("")),

  pesoInicialKg: z
    .string()
    .optional()
    .or(z.literal("")),

  pesoActualKg: z
    .string()
    .optional()
    .or(z.literal("")),

  objetivo: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("")),

  password: z
    .string()
    .min(
      8,
      "La contraseña debe tener mínimo 8 caracteres."
    )
    .max(72),
});

/*
 * Convierte strings del formulario a Prisma.Decimal.
 *
 * También acepta coma decimal:
 *
 * 62,5 -> 62.5
 */
function convertirDecimal(
  valor: string | undefined,
  opciones: {
    campo: string;
    minimo: number;
    maximo: number;
  }
):
  | {
      value: Prisma.Decimal | null;
      error: null;
    }
  | {
      value: null;
      error: string;
    } {
  if (!valor?.trim()) {
    return {
      value: null,
      error: null,
    };
  }

  const normalizado = valor
    .trim()
    .replace(",", ".");

  /*
   * Solo permitimos números positivos
   * con decimales opcionales.
   */
  if (
    !/^\d+(?:\.\d+)?$/.test(
      normalizado
    )
  ) {
    return {
      value: null,
      error: `${opciones.campo} no es válido.`,
    };
  }

  const numero =
    Number(normalizado);

  if (!Number.isFinite(numero)) {
    return {
      value: null,
      error: `${opciones.campo} no es válido.`,
    };
  }

  if (
    numero < opciones.minimo ||
    numero > opciones.maximo
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

function convertirFecha(
  valor: string | undefined
): Date | null {
  if (!valor?.trim()) {
    return null;
  }

  const fecha =
    new Date(
      `${valor}T12:00:00.000Z`
    );

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return null;
  }

  return fecha;
}

/*
 * ============================================================
 * POST /api/trainer/clientes
 * ============================================================
 */
export async function POST(
  request: Request
) {
  /*
   * 1. Sesión del entrenador.
   */
  const acceso =
    await requireApiTrainer();

  if (!acceso.ok) {
    return acceso.response;
  }

  const trainerId =
    acceso.user.id;

  /*
   * 2. Leer body.
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
   * 3. Validación general.
   */
  const resultado =
    clienteSchema.safeParse(
      body
    );

  if (!resultado.success) {
    const primerError =
      resultado.error.issues[0];

    return Response.json(
      {
        error:
          primerError?.message ??
          "Los datos del cliente no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  const datos =
    resultado.data;

  /*
   * 4. Comprobar email.
   */
  const usuarioExistente =
    await prisma.user.findUnique({
      where: {
        email: datos.email,
      },

      select: {
        id: true,
      },
    });

  if (usuarioExistente) {
    return Response.json(
      {
        error:
          "Ya existe un usuario registrado con ese correo.",
      },
      {
        status: 409,
      }
    );
  }

  /*
   * ==========================================================
   * 5. DECIMALES
   * ==========================================================
   *
   * Ponemos además límites realistas para
   * impedir que un valor incorrecto llegue
   * a PostgreSQL.
   */

  const altura =
    convertirDecimal(
      datos.alturaCm,
      {
        campo: "La altura",
        minimo: 50,
        maximo: 300,
      }
    );

  if (altura.error) {
    return Response.json(
      {
        error: altura.error,
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

  if (pesoInicial.error) {
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

  if (pesoActual.error) {
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
   * 6. Fecha nacimiento.
   */
  const birthDate =
    convertirFecha(
      datos.fechaNacimiento
    );

  if (
    datos.fechaNacimiento &&
    !birthDate
  ) {
    return Response.json(
      {
        error:
          "La fecha de nacimiento no es válida.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * 7. Hash contraseña.
   */
  const passwordHash =
    await hash(
      datos.password,
      12
    );

  try {
    /*
     * ========================================================
     * CREAR CLIENTE
     * ========================================================
     *
     * User
     *   +
     * Profile
     *   +
     * TrainerClient
     */
    const cliente =
      await prisma.user.create({
        data: {
          name:
            datos.nombre,

          email:
            datos.email,

          passwordHash,

          role:
            "CLIENT",

          profile: {
            create: {
              phone:
                datos.telefono ||
                null,

              birthDate,

              goal:
                datos.objetivo ||
                null,

              /*
               * Prisma.Decimal
               */
              heightCm:
                altura.value,

              startWeightKg:
                pesoInicial.value,

              /*
               * Si no escriben peso actual,
               * usamos peso inicial.
               */
              currentWeightKg:
                pesoActual.value ??
                pesoInicial.value,
            },
          },

          /*
           * Relacionar con el entrenador
           * autenticado.
           */
          clientTrainers: {
            create: {
              status:
                "ACTIVE",

              trainer: {
                connect: {
                  id:
                    trainerId,
                },
              },
            },
          },
        },

        select: {
          id: true,
          name: true,
          email: true,

          profile: {
            select: {
              goal: true,
              phone: true,
            },
          },
        },
      });

    return Response.json(
      {
        ok: true,

        cliente: {
          id:
            cliente.id,

          nombre:
            cliente.name,

          email:
            cliente.email,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando cliente:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo crear el cliente.",
      },
      {
        status: 500,
      }
    );
  }
}