import { readFile } from "fs/promises";
import path from "path";

export const runtime =
  "nodejs";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      filename: string;
    }>;
  }
) {
  const {
    filename: rawFilename,
  } = await params;

  /*
   * Por seguridad:
   * decodificamos el nombre y evitamos
   * rutas tipo ../../archivo
   */
  let filename: string;

  try {
    filename =
      decodeURIComponent(
        rawFilename
      );
  } catch {
    return new Response(
      "Not found",
      {
        status: 404,
      }
    );
  }

  /*
   * basename debe ser exactamente igual.
   *
   * Así impedimos:
   * ../
   * carpetas
   * rutas absolutas
   */
  if (
    path.basename(
      filename
    ) !== filename
  ) {
    return new Response(
      "Not found",
      {
        status: 404,
      }
    );
  }

  /*
   * Por ahora nuestros avatares
   * solamente pueden ser WebP.
   */
  if (
    !filename
      .toLowerCase()
      .endsWith(".webp")
  ) {
    return new Response(
      "Not found",
      {
        status: 404,
      }
    );
  }

  const avatarFolder =
    path.join(
      process.cwd(),
      "storage",
      "avatars"
    );

  const filepath =
    path.join(
      avatarFolder,
      filename
    );

  try {
    const image =
      await readFile(
        filepath
      );

    /*
     * Convertimos Buffer -> Uint8Array.
     *
     * De esta forma Response recibe
     * directamente un cuerpo compatible
     * con la Web API.
     */
    const body =
      new Uint8Array(
        image
      );

    return new Response(
      body,
      {
        status: 200,

        headers: {
          "Content-Type":
            "image/webp",

          "Content-Length":
            String(
              body.byteLength
            ),

          "Cache-Control":
            "public, max-age=31536000, immutable",
        },
      }
    );
  } catch (error) {
    /*
     * IMPORTANTE DURANTE DESARROLLO:
     *
     * Si vuelve a fallar, ahora la terminal
     * nos dirá exactamente dónde intentó
     * encontrar la fotografía.
     */
    console.error(
      "No se pudo leer avatar:",
      {
        filename,
        filepath,
        cwd:
          process.cwd(),
        error,
      }
    );

    return new Response(
      "Not found",
      {
        status: 404,
      }
    );
  }
}