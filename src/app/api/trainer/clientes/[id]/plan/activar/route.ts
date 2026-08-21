import prisma from "@/lib/prisma";
import { requireApiTrainer } from "@/lib/api-auth";

async function verificarCliente(
  trainerId: string,
  clientId: string
) {
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
      },
    });

  return Boolean(relacion);
}

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Nos permite saber si el plan actual
 * está en borrador o activo.
 */
export async function GET(
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

  const { id: clientId } =
    await params;

  if (!clientId) {
    return Response.json(
      {
        error: "Cliente inválido.",
      },
      {
        status: 400,
      }
    );
  }

  const pertenece =
    await verificarCliente(
      trainerId,
      clientId
    );

  if (!pertenece) {
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

  const plan =
    await prisma.trainingPlan.findFirst({
      where: {
        trainerId,
        clientId,

        status: {
          in: [
            "DRAFT",
            "ACTIVE",
          ],
        },
      },

      orderBy: {
        updatedAt: "desc",
      },

      select: {
        id: true,
        status: true,
      },
    });

  return Response.json({
    planId:
      plan?.id ?? null,

    status:
      plan?.status ?? null,
  });
}

/*
 * ============================================================
 * POST
 * ============================================================
 *
 * Activa el plan actual.
 *
 * Si ya existía otro plan ACTIVE,
 * lo archivamos.
 */
export async function POST(
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

  const { id: clientId } =
    await params;

  if (!clientId) {
    return Response.json(
      {
        error: "Cliente inválido.",
      },
      {
        status: 400,
      }
    );
  }

  /*
   * Comprobar ownership.
   */
  const pertenece =
    await verificarCliente(
      trainerId,
      clientId
    );

  if (!pertenece) {
    return Response.json(
      {
        error:
          "El cliente no pertenece al entrenador.",
      },
      {
        status: 404,
      }
    );
  }

  /*
   * Buscar el plan que actualmente
   * estamos editando.
   */
  const plan =
    await prisma.trainingPlan.findFirst({
      where: {
        trainerId,
        clientId,

        status: {
          in: [
            "DRAFT",
            "ACTIVE",
          ],
        },
      },

      orderBy: {
        updatedAt: "desc",
      },

      select: {
        id: true,
        status: true,
        startDate: true,
      },
    });

  if (!plan) {
    return Response.json(
      {
        error:
          "Primero debes guardar el plan.",
      },
      {
        status: 404,
      }
    );
  }

  /*
   * Si ya está activo no hacemos
   * escrituras innecesarias.
   */
  if (plan.status === "ACTIVE") {
    return Response.json({
      ok: true,

      planId:
        plan.id,

      status:
        "ACTIVE",

      message:
        "El plan ya está activo.",
    });
  }

  const ahora =
    new Date();

  /*
   * Todo ocurre dentro de una transacción:
   *
   * 1. Archivar cualquier ACTIVE anterior.
   * 2. Activar este DRAFT.
   */
  await prisma.$transaction(
    async (tx) => {
      await tx.trainingPlan.updateMany({
        where: {
          trainerId,
          clientId,

          status:
            "ACTIVE",

          id: {
            not:
              plan.id,
          },
        },

        data: {
          status:
            "ARCHIVED",

          endDate:
            ahora,
        },
      });

      await tx.trainingPlan.update({
        where: {
          id:
            plan.id,
        },

        data: {
          status:
            "ACTIVE",

          startDate:
            plan.startDate ??
            ahora,

          endDate:
            null,
        },
      });
    }
  );

  return Response.json({
    ok: true,

    planId:
      plan.id,

    status:
      "ACTIVE",

    message:
      "Plan activado correctamente.",
  });
}