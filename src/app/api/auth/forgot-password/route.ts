import {
  createHash,
  randomBytes,
} from "node:crypto";

import { z } from "zod";

import prisma from "@/lib/prisma";
import { enviarCorreoRecuperacion } from "@/lib/mail";

export const runtime = "nodejs";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Ingresa tu correo electrónico.")
  .email("Ingresa un correo electrónico válido.");

const RESPUESTA_GENERICA =
  "Si existe una cuenta asociada a ese correo, recibirás instrucciones para recuperar tu contraseña.";

export async function POST(request: Request) {
  /*
   * ============================================
   * 1. LEER BODY DE FORMA SEGURA
   * ============================================
   */

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: "La solicitud enviada no es válida.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * No asumimos que body tenga email.
   * Primero comprobamos que sea un objeto.
   */
  let emailInput = "";

  if (
    typeof body === "object" &&
    body !== null &&
    "email" in body
  ) {
    const value = (
      body as Record<string, unknown>
    ).email;

    if (typeof value === "string") {
      emailInput = value;
    }
  }

  /*
   * ============================================
   * 2. VALIDAR EMAIL
   * ============================================
   */

  const validation =
    emailSchema.safeParse(emailInput);

  if (!validation.success) {
    return Response.json(
      {
        error:
          validation.error.issues[0]
            ?.message ??
          "Ingresa un correo electrónico válido.",
      },
      {
        status: 400,
      }
    );
  }

  const email = validation.data
    .trim()
    .toLowerCase();

  /*
   * ============================================
   * 3. BUSCAR USUARIO
   * ============================================
   *
   * findFirst + mode insensitive evita
   * problemas si el email fue registrado
   * con alguna mayúscula.
   */

  const user =
    await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

  /*
   * ============================================
   * 4. RESPUESTA ANTI-ENUMERACIÓN
   * ============================================
   *
   * No revelamos si el usuario existe.
   */

  if (!user || !user.passwordHash) {
    return Response.json({
      ok: true,
      message: RESPUESTA_GENERICA,
    });
  }

  /*
   * ============================================
   * 5. EVITAR SPAM
   * ============================================
   *
   * Una solicitud cada 60 segundos
   * por usuario.
   */

  const latestToken =
    await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        createdAt: true,
      },
    });

  if (
    latestToken &&
    Date.now() -
      latestToken.createdAt.getTime() <
      60_000
  ) {
    return Response.json({
      ok: true,
      message: RESPUESTA_GENERICA,
    });
  }

  /*
   * ============================================
   * 6. GENERAR TOKEN SEGURO
   * ============================================
   */

  const token = randomBytes(32).toString(
    "hex"
  );

  /*
   * Guardamos únicamente el HASH.
   *
   * Si alguien obtiene acceso a la BD,
   * no puede utilizar directamente
   * los tokens almacenados.
   */

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  /*
   * 30 minutos.
   */

  const expiresAt = new Date(
    Date.now() + 30 * 60 * 1000
  );

  /*
   * ============================================
   * 7. GUARDAR TOKEN
   * ============================================
   *
   * Invalidamos tokens anteriores.
   */

  await prisma.$transaction(
    async (tx) => {
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
        },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    }
  );

  /*
   * ============================================
   * 8. CONSTRUIR URL
   * ============================================
   */

  const requestOrigin = new URL(
    request.url
  ).origin;

  const baseUrl =
    process.env.APP_URL?.trim() ||
    requestOrigin;

  const resetUrl =
    `${baseUrl}/reset-password?token=${encodeURIComponent(
      token
    )}`;

  /*
   * ============================================
   * 9. ENVIAR EMAIL
   * ============================================
   */

  try {
    await enviarCorreoRecuperacion({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  } catch (error) {
    /*
     * No devolvemos información sensible
     * al navegador.
     */

    console.error(
      "Error enviando correo de recuperación:",
      error
    );
  }

  /*
   * ============================================
   * 10. RESPUESTA
   * ============================================
   */

  return Response.json({
    ok: true,
    message: RESPUESTA_GENERICA,
  });
}