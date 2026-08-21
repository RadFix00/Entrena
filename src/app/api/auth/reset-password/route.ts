import { createHash } from "node:crypto";

import bcrypt from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";

export const runtime = "nodejs";

/*
 * ============================================================
 * VALIDACIÓN
 * ============================================================
 */

const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(
        20,
        "El token de recuperación no es válido."
      ),

    password: z
      .string()
      .min(
        8,
        "La contraseña debe tener mínimo 8 caracteres."
      )
      .max(
        72,
        "La contraseña es demasiado larga."
      )
      .regex(
        /[a-z]/,
        "La contraseña debe incluir una letra minúscula."
      )
      .regex(
        /[A-Z]/,
        "La contraseña debe incluir una letra mayúscula."
      )
      .regex(
        /\d/,
        "La contraseña debe incluir al menos un número."
      ),

    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message:
        "Las contraseñas no coinciden.",

      path: [
        "confirmPassword",
      ],
    }
  );

/*
 * ============================================================
 * POST /api/auth/reset-password
 * ============================================================
 */

export async function POST(
  request: Request
) {
  /*
   * ==========================================================
   * 1. LEER BODY
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
          "La solicitud enviada no es válida.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ==========================================================
   * 2. VALIDAR DATOS
   * ==========================================================
   */

  const result =
    resetPasswordSchema.safeParse(
      body
    );

  if (!result.success) {
    return Response.json(
      {
        error:
          result.error.issues[0]
            ?.message ??
          "Los datos enviados no son válidos.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    token,
    password,
  } = result.data;

  /*
   * ==========================================================
   * 3. CONVERTIR TOKEN REAL A HASH
   * ==========================================================
   *
   * En PostgreSQL nunca guardamos
   * el token real.
   */

  const tokenHash =
    createHash(
      "sha256"
    )
      .update(token)
      .digest(
        "hex"
      );

  /*
   * ==========================================================
   * 4. BUSCAR TOKEN
   * ==========================================================
   */

  const resetToken =
    await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },

      include: {
        user: {
          select: {
            id: true,
            passwordHash: true,
          },
        },
      },
    });

  /*
   * ==========================================================
   * 5. COMPROBAR VALIDEZ
   * ==========================================================
   */

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() <=
      Date.now()
  ) {
    return Response.json(
      {
        error:
          "El enlace de recuperación no es válido o ya expiró.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ==========================================================
   * 6. IMPEDIR REUTILIZAR LA MISMA CONTRASEÑA
   * ==========================================================
   */

  if (
    resetToken.user
      .passwordHash
  ) {
    const mismaPassword =
      await bcrypt.compare(
        password,
        resetToken.user
          .passwordHash
      );

    if (mismaPassword) {
      return Response.json(
        {
          error:
            "La nueva contraseña debe ser diferente a la anterior.",
        },
        {
          status: 400,
        }
      );
    }
  }

  /*
   * ==========================================================
   * 7. CREAR NUEVO HASH BCRYPT
   * ==========================================================
   */

  const passwordHash =
    await bcrypt.hash(
      password,
      12
    );

  /*
   * ==========================================================
   * 8. TRANSACCIÓN
   * ==========================================================
   */

  try {
    await prisma.$transaction(
      async (tx) => {
        /*
         * ========================================
         * RECLAMAR TOKEN
         * ========================================
         *
         * Solamente puede utilizarse una vez.
         */

        const claimedToken =
          await tx.passwordResetToken.updateMany({
            where: {
              id:
                resetToken.id,

              usedAt:
                null,

              expiresAt: {
                gt:
                  new Date(),
              },
            },

            data: {
              usedAt:
                new Date(),
            },
          });

        if (
          claimedToken.count !==
          1
        ) {
          throw new Error(
            "RESET_TOKEN_INVALID"
          );
        }

        /*
         * ========================================
         * ACTUALIZAR CONTRASEÑA
         * ========================================
         *
         * sessionVersion aumenta para invalidar
         * todas las sesiones JWT anteriores.
         */

        await tx.user.update({
          where: {
            id:
              resetToken.user.id,
          },

          data: {
            passwordHash,

            sessionVersion: {
              increment: 1,
            },
          },
        });

        /*
         * ========================================
         * INVALIDAR CUALQUIER OTRO TOKEN
         * ========================================
         */

        await tx.passwordResetToken.updateMany({
          where: {
            userId:
              resetToken.user.id,

            usedAt:
              null,
          },

          data: {
            usedAt:
              new Date(),
          },
        });
      }
    );
  } catch (error) {
    if (
      error instanceof
        Error &&
      error.message ===
        "RESET_TOKEN_INVALID"
    ) {
      return Response.json(
        {
          error:
            "Este enlace de recuperación ya no puede utilizarse.",
        },
        {
          status: 400,
        }
      );
    }

    console.error(
      "Error restableciendo contraseña:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo restablecer la contraseña.",
      },
      {
        status: 500,
      }
    );
  }

  /*
   * ==========================================================
   * 9. OK
   * ==========================================================
   */

  return Response.json({
    ok: true,

    message:
      "Contraseña actualizada correctamente.",
  });
}