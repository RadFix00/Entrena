import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const acceso =
    await requireApiTrainer();

  if (!acceso.ok) {
    return acceso.response;
  }

  const trainerId =
    acceso.user.id;

  const { id } =
    await params;

  if (!id) {
    return Response.json(
      {
        error:
          "Ejercicio inválido.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * No usamos solamente el ID.
   *
   * Exigimos:
   *
   * ejercicio.id = id solicitado
   * Y
   * ejercicio.trainerId = usuario conectado
   */
  const ejercicio =
    await prisma.exercise.findFirst({
      where: {
        id,
        trainerId,
      },

      select: {
        id: true,
        name: true,

        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

  if (!ejercicio) {
    return Response.json(
      {
        error:
          "Ejercicio no encontrado.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    ejercicio._count.assignments >
    0
  ) {
    return Response.json(
      {
        error:
          "El ejercicio está utilizado en un plan y no puede eliminarse.",
      },
      {
        status: 409,
      }
    );
  }

  try {
    await prisma.exercise.delete({
      where: {
        id: ejercicio.id,
      },
    });

    return Response.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Error eliminando ejercicio:",
      error
    );

    return Response.json(
      {
        error:
          "No se pudo eliminar el ejercicio.",
      },
      {
        status: 500,
      }
    );
  }
}