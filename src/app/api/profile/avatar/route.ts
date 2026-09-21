import {
  mkdir,
  unlink,
  writeFile,
} from "fs/promises";

import path from "path";

import {
  randomBytes,
} from "crypto";

import prisma from "@/lib/prisma";
import { requireApiUser } from "@/lib/api-auth";

/*
 * Este endpoint escribe archivos en disco,
 * por lo que debe ejecutarse en Node.js.
 */
export const runtime =
  "nodejs";

const AVATAR_FOLDER =
  path.join(
    process.cwd(),
    "storage",
    "avatars"
  );

const MAX_BYTES =
  15 * 1024 * 1024;

function nombreArchivo() {
  return `${randomBytes(
    16
  ).toString("hex")}.webp`;
}

/*
 * ============================================================
 * POST /api/profile/avatar
 * ============================================================
 *
 * Recibe FormData con el campo "file"
 * (un blob WebP de 512x512 generado en el cliente).
 */

export async function POST(
  request: Request
) {
  const acceso =
    await requireApiUser();

  if (!acceso.ok) {
    return acceso.response;
  }

  /*
   * ============================================
   * 1. LEER FORM DATA
   * ============================================
   */

  let formData:
    FormData;

  try {
    formData =
      await request.formData();
  } catch {
    return Response.json(
      {
        error:
          "No se pudo leer el archivo.",
      },
      {
        status: 400,
      }
    );
  }

  const file =
    formData.get(
      "file"
    );

  if (
    !(file instanceof File)
  ) {
    return Response.json(
      {
        error:
          "Debes enviar una imagen.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {
    return Response.json(
      {
        error:
          "El archivo debe ser una imagen.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    file.size > MAX_BYTES
  ) {
    return Response.json(
      {
        error:
          "La imagen es demasiado grande.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * ============================================
   * 2. GUARDAR ARCHIVO + ACTUALIZAR USUARIO
   * ============================================
   */

  try {
    const usuario =
      await prisma.user.findUnique({
        where: {
          id:
            acceso.user.id,
        },

        select: {
          id: true,

          avatarUrl:
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

    await mkdir(
      AVATAR_FOLDER,
      {
        recursive: true,
      }
    );

    const filename =
      nombreArchivo();

    const buffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    await writeFile(
      path.join(
        AVATAR_FOLDER,
        filename
      ),
      buffer
    );

    /*
     * Eliminamos el archivo anterior
     * (si existía) para no acumular huérfanos.
     */
    if (
      usuario.avatarUrl
    ) {
      const anterior =
        usuario.avatarUrl
          .split("/")
          .pop();

      if (
        anterior &&
        anterior.endsWith(
          ".webp"
        )
      ) {
        await unlink(
          path.join(
            AVATAR_FOLDER,
            anterior
          )
        ).catch(
          () => {}
        );
      }
    }

    const avatarUrl =
      `/api/avatar/${filename}`;

    await prisma.user.update({
      where: {
        id: usuario.id,
      },

      data: {
        avatarUrl,
      },
    });

    return Response.json({
      ok: true,

      avatarUrl,
    });
  } catch (error) {
    console.error(
      "Error guardando avatar:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo guardar el avatar.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * DELETE /api/profile/avatar
 * ============================================================
 */

export async function DELETE() {
  const acceso =
    await requireApiUser();

  if (!acceso.ok) {
    return acceso.response;
  }

  try {
    const usuario =
      await prisma.user.findUnique({
        where: {
          id:
            acceso.user.id,
        },

        select: {
          id: true,

          avatarUrl:
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
      usuario.avatarUrl
    ) {
      const filename =
        usuario.avatarUrl
          .split("/")
          .pop();

      if (
        filename &&
        filename.endsWith(
          ".webp"
        )
      ) {
        await unlink(
          path.join(
            AVATAR_FOLDER,
            filename
          )
        ).catch(
          () => {}
        );
      }
    }

    await prisma.user.update({
      where: {
        id: usuario.id,
      },

      data: {
        avatarUrl:
          null,
      },
    });

    return Response.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Error eliminando avatar:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo eliminar el avatar.",
      },
      {
        status: 500,
      }
    );
  }
}
