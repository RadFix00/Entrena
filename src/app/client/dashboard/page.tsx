import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  History,
  Scale,
  Target,
  Timer,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { notFound } from "next/navigation";

import prisma from "@/lib/prisma";
import { requireClient } from "@/lib/auth-user";

import StartWorkoutButton from "@/components/client/StartWorkoutButton";
import UserAvatar from "@/components/profile/UserAvatar";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function claveDia(
  semana: number,
  posicion: number
) {
  return `${semana}:${posicion}`;
}

function formatearFecha(
  fecha: Date | null
) {
  if (!fecha) {
    return "Sin registros";
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

/*
 * ============================================================
 * DASHBOARD CLIENTE
 * ============================================================
 */

export default async function ClientDashboardPage() {
  /*
   * =============================================
   * 1. CLIENTE AUTENTICADO
   * =============================================
   */

  const currentUser =
    await requireClient();

  /*
   * =============================================
   * 2. CLIENTE + PERFIL + ENTRENADOR + PLAN
   * =============================================
   */

  const cliente =
    await prisma.user.findUnique({
      where: {
        id:
          currentUser.id,
      },

      select: {
        id: true,
        name: true,
        email: true,

        /*
         * Avatar del cliente.
         */
        avatarUrl: true,

        profile: {
          select: {
            goal: true,

            currentWeightKg:
              true,

            startWeightKg:
              true,

            heightCm:
              true,
          },
        },

        /*
         * Entrenador activo del cliente.
         */
        clientTrainers: {
          where: {
            status:
              "ACTIVE",
          },

          orderBy: {
            joinedAt:
              "desc",
          },

          take: 1,

          select: {
            trainer: {
              select: {
                id: true,
                name: true,

                /*
                 * Avatar del entrenador.
                 */
                avatarUrl:
                  true,
              },
            },
          },
        },

        /*
         * El cliente solamente puede
         * ver planes ACTIVE.
         */
        plansReceived: {
          where: {
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
            objective: true,
            startDate: true,

            weeks: {
              orderBy: {
                number:
                  "asc",
              },

              select: {
                id: true,
                number: true,

                days: {
                  orderBy: {
                    position:
                      "asc",
                  },

                  select: {
                    id: true,
                    name: true,
                    description:
                      true,
                    position: true,

                    exercises: {
                      orderBy: {
                        position:
                          "asc",
                      },

                      select: {
                        id: true,

                        sets: true,
                        reps: true,
                        loadKg: true,

                        restSeconds:
                          true,

                        notes: true,

                        exercise: {
                          select: {
                            id: true,
                            name: true,

                            muscleGroup:
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
        },
      },
    });

  /*
   * Si Auth.js tiene una sesión pero
   * el usuario ya no existe en DB.
   */
  if (!cliente) {
    notFound();
  }

  /*
   * =============================================
   * 3. DATOS PRINCIPALES
   * =============================================
   */

  const perfil =
    cliente.profile;

  const entrenador =
    cliente.clientTrainers[0]
      ?.trainer ??
    null;

  const plan =
    cliente.plansReceived[0] ??
    null;

  /*
   * =============================================
   * 4. SESIÓN EN PROGRESO
   * =============================================
   */

  const sesionEnProgreso =
    await prisma.workoutSession.findFirst({
      where: {
        clientId:
          cliente.id,

        status:
          "IN_PROGRESS",
      },

      orderBy: {
        startedAt:
          "desc",
      },

      select: {
        id: true,
        dayName: true,
        weekNumber: true,
        startedAt: true,
      },
    });

  /*
   * =============================================
   * 5. SESIONES COMPLETADAS DEL PLAN ACTUAL
   * =============================================
   */

  const sesionesCompletadas =
    plan
      ? await prisma.workoutSession.findMany({
          where: {
            clientId:
              cliente.id,

            planId:
              plan.id,

            status:
              "COMPLETED",
          },

          orderBy: {
            completedAt:
              "desc",
          },

          select: {
            id: true,

            workoutDayId:
              true,

            weekNumber:
              true,

            dayPosition:
              true,

            dayName:
              true,

            completedAt:
              true,
          },
        })
      : [];

  /*
   * =============================================
   * 6. CONVERTIR SEMANAS -> LISTA DE DÍAS
   * =============================================
   */

  const diasPlan =
    plan?.weeks.flatMap(
      (semana) =>
        semana.days.map(
          (dia) => ({
            ...dia,

            weekNumber:
              semana.number,
          })
        )
    ) ?? [];

  /*
   * =============================================
   * 7. DÍAS COMPLETADOS
   * =============================================
   */

  const idsCompletados =
    new Set(
      sesionesCompletadas
        .map(
          (sesion) =>
            sesion.workoutDayId
        )
        .filter(
          (
            id
          ): id is string =>
            Boolean(id)
        )
    );

  /*
   * También usamos weekNumber +
   * dayPosition como fallback.
   *
   * Esto ayuda a conservar el progreso
   * incluso si el plan fue reconstruido.
   */
  const clavesCompletadas =
    new Set(
      sesionesCompletadas
        .filter(
          (sesion) =>
            sesion.dayPosition !==
            null
        )
        .map(
          (sesion) =>
            claveDia(
              sesion.weekNumber,
              sesion.dayPosition!
            )
        )
    );

  function estaCompletado(
    dia: {
      id: string;
      weekNumber: number;
      position: number;
    }
  ) {
    return (
      idsCompletados.has(
        dia.id
      ) ||
      clavesCompletadas.has(
        claveDia(
          dia.weekNumber,
          dia.position
        )
      )
    );
  }

  /*
   * =============================================
   * 8. PRÓXIMO ENTRENAMIENTO
   * =============================================
   */

  const proximoEntrenamiento =
    diasPlan.find(
      (dia) =>
        !estaCompletado(dia)
    ) ?? null;

  /*
   * =============================================
   * 9. MÉTRICAS
   * =============================================
   */

  const totalDias =
    diasPlan.length;

  const diasCompletados =
    new Set(
      diasPlan
        .filter(
          estaCompletado
        )
        .map((dia) =>
          claveDia(
            dia.weekNumber,
            dia.position
          )
        )
    ).size;

  const adherencia =
    totalDias > 0
      ? Math.round(
          (diasCompletados /
            totalDias) *
            100
        )
      : 0;

  const planCompletado =
    Boolean(plan) &&
    totalDias > 0 &&
    diasCompletados >=
      totalDias;

  const ultimaSesion =
    sesionesCompletadas[0] ??
    null;

  const pesoActual =
    perfil?.currentWeightKg !=
    null
      ? Number(
          perfil.currentWeightKg
        )
      : null;

  /*
   * =============================================
   * RENDER
   * =============================================
   */

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* ======================================= */}
      {/* HEADER */}
      {/* ======================================= */}

      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        {/* CLIENTE */}

        <div className="flex items-center gap-4">
          {/*
           * Al tocar su avatar,
           * el cliente entra a /perfil
           * para cambiar la fotografía.
           */}
          <Link
            href="/perfil"
            title="Editar foto de perfil"
            className="shrink-0"
          >
            <UserAvatar
              name={
                cliente.name
              }
              avatarUrl={
                cliente.avatarUrl
              }
              size="lg"
              className="transition hover:ring-2 hover:ring-emerald-400"
            />
          </Link>

          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Entrena
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Hola,{" "}
              {cliente.name.split(
                " "
              )[0]}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Aquí tienes tu progreso y
              próximo entrenamiento.
            </p>
          </div>
        </div>

        {/* ACCIONES + ENTRENADOR */}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* PROGRESO FÍSICO */}

          <Link
            href="/client/progreso"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <TrendingUp
              size={17}
            />

            Mi progreso
          </Link>

          <Link
            href="/client/fuerza"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Dumbbell
              size={17}
            />

            Mi fuerza
          </Link>

          {/* HISTORIAL */}

          <Link
            href="/client/historial"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <History
              size={17}
            />

            Historial
          </Link>
          <Link
            href="/client/calendario"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <CalendarDays
              size={17}
            />

            Mi calendario
          </Link>

          {/* ENTRENADOR */}

          {entrenador ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <UserAvatar
                name={
                  entrenador.name
                }
                avatarUrl={
                  entrenador.avatarUrl
                }
                size="md"
              />

              <div>
                <p className="text-xs text-slate-400">
                  Entrenador
                </p>

                <p className="text-sm font-semibold text-slate-800">
                  {
                    entrenador.name
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs text-slate-400">
                Entrenador
              </p>

              <p className="text-sm font-semibold text-slate-800">
                Sin entrenador activo
              </p>
            </div>
          )}
        </div>
      </header>

      {/* ======================================= */}
      {/* SESIÓN EN PROGRESO */}
      {/* ======================================= */}

      {sesionEnProgreso && (
        <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Timer
                  size={21}
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Entrenamiento en progreso
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {
                    sesionEnProgreso.dayName
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Semana{" "}
                  {
                    sesionEnProgreso.weekNumber
                  }
                </p>
              </div>
            </div>

            <Link
              href={`/client/entrenamientos/${sesionEnProgreso.id}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 text-sm font-bold text-white transition hover:bg-amber-700"
            >
              Continuar entrenamiento

              <ArrowRight
                size={17}
              />
            </Link>
          </div>
        </section>
      )}

      {/* ======================================= */}
      {/* MÉTRICAS */}
      {/* ======================================= */}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* OBJETIVO */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Target
            size={20}
            className="text-emerald-600"
          />

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Objetivo
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {plan?.objective ??
              perfil?.goal ??
              "Sin definir"}
          </p>
        </div>

        {/* PESO */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Scale
            size={20}
            className="text-violet-600"
          />

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Peso actual
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {pesoActual !== null
              ? `${pesoActual} kg`
              : "—"}
          </p>

          <Link
            href="/client/progreso"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
          >
            Ver progreso

            <ArrowRight
              size={13}
            />
          </Link>
        </div>

        {/* SESIONES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CalendarDays
            size={20}
            className="text-blue-600"
          />

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sesiones
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {diasCompletados}

            <span className="text-base font-medium text-slate-400">
              /{totalDias}
            </span>
          </p>
        </div>

        {/* PROGRESO DEL PLAN */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CheckCircle2
            size={20}
            className="text-emerald-600"
          />

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Progreso del plan
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {plan
              ? `${adherencia}%`
              : "—"}
          </p>

          {plan && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${adherencia}%`,
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* ======================================= */}
      {/* ÚLTIMO ENTRENAMIENTO */}
      {/* ======================================= */}

      {ultimaSesion && (
        <section className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Último entrenamiento
            </p>

            <p className="mt-1 font-bold text-slate-900">
              {
                ultimaSesion.dayName
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {formatearFecha(
                ultimaSesion.completedAt
              )}
            </p>
          </div>

          <Link
            href={`/client/entrenamientos/${ultimaSesion.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
          >
            Ver sesión

            <ArrowRight
              size={16}
            />
          </Link>
        </section>
      )}

      {/* ======================================= */}
      {/* SIN PLAN */}
      {/* ======================================= */}

      {!plan && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Dumbbell
              size={28}
            />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Aún no tienes un plan activo
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Tu entrenador todavía no ha
            publicado tu plan de
            entrenamiento.
          </p>
        </section>
      )}

      {/* ======================================= */}
      {/* PLAN ACTIVO */}
      {/* ======================================= */}

      {plan && (
        <>
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Plan activo
                </span>

                <h2 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
                  {
                    plan.name
                  }
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {plan.objective ??
                    perfil?.goal ??
                    "Sin objetivo especificado"}
                </p>
              </div>

              <div className="flex gap-3">
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-slate-900">
                    {
                      plan.weeks.length
                    }
                  </p>

                  <p className="text-xs text-slate-500">
                    semanas
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-slate-900">
                    {
                      totalDias
                    }
                  </p>

                  <p className="text-xs text-slate-500">
                    sesiones
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================== */}
          {/* PLAN COMPLETADO */}
          {/* =================================== */}

          {planCompletado &&
            !sesionEnProgreso && (
              <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Trophy
                    size={26}
                  />
                </div>

                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  ¡Plan completado!
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Has completado las{" "}
                  {totalDias} sesiones
                  de este programa.
                </p>

                <Link
                  href="/client/historial"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Ver historial

                  <History
                    size={17}
                  />
                </Link>
              </section>
            )}

          {/* =================================== */}
          {/* PRÓXIMO ENTRENAMIENTO */}
          {/* =================================== */}

          {!planCompletado &&
            proximoEntrenamiento &&
            !sesionEnProgreso && (
              <section className="mt-6">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-emerald-700">
                    Próximo entrenamiento
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {
                      proximoEntrenamiento.name
                    }
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Semana{" "}
                    {
                      proximoEntrenamiento.weekNumber
                    }
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {proximoEntrenamiento.description && (
                    <div className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">
                      {
                        proximoEntrenamiento.description
                      }
                    </div>
                  )}

                  {/* EJERCICIOS */}

                  <div className="divide-y divide-slate-100">
                    {proximoEntrenamiento.exercises.map(
                      (
                        asignacion,
                        index
                      ) => (
                        <div
                          key={
                            asignacion.id
                          }
                          className="flex items-start gap-4 p-5"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                            {index +
                              1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                              <div>
                                <p className="font-bold text-slate-900">
                                  {
                                    asignacion
                                      .exercise
                                      .name
                                  }
                                </p>

                                <p className="mt-0.5 text-xs font-medium text-emerald-700">
                                  {asignacion
                                    .exercise
                                    .muscleGroup ??
                                    "Ejercicio"}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
                                  {
                                    asignacion.sets
                                  }{" "}
                                  series
                                </span>

                                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
                                  {
                                    asignacion.reps
                                  }{" "}
                                  reps
                                </span>

                                {asignacion.loadKg !==
                                  null && (
                                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
                                    {asignacion.loadKg.toString()}{" "}
                                    kg
                                  </span>
                                )}

                                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
                                  {
                                    asignacion.restSeconds
                                  }
                                  s descanso
                                </span>
                              </div>
                            </div>

                            {asignacion.notes && (
                              <p className="mt-3 text-sm text-slate-500">
                                {
                                  asignacion.notes
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* INICIAR */}

                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                    <StartWorkoutButton
                      workoutDayId={
                        proximoEntrenamiento.id
                      }
                    />
                  </div>
                </div>
              </section>
            )}
        </>
      )}
    </main>
  );
}