import Link from "next/link";

import UserAvatar from "@/components/profile/UserAvatar";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Plus,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth-user";
import { calcularProgresoPlan } from "@/lib/training-metrics";

function formatearFecha(
  fecha: Date | null
) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(fecha);
}

function iniciales(
  nombre: string
) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (parte) =>
        parte[0]
    )
    .join("")
    .toUpperCase();
}

export default async function TrainerDashboardPage() {
  /*
   * ============================================
   * ENTRENADOR AUTENTICADO
   * ============================================
   */

  const trainer =
    await requireTrainer();

  /*
   * ============================================
   * CLIENTES + PLAN ACTIVO
   * ============================================
   */

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
        id: true,
        status: true,
        joinedAt: true,

        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,

            profile: {
              select: {
                goal: true,
              },
            },

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
          },
        },
      },
    });

  /*
   * IDs de los planes actualmente activos.
   */
  const planIds =
    relaciones
      .map(
        (relacion) =>
          relacion.client
            .plansReceived[0]?.id
      )
      .filter(
        (
          id
        ): id is string =>
          Boolean(id)
      );

  /*
   * ============================================
   * SESIONES COMPLETADAS DE PLANES ACTIVOS
   * ============================================
   */

  const sesionesPlan =
    planIds.length > 0
      ? await prisma.workoutSession.findMany({
          where: {
            trainerId:
              trainer.id,

            status:
              "COMPLETED",

            planId: {
              in: planIds,
            },
          },

          select: {
            planId: true,
            weekNumber: true,
            dayPosition: true,
          },
        })
      : [];

  /*
   * Agrupar sesiones por plan.
   */
  const sesionesPorPlan =
    new Map<
      string,
      {
        weekNumber: number;
        dayPosition: number | null;
      }[]
    >();

  for (
    const sesion of sesionesPlan
  ) {
    if (!sesion.planId) {
      continue;
    }

    const actuales =
      sesionesPorPlan.get(
        sesion.planId
      ) ?? [];

    actuales.push({
      weekNumber:
        sesion.weekNumber,

      dayPosition:
        sesion.dayPosition,
    });

    sesionesPorPlan.set(
      sesion.planId,
      actuales
    );
  }

  /*
   * ============================================
   * ENTRENAMIENTOS RECIENTES
   * ============================================
   */

  const haceSieteDias =
    new Date();

  haceSieteDias.setDate(
    haceSieteDias.getDate() -
      7
  );

  const [
    entrenamientosRecientes,
    entrenamientosUltimos7Dias,
  ] = await Promise.all([
    prisma.workoutSession.findMany({
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

      take: 5,

      select: {
        id: true,
        dayName: true,
        weekNumber: true,
        completedAt: true,

        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.workoutSession.count({
      where: {
        trainerId:
          trainer.id,

        status:
          "COMPLETED",

        completedAt: {
          gte:
            haceSieteDias,
        },
      },
    }),
  ]);

  /*
   * ============================================
   * ESTADÍSTICAS POR CLIENTE
   * ============================================
   */

  const clientes =
    relaciones.map(
      (relacion) => {
        const plan =
          relacion.client
            .plansReceived[0] ??
          null;

        const progreso =
          plan
            ? calcularProgresoPlan(
                plan.weeks,
                sesionesPorPlan.get(
                  plan.id
                ) ?? []
              )
            : null;

        return {
          ...relacion,

          plan,

          progreso,
        };
      }
    );

  /*
   * ============================================
   * MÉTRICAS GENERALES
   * ============================================
   */

  const activos =
    relaciones.filter(
      (relacion) =>
        relacion.status ===
        "ACTIVE"
    ).length;

  const revisar =
    relaciones.filter(
      (relacion) =>
        relacion.status ===
        "REVIEW"
    ).length;

  const progresosValidos =
    clientes
      .map(
        (cliente) =>
          cliente.progreso
      )
      .filter(
        (
          progreso
        ): progreso is NonNullable<
          typeof progreso
        > =>
          Boolean(
            progreso &&
              progreso.totalSesiones >
                0
          )
      );

  const adherenciaMedia =
    progresosValidos.length >
    0
      ? Math.round(
          progresosValidos.reduce(
            (
              total,
              progreso
            ) =>
              total +
              progreso.porcentaje,
            0
          ) /
            progresosValidos.length
        )
      : null;

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            Panel del entrenador
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Hola,{" "}
            {trainer.name?.split(
              " "
            )[0] ??
              "Entrenador"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Este es el estado actual
            de tus clientes.
          </p>
        </div>

        <Link
          href="/trainer/clientes/nuevo"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} />

          Nuevo cliente
        </Link>
      </header>

      {/* MÉTRICAS */}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Clientes
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {
                  relaciones.length
                }
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Users
                size={21}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Activos
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {activos}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <UserCheck
                size={21}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Por revisar
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {revisar}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <TriangleAlert
                size={21}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Progreso medio
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {adherenciaMedia !==
                null
                  ? `${adherenciaMedia}%`
                  : "—"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Planes activos
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2
                size={21}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SEGUNDA MÉTRICA */}

      <section className="mt-4">
        <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <Dumbbell
            size={18}
            className="text-emerald-600"
          />

          <span className="text-slate-500">
            Entrenamientos completados
            en los últimos 7 días:
          </span>

          <strong className="text-slate-900">
            {
              entrenamientosUltimos7Dias
            }
          </strong>
        </div>
      </section>

      {/* CONTENIDO */}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* CLIENTES */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="font-bold text-slate-900">
                Clientes recientes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Progreso de sus
                programas activos.
              </p>
            </div>

            <Link
              href="/trainer/clientes"
              className="text-sm font-semibold text-emerald-700"
            >
              Ver todos
            </Link>
          </div>

          {clientes.length >
          0 ? (
            <div className="divide-y divide-slate-100">
              {clientes
                .slice(0, 6)
                .map(
                  (
                    cliente
                  ) => (
                    <Link
                      key={
                        cliente
                          .client
                          .id
                      }
                      href={`/trainer/clientes/${cliente.client.id}`}
                      className="flex items-center gap-4 p-5 transition hover:bg-slate-50"
                    >
                      <UserAvatar
                        name={
                          cliente.client.name
                        }
                        avatarUrl={
                          cliente.client.avatarUrl
                        }
                        size="lg"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-1 sm:flex-row">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {
                                cliente
                                  .client
                                  .name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {cliente
                                .plan
                                ?.name ??
                                "Sin plan activo"}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold text-slate-900">
                              {cliente.progreso
                                ? `${cliente.progreso.porcentaje}%`
                                : "—"}
                            </p>

                            {cliente.progreso && (
                              <p className="text-xs text-slate-400">
                                {
                                  cliente
                                    .progreso
                                    .sesionesCompletadas
                                }
                                /
                                {
                                  cliente
                                    .progreso
                                    .totalSesiones
                                }{" "}
                                sesiones
                              </p>
                            )}
                          </div>
                        </div>

                        {cliente.progreso &&
                          cliente
                            .progreso
                            .totalSesiones >
                            0 && (
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{
                                  width: `${cliente.progreso.porcentaje}%`,
                                }}
                              />
                            </div>
                          )}
                      </div>

                      <ArrowRight
                        size={17}
                        className="shrink-0 text-slate-300"
                      />
                    </Link>
                  )
                )}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-500">
              Todavía no tienes
              clientes.
            </div>
          )}
        </div>

        {/* ENTRENAMIENTOS RECIENTES */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">
              Entrenamientos recientes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Actividad real de tus
              clientes.
            </p>
          </div>

          {entrenamientosRecientes.length >
          0 ? (
            <div className="divide-y divide-slate-100">
              {entrenamientosRecientes.map(
                (
                  sesion
                ) => (
                  <Link
                    key={
                      sesion.id
                    }
                    href={`/trainer/clientes/${sesion.client.id}`}
                    className="flex items-start gap-3 p-5 transition hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Dumbbell
                        size={18}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {
                          sesion
                            .client
                            .name
                        }
                      </p>

                      <p className="mt-0.5 text-sm text-slate-600">
                        {
                          sesion.dayName
                        }{" "}
                        · Semana{" "}
                        {
                          sesion.weekNumber
                        }
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock3
                          size={
                            13
                          }
                        />

                        {formatearFecha(
                          sesion.completedAt
                        )}
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Dumbbell
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Sin entrenamientos
                completados todavía
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}