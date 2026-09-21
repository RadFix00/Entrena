import prisma from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth-user";
import { calcularProgresoPlan } from "@/lib/training-metrics";
import { obtenerIniciales } from "@/lib/helpers";
import { formatearFecha } from "@/lib/format";

import ClientesClient, {
  type ClienteUI,
} from "@/components/trainer/ClientesClient";

function convertirEstado(
  estado:
    | "ACTIVE"
    | "REVIEW"
    | "PAUSED"
): ClienteUI["estado"] {
  switch (estado) {
    case "ACTIVE":
      return "Activo";

    case "REVIEW":
      return "Revisar";

    case "PAUSED":
      return "Pausado";
  }
}

export default async function ClientesPage() {
  const trainer =
    await requireTrainer();

  const relaciones =
    await prisma.trainerClient.findMany({
      where: {
        trainerId:
          trainer.id,
      },

      orderBy: {
        joinedAt:
          "desc",
      },

      select: {
        status: true,

        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,

            plansReceived: {
              where: {
                trainerId:
                  trainer.id,

                status:
                  "ACTIVE",
              },

              orderBy: {
                updatedAt:
                  "desc",
              },

              take: 1,

              select: {
                id: true,
                name: true,

                weeks: {
                  orderBy: {
                    number:
                      "asc",
                  },

                  select: {
                    number: true,

                    days: {
                      orderBy: {
                        position:
                          "asc",
                      },

                      select: {
                        position:
                          true,
                      },
                    },
                  },
                },
              },
            },

            workoutSessionsAsClient: {
              where: {
                trainerId:
                  trainer.id,

                status:
                  "COMPLETED",
              },

              orderBy: {
                completedAt:
                  "desc",
              },

              select: {
                planId: true,
                weekNumber: true,
                dayPosition: true,
                completedAt: true,
              },
            },
          },
        },
      },
    });

  const clientes: ClienteUI[] =
    relaciones.map(
      (relacion) => {
        const usuario =
          relacion.client;

        const plan =
          usuario
            .plansReceived[0] ??
          null;

        const sesionesPlan =
          plan
            ? usuario.workoutSessionsAsClient.filter(
                (sesion) =>
                  sesion.planId ===
                  plan.id
              )
            : [];

        const progreso =
          plan
            ? calcularProgresoPlan(
                plan.weeks,
                sesionesPlan
              )
            : null;

        const ultimaSesion =
          usuario
            .workoutSessionsAsClient[0] ??
          null;

        return {
          id:
            usuario.id,

          nombre:
            usuario.name,

          email:
            usuario.email,

          avatarUrl:
            usuario.avatarUrl,

          iniciales:
            obtenerIniciales(
              usuario.name
            ),

          plan:
            plan?.name ??
            "Sin plan",

          semana:
            progreso
              ? `${progreso.sesionesCompletadas}/${progreso.totalSesiones} sesiones`
              : "Sin programa activo",

          adherencia:
            progreso &&
            progreso.totalSesiones >
              0
              ? progreso.porcentaje
              : null,

          estado:
            convertirEstado(
              relacion.status
            ),

          ultimoEntrenamiento:
            formatearFecha(
              ultimaSesion
                ?.completedAt ??
                null
            ),
        };
      }
    );

  return (
    <ClientesClient
      clientes={clientes}
    />
  );
}