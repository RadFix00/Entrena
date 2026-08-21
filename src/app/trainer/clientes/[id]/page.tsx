import Link from "next/link";

import UserAvatar from "@/components/profile/UserAvatar";

import {
  notFound,
} from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Mail,
  Pencil,
  TrendingUp,
  Phone,
  Scale,
  Target,
  User,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth-user";
import { calcularProgresoPlan } from "@/lib/training-metrics";

function obtenerIniciales(
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

function calcularEdad(
  fecha: Date | null | undefined
) {
  if (!fecha) {
    return null;
  }

  const hoy =
    new Date();

  let edad =
    hoy.getFullYear() -
    fecha.getFullYear();

  const diferenciaMes =
    hoy.getMonth() -
    fecha.getMonth();

  if (
    diferenciaMes < 0 ||
    (diferenciaMes ===
      0 &&
      hoy.getDate() <
        fecha.getDate())
  ) {
    edad--;
  }

  return edad;
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

export default async function ClientePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const trainer =
    await requireTrainer();

  const { id } =
    await params;

  /*
   * ============================================
   * CLIENTE + PLAN ACTIVO
   * ============================================
   */

  const relacion =
    await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId:
            trainer.id,

          clientId:
            id,
        },
      },

      select: {
        status: true,
        notes: true,
        joinedAt: true,

        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,

            profile: {
              select: {
                phone: true,
                birthDate: true,
                goal: true,
                heightCm: true,
                currentWeightKg:
                  true,
                startWeightKg:
                  true,
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
                objective: true,
                startDate: true,
                endDate: true,

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

                        exercises: {
                          select: {
                            id: true,
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

  if (!relacion) {
    notFound();
  }

  const cliente =
    relacion.client;

  const perfil =
    cliente.profile;

  const plan =
    cliente.plansReceived[0] ??
    null;

  /*
   * ============================================
   * SESIONES
   * ============================================
   */

  const [
    sesionesPlan,
    sesionesRecientes,
  ] = await Promise.all([
    plan
      ? prisma.workoutSession.findMany({
          where: {
            trainerId:
              trainer.id,

            clientId:
              cliente.id,

            planId:
              plan.id,

            status:
              "COMPLETED",
          },

          select: {
            weekNumber: true,
            dayPosition: true,
          },
        })
      : Promise.resolve([]),

    prisma.workoutSession.findMany({
      where: {
        trainerId:
          trainer.id,

        clientId:
          cliente.id,

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
        planName: true,
        dayName: true,
        weekNumber: true,
        startedAt: true,
        completedAt: true,

        exercises: {
          select: {
            id: true,

            sets: {
              where: {
                completed:
                  true,
              },

              select: {
                id: true,
                reps: true,
                loadKg: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const progreso =
    plan
      ? calcularProgresoPlan(
          plan.weeks,
          sesionesPlan
        )
      : null;

  const edad =
    calcularEdad(
      perfil?.birthDate
    );

  const pesoActual =
    perfil?.currentWeightKg !=
    null
      ? Number(
          perfil.currentWeightKg
        )
      : null;

  const pesoInicial =
    perfil?.startWeightKg !=
    null
      ? Number(
          perfil.startWeightKg
        )
      : null;

  const cambioPeso =
    pesoActual !== null &&
    pesoInicial !== null
      ? Number(
          (
            pesoActual -
            pesoInicial
          ).toFixed(1)
        )
      : null;

  const ultimaSesion =
    sesionesRecientes[0] ??
    null;

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
      {/* VOLVER */}

      <Link
        href="/trainer/clientes"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver a clientes
      </Link>

      {/* HEADER */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <UserAvatar
              name={cliente.name}
              avatarUrl={cliente.avatarUrl}
              size="xl"
            />

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {cliente.name}
              </h1>

              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-5">
                <div className="flex items-center gap-2">
                  <Mail
                    size={15}
                    className="text-slate-400"
                  />

                  {
                    cliente.email
                  }
                </div>

                <div className="flex items-center gap-2">
                  <Phone
                    size={15}
                    className="text-slate-400"
                  />

                  {perfil?.phone ??
                    "Sin teléfono"}
                </div>

                <div className="flex items-center gap-2">
                  <User
                    size={15}
                    className="text-slate-400"
                  />

                  {edad !== null
                    ? `${edad} años`
                    : "Sin edad"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/trainer/clientes/${cliente.id}/editar`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil
                size={17}
              />

              Editar cliente
            </Link>

            <Link
              href={`/trainer/clientes/${cliente.id}/plan`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <ClipboardList
                size={18}
              />

              Gestionar plan
            </Link>

            <Link
              href={`/trainer/clientes/${cliente.id}/progreso`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <TrendingUp
                size={17}
              />

              Progreso físico
            </Link>
          </div>
        </div>
      </section>

      {/* MÉTRICAS */}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* PROGRESO */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CheckCircle2
            size={21}
            className="text-emerald-600"
          />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Progreso del plan
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {progreso &&
            progreso.totalSesiones >
              0
              ? `${progreso.porcentaje}%`
              : "—"}
          </p>

          {progreso &&
            progreso.totalSesiones >
              0 && (
              <>
                <p className="mt-1 text-xs text-slate-500">
                  {
                    progreso.sesionesCompletadas
                  }
                  /
                  {
                    progreso.totalSesiones
                  }{" "}
                  sesiones
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${progreso.porcentaje}%`,
                    }}
                  />
                </div>
              </>
            )}
        </div>

        {/* PLAN */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Dumbbell
            size={21}
            className="text-blue-600"
          />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Plan actual
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {plan?.name ??
              "Sin plan activo"}
          </p>
        </div>

        {/* PESO */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Scale
            size={21}
            className="text-violet-600"
          />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Peso actual
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {pesoActual !== null
              ? `${pesoActual} kg`
              : "—"}
          </p>

          {cambioPeso !== null && (
            <p className="mt-1 text-xs text-slate-500">
              {cambioPeso > 0
                ? "+"
                : ""}
              {cambioPeso} kg desde
              el inicio
            </p>
          )}
        </div>

        {/* ÚLTIMO */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CalendarDays
            size={21}
            className="text-amber-600"
          />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Último entrenamiento
          </p>

          <p className="mt-2 font-bold text-slate-900">
            {ultimaSesion
              ?.dayName ??
              "Sin registros"}
          </p>

          {ultimaSesion && (
            <p className="mt-1 text-xs text-slate-500">
              {formatearFecha(
                ultimaSesion.completedAt
              )}
            </p>
          )}
        </div>
      </section>

      {/* CONTENIDO */}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* ENTRENAMIENTOS RECIENTES */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="font-bold text-slate-900">
              Entrenamientos
              recientes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sesiones realizadas por
              el cliente.
            </p>
          </div>

          {sesionesRecientes.length >
          0 ? (
            <div className="divide-y divide-slate-100">
              {sesionesRecientes.map(
                (
                  sesion
                ) => {
                  const series =
                    sesion.exercises.flatMap(
                      (
                        ejercicio
                      ) =>
                        ejercicio.sets
                    );

                  const volumen =
                    series.reduce(
                      (
                        total,
                        serie
                      ) => {
                        if (
                          serie.reps ===
                            null ||
                          serie.loadKg ===
                            null
                        ) {
                          return total;
                        }

                        return (
                          total +
                          serie.reps *
                            Number(
                              serie.loadKg
                            )
                        );
                      },
                      0
                    );

                  return (
                    <div
                      key={
                        sesion.id
                      }
                      className="p-5"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row">
                        <div>
                          <p className="font-bold text-slate-900">
                            {
                              sesion.dayName
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              sesion.planName
                            }{" "}
                            · Semana{" "}
                            {
                              sesion.weekNumber
                            }
                          </p>

                          <p className="mt-2 text-xs text-slate-400">
                            {formatearFecha(
                              sesion.completedAt
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                            {
                              sesion
                                .exercises
                                .length
                            }{" "}
                            ejercicios
                          </span>

                          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                            {
                              series.length
                            }{" "}
                            series
                          </span>

                          {volumen >
                            0 && (
                            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                              {volumen.toLocaleString(
                                "es-CO",
                                {
                                  maximumFractionDigits:
                                    1,
                                }
                              )}{" "}
                              kg·rep
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Dumbbell
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-700">
                Sin entrenamientos
                registrados
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* OBJETIVO */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Target
                  size={20}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Objetivo
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {plan?.objective ??
                    perfil?.goal ??
                    "Sin objetivo definido"}
                </p>
              </div>
            </div>
          </div>

          {/* DATOS FÍSICOS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">
              Datos físicos
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Peso inicial
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {pesoInicial !==
                  null
                    ? `${pesoInicial} kg`
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Peso actual
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {pesoActual !==
                  null
                    ? `${pesoActual} kg`
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Altura
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {perfil?.heightCm !=
                  null
                    ? `${Number(
                        perfil.heightCm
                      )} cm`
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Edad
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {edad ??
                    "—"}
                </p>
              </div>
            </div>
          </div>

          {/* NOTAS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">
              Notas del entrenador
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {relacion.notes ??
                "Todavía no hay notas registradas."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}