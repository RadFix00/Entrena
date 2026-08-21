import bcrypt from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { requireApiUser } from "@/lib/api-auth";

/*
 * ============================================================
 * VALIDACIÓN
 * ============================================================
 */

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Ingresa tu contraseña actual."),

    newPassword: z
      .string()
      .min(
        8,
        "La nueva contraseña debe tener mínimo 8 caracteres."
      )
      .max(
        72,
        "La contraseña es demasiado larga."
      )
      .regex(
        /[a-z]/,
        "Debe contener al menos una letra minúscula."
      )
      .regex(
        /[A-Z]/,
        "Debe contener al menos una letra mayúscula."
      )
      .regex(
        /\d/,
        "Debe contener al menos un número."
      ),

    confirmPassword: z
      .string()
      .min(
        1,
        "Confirma la nueva contraseña."
      ),
  })
  .refine(
    (data) =>
      data.newPassword ===
      data.confirmPassword,
    {
      message:
        "Las contraseñas nuevas no coinciden.",

      path: [
        "confirmPassword",
      ],
    }
  );

/*
 * ============================================================
 * PUT
 * /api/profile/password
 * ============================================================
 */

export async function PUT(
  request: Request
) {
  /*
   * ============================================
   * 1. USUARIO AUTENTICADO
   * ============================================
   */

  const acceso =
    await requireApiUser();

  if (!acceso.ok) {
    return acceso.response;
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
    passwordSchema.safeParse(
      body
    );

  if (!resultado.success) {
    return Response.json(
      {
        error:
          resultado.error
            .issues[0]
            ?.message ??
          "La contraseña no es válida.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    currentPassword,
    newPassword,
  } = resultado.data;

  /*
   * ============================================
   * 3. BUSCAR USUARIO
   * ============================================
   */

  const usuario =
    await prisma.user.findUnique({
      where: {
        id:
          acceso.user.id,
      },

      select: {
        id: true,

        passwordHash:
          true,
      },
    });

  if (!usuario) {
    return Response.json(
      {
        error:
          "Usuario no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    !usuario.passwordHash
  ) {
    return Response.json(
      {
        error:
          "Esta cuenta no tiene una contraseña local configurada.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ============================================
   * 4. VERIFICAR CONTRASEÑA ACTUAL
   * ============================================
   */

  const actualCorrecta =
    await bcrypt.compare(
      currentPassword,
      usuario.passwordHash
    );

  if (!actualCorrecta) {
    return Response.json(
      {
        error:
          "La contraseña actual es incorrecta.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ============================================
   * 5. IMPEDIR REUTILIZAR LA MISMA
   * ============================================
   */

  const mismaPassword =
    await bcrypt.compare(
      newPassword,
      usuario.passwordHash
    );

  if (mismaPassword) {
    return Response.json(
      {
        error:
          "La nueva contraseña debe ser diferente a la actual.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ============================================
   * 6. NUEVO HASH
   * ============================================
   */

  const nuevoHash =
    await bcrypt.hash(
      newPassword,
      12
    );

  /*
   * ============================================
   * 7. GUARDAR
   * ============================================
   */

  try {
    await prisma.user.update({
      where: {
        id:
          usuario.id,
      },

      data: {
        passwordHash:
          nuevoHash,
      },
    });

    return Response.json({
      ok: true,

      message:
        "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error cambiando contraseña:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo actualizar la contraseña.",
      },
      {
        status: 500,
      }
    );
  }
}