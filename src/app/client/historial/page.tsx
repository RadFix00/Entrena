import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Gauge,
  History,
  Timer,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { requireClient } from "@/lib/auth-user";

function formatearFecha(
  fecha: Date
) {
  return new Intl.DateTimeFormat(
    "es-CO",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(fecha);
}

function calcularDuracion(
  inicio: Date,
  final: Date | null
) {
  if (!final) {
    return null;
  }

  const minutos =
    Math.max(
      1,
      Math.round(
        (final.getTime() -
          inicio.getTime()) /
          60000
      )
    );

  return minutos;
}

export default async function HistorialPage() {
  const currentUser =
    await requireClient();

  /*
   * =============================================
   * HISTORIAL COMPLETO DEL CLIENTE
   * =============================================
   */

  const sesiones =
    await prisma.workoutSession.findMany({
      where: {
        clientId:
          currentUser.id,

        status:
          "COMPLETED",
      },

      orderBy: {
        completedAt:
          "desc",
      },

      take: 100,

      select: {
        id: true,
        planName: true,
        weekNumber: true,
        dayName: true,
        startedAt: true,
        completedAt: true,
        notes: true,

        exercises: {
          orderBy: {
            position:
              "asc",
          },

          select: {
            id: true,
            exerciseName: true,
            muscleGroup: true,

            prescribedSets:
              true,

            prescribedReps:
              true,

            sets: {
              orderBy: {
                setNumber:
                  "asc",
              },

              select: {
                id: true,
                setNumber: true,
                reps: true,
                loadKg: true,
                completed: true,
              },
            },
          },
        },
      },
    });

  /*
   * =============================================
   * CALCULAR RESUMEN POR SESIÓN
   * =============================================
   */

  const resumenes =
    sesiones.map(
      (sesion) => {
        let totalSeries = 0;
        let seriesCompletadas = 0;
        let volumen = 0;

        for (
          const ejercicio of
          sesion.exercises
        ) {
          totalSeries +=
            ejercicio.sets.length;

          for (
            const serie of
            ejercicio.sets
          ) {
            if (
              !serie.completed
            ) {
              continue;
            }

            seriesCompletadas++;

            if (
              serie.reps !==
                null &&
              serie.loadKg !==
                null
            ) {
              volumen +=
                serie.reps *
                Number(
                  serie.loadKg
                );
            }
          }
        }

        return {
          ...sesion,

          totalSeries,

          seriesCompletadas,

          volumen,

          duracion:
            calcularDuracion(
              sesion.startedAt,
              sesion.completedAt
            ),
        };
      }
    );

  /*
   * =============================================
   * TOTALES
   * =============================================
   */

  const totalSesiones =
    resumenes.length;

  const totalSeries =
    resumenes.reduce(
      (
        total,
        sesion
      ) =>
        total +
        sesion.seriesCompletadas,
      0
    );

  const volumenTotal =
    resumenes.reduce(
      (
        total,
        sesion
      ) =>
        total +
        sesion.volumen,
      0
    );

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* ========================================= */}
      {/* VOLVER */}
      {/* ========================================= */}

      <Link
        href="/client/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver al dashboard
      </Link>

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <header>
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <History
            size={18}
          />

          Entrenamientos
        </div>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Mi historial
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Todas tus sesiones
          completadas en Entrena.
        </p>
      </header>

      {/* ========================================= */}
      {/* MÉTRICAS */}
      {/* ========================================= */}

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CalendarDays
            size={20}
            className="text-blue-600"
          />

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Entrenamientos
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {totalSesiones}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CheckCircle2
            size={20}
            className="text-emerald-600"
          />

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Series realizadas
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {totalSeries}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Gauge
            size={20}
            className="text-violet-600"
          />

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Volumen registrado
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {volumenTotal.toLocaleString(
              "es-CO",
              {
                maximumFractionDigits:
                  1,
              }
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            kg × repeticiones
          </p>
        </div>
      </section>

      {/* ========================================= */}
      {/* VACÍO */}
      {/* ========================================= */}

      {resumenes.length ===
        0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Dumbbell
              size={28}
            />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Aún no tienes
            entrenamientos completados
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Cuando finalices tu primer
            entrenamiento aparecerá
            aquí.
          </p>

          <Link
            href="/client/dashboard"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            Ir al entrenamiento

            <ArrowRight
              size={17}
            />
          </Link>
        </section>
      )}

      {/* ========================================= */}
      {/* SESIONES */}
      {/* ========================================= */}

      <section className="mt-6 space-y-4">
        {resumenes.map(
          (sesion) => (
            <article
              key={
                sesion.id
              }
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* CABECERA */}

              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Completado
                    </span>

                    <span className="text-xs font-medium text-slate-400">
                      Semana{" "}
                      {
                        sesion.weekNumber
                      }
                    </span>
                  </div>

                  <h2 className="mt-2 text-lg font-bold text-slate-900">
                    {
                      sesion.dayName
                    }
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      sesion.planName
                    }
                  </p>

                  {sesion.completedAt && (
                    <p className="mt-2 text-xs text-slate-400">
                      {formatearFecha(
                        sesion.completedAt
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {sesion.duracion !==
                    null && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                      <Timer
                        size={14}
                      />

                      {
                        sesion.duracion
                      }{" "}
                      min
                    </div>
                  )}

                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                    {
                      sesion.seriesCompletadas
                    }
                    /
                    {
                      sesion.totalSeries
                    }{" "}
                    series
                  </div>

                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                    {sesion.volumen.toLocaleString(
                      "es-CO",
                      {
                        maximumFractionDigits:
                          1,
                      }
                    )}{" "}
                    kg·rep
                  </div>
                </div>
              </div>

              {/* EJERCICIOS */}

              <div className="divide-y divide-slate-100">
                {sesion.exercises.map(
                  (
                    ejercicio
                  ) => {
                    const seriesHechas =
                      ejercicio.sets.filter(
                        (
                          serie
                        ) =>
                          serie.completed
                      );

                    const cargas =
                      seriesHechas
                        .map(
                          (
                            serie
                          ) =>
                            serie.loadKg !==
                            null
                              ? Number(
                                  serie.loadKg
                                )
                              : null
                        )
                        .filter(
                          (
                            carga
                          ): carga is number =>
                            carga !==
                            null
                        );

                    const cargaMax =
                      cargas.length >
                      0
                        ? Math.max(
                            ...cargas
                          )
                        : null;

                    return (
                      <div
                        key={
                          ejercicio.id
                        }
                        className="flex items-center justify-between gap-4 px-5 py-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {
                              ejercicio.exerciseName
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {
                              seriesHechas.length
                            }{" "}
                            series realizadas
                          </p>
                        </div>

                        {cargaMax !==
                          null && (
                          <p className="shrink-0 text-sm font-bold text-slate-700">
                            Máx.{" "}
                            {
                              cargaMax
                            }{" "}
                            kg
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              {/* NOTAS */}

              {sesion.notes && (
                <div className="border-t border-slate-100 bg-amber-50/50 px-5 py-3 text-sm text-slate-600">
                  <strong>
                    Notas:
                  </strong>{" "}
                  {
                    sesion.notes
                  }
                </div>
              )}

              {/* VER DETALLE */}

              <div className="border-t border-slate-100 p-4">
                <Link
                  href={`/client/entrenamientos/${sesion.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
                >
                  Ver entrenamiento
                  completo

                  <ArrowRight
                    size={16}
                  />
                </Link>
              </div>
            </article>
          )
        )}
      </section>
    </main>
  );
}