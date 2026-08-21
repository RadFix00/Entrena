import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";

type NuevoEjercicio = {
  nombre?: string;
  grupoMuscular?: string;
  descripcion?: string;
  videoUrl?: string;
};

/*
 * ============================================================
 * GET
 * ============================================================
 */

export async function GET() {
  const acceso =
    await requireApiTrainer();

  if (!acceso.ok) {
    return acceso.response;
  }

  const trainerId =
    acceso.user.id;

  const ejercicios =
    await prisma.exercise.findMany({
      where: {
        trainerId,
      },

      orderBy: [
        {
          muscleGroup: "asc",
        },
        {
          name: "asc",
        },
      ],

      select: {
        id: true,
        name: true,
        muscleGroup: true,
        description: true,
        videoUrl: true,
      },
    });

  return Response.json({
    ejercicios:
      ejercicios.map(
        (ejercicio) => ({
          id: ejercicio.id,

          nombre:
            ejercicio.name,

          grupoMuscular:
            ejercicio.muscleGroup,

          descripcion:
            ejercicio.description,

          videoUrl:
            ejercicio.videoUrl,
        })
      ),
  });
}

/*
 * ============================================================
 * POST
 * ============================================================
 */

export async function POST(
  request: Request
) {
  const acceso =
    await requireApiTrainer();

  if (!acceso.ok) {
    return acceso.response;
  }

  const trainerId =
    acceso.user.id;

  let body: NuevoEjercicio;

  try {
    body =
      (await request.json()) as NuevoEjercicio;
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

  const nombre =
    body.nombre?.trim();

  if (!nombre) {
    return Response.json(
      {
        error:
          "El nombre del ejercicio es obligatorio.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * El duplicado se comprueba únicamente
   * dentro de la biblioteca del entrenador
   * que inició sesión.
   */
  const existente =
    await prisma.exercise.findFirst({
      where: {
        trainerId,

        name: {
          equals: nombre,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
      },
    });

  if (existente) {
    return Response.json(
      {
        error:
          "Ya existe un ejercicio con ese nombre.",
      },
      {
        status: 409,
      }
    );
  }

  const ejercicio =
    await prisma.exercise.create({
      data: {
        trainerId,

        name: nombre,

        muscleGroup:
          body.grupoMuscular?.trim() ||
          null,

        description:
          body.descripcion?.trim() ||
          null,

        videoUrl:
          body.videoUrl?.trim() ||
          null,
      },

      select: {
        id: true,
        name: true,
        muscleGroup: true,
        description: true,
        videoUrl: true,
        createdAt: true,

        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

  return Response.json(
    {
      ejercicio: {
        id: ejercicio.id,

        nombre:
          ejercicio.name,

        grupoMuscular:
          ejercicio.muscleGroup,

        descripcion:
          ejercicio.description,

        videoUrl:
          ejercicio.videoUrl,

        asignaciones:
          ejercicio._count
            .assignments,

        creadoEn:
          ejercicio.createdAt.toISOString(),
      },
    },
    {
      status: 201,
    }
  );
}