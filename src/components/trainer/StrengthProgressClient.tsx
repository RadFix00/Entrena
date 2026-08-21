"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  Crown,
  Dumbbell,
  Gauge,
  History,
  Medal,
  Repeat2,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import StrengthChart from "@/components/progress/StrengthChart";

import {
  calcularMetricasSesiones,
  calcularVolumenSesion,
  obtenerMejorSerie,
  obtenerPR1RM,
  obtenerPRCarga,
  obtenerPRRepeticiones,
  obtenerPRVolumenSerie,
  obtenerPRVolumenSesion,
} from "@/lib/strength-metrics";

export type FuerzaSetUI = {
  setNumber: number;

  reps:
    | number
    | null;

  loadKg:
    | number
    | null;
};

export type FuerzaSesionUI = {
  sessionId:
    string;

  fecha:
    string;

  dia:
    string;

  sets:
    FuerzaSetUI[];
};

export type FuerzaEjercicioUI = {
  key:
    string;

  exerciseId:
    | string
    | null;

  nombre:
    string;

  grupoMuscular:
    | string
    | null;

  sesiones:
    FuerzaSesionUI[];
};

type Props = {
  ejercicios:
    FuerzaEjercicioUI[];
};

function formatearNumero(
  valor: number
) {
  return new Intl.NumberFormat(
    "es-CO",
    {
      maximumFractionDigits:
        2,
    }
  ).format(valor);
}

function formatearFecha(
  fecha: string
) {
  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(fecha)
  );
}

export default function StrengthProgressClient({
  ejercicios,
}: Props) {
  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    ejercicioKey,
    setEjercicioKey,
  ] = useState(
    ejercicios[0]?.key ??
      ""
  );

  /*
   * ==========================================================
   * BUSCADOR
   * ==========================================================
   */

  const ejerciciosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return ejercicios;
      }

      return ejercicios.filter(
        (ejercicio) =>
          ejercicio.nombre
            .toLowerCase()
            .includes(
              texto
            ) ||
          ejercicio.grupoMuscular
            ?.toLowerCase()
            .includes(
              texto
            )
      );
    }, [
      ejercicios,
      busqueda,
    ]);

  const ejercicio =
    ejercicios.find(
      (item) =>
        item.key ===
        ejercicioKey
    ) ??
    ejercicios[0] ??
    null;

  /*
   * ==========================================================
   * SIN DATOS
   * ==========================================================
   */

  if (
    ejercicios.length ===
    0
  ) {
    return (
      <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Dumbbell
          size={32}
          className="mx-auto text-slate-300"
        />

        <h2 className="mt-4 text-lg font-bold text-slate-800">
          Todavía no hay datos de fuerza
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Cuando el cliente complete entrenamientos registrando repeticiones y cargas, aparecerá aquí su evolución.
        </p>
      </div>
    );
  }

  if (!ejercicio) {
    return null;
  }

  /*
   * ==========================================================
   * MÉTRICAS AVANZADAS
   * ==========================================================
   */

  const prCarga =
    obtenerPRCarga(
      ejercicio.sesiones
    );

  const pr1RM =
    obtenerPR1RM(
      ejercicio.sesiones
    );

  const mejorSerie =
    obtenerMejorSerie(
      ejercicio.sesiones
    );

  const prRepeticiones =
    obtenerPRRepeticiones(
      ejercicio.sesiones
    );

  const prVolumenSerie =
    obtenerPRVolumenSerie(
      ejercicio.sesiones
    );

  const prVolumenSesion =
    obtenerPRVolumenSesion(
      ejercicio.sesiones
    );

  const metricasSesiones =
    calcularMetricasSesiones(
      ejercicio.sesiones
    );

  const sesionesConCarga =
    metricasSesiones.filter(
      (
        sesion
      ): sesion is typeof sesion & {
        maxLoad: number;
      } =>
        sesion.maxLoad !==
        null
    );

  const sesionesCon1RM =
    metricasSesiones.filter(
      (
        sesion
      ): sesion is typeof sesion & {
        estimated1RM:
          number;
      } =>
        sesion.estimated1RM !==
        null
    );

  /*
   * ==========================================================
   * PRIMERA VS ÚLTIMA
   * ==========================================================
   */

  const primer1RM =
    sesionesCon1RM[0]
      ?.estimated1RM ??
    null;

  const ultimo1RM =
    sesionesCon1RM[
      sesionesCon1RM.length -
        1
    ]?.estimated1RM ??
    null;

  const mejora1RM =
    primer1RM !==
      null &&
    ultimo1RM !==
      null
      ? Number(
          (
            ultimo1RM -
            primer1RM
          ).toFixed(2)
        )
      : null;

  const primeraCarga =
    sesionesConCarga[0]
      ?.maxLoad ??
    null;

  const ultimaCarga =
    sesionesConCarga[
      sesionesConCarga.length -
        1
    ]?.maxLoad ??
    null;

  const mejoraCarga =
    primeraCarga !==
      null &&
    ultimaCarga !==
      null
      ? Number(
          (
            ultimaCarga -
            primeraCarga
          ).toFixed(2)
        )
      : null;

  /*
   * ==========================================================
   * VOLUMEN TOTAL
   * ==========================================================
   */

  const volumenTotal =
    ejercicio.sesiones.reduce(
      (
        total,
        sesion
      ) =>
        total +
        calcularVolumenSesion(
          sesion
        ),
      0
    );

  /*
   * ==========================================================
   * GRÁFICAS
   * ==========================================================
   */

  const puntosCarga =
    sesionesConCarga.map(
      (
        sesion,
        index
      ) => ({
        id:
          `load-${sesion.sessionId}-${index}`,

        fecha:
          sesion.fecha,

        carga:
          sesion.maxLoad,
      })
    );

  const puntos1RM =
    sesionesCon1RM.map(
      (
        sesion,
        index
      ) => ({
        id:
          `1rm-${sesion.sessionId}-${index}`,

        fecha:
          sesion.fecha,

        carga:
          sesion.estimated1RM,
      })
    );

  const historial =
    [
      ...ejercicio.sesiones,
    ].reverse();

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="mt-7 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      {/* ====================================== */}
      {/* EJERCICIOS */}
      {/* ====================================== */}

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-6">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Ejercicios
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {
              ejercicios.length
            }{" "}
            con historial
          </p>
        </div>

        <div className="relative mt-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={
              busqueda
            }
            onChange={(
              event
            ) =>
              setBusqueda(
                event.target
                  .value
              )
            }
            placeholder="Buscar ejercicio..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="mt-3 max-h-[520px] space-y-1 overflow-y-auto">
          {ejerciciosFiltrados.map(
            (item) => {
              const activo =
                item.key ===
                ejercicio.key;

              return (
                <button
                  key={
                    item.key
                  }
                  type="button"
                  onClick={() =>
                    setEjercicioKey(
                      item.key
                    )
                  }
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    activo
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <p className="truncate text-sm font-bold">
                    {
                      item.nombre
                    }
                  </p>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs opacity-60">
                      {item.grupoMuscular ??
                        "Sin grupo"}
                    </p>

                    <span className="shrink-0 text-[11px] opacity-50">
                      {
                        item.sesiones
                          .length
                      }{" "}
                      ses.
                    </span>
                  </div>
                </button>
              );
            }
          )}
        </div>
      </aside>

      {/* ====================================== */}
      {/* CONTENIDO */}
      {/* ====================================== */}

      <div className="min-w-0">
        {/* HEADER */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Dumbbell
                size={22}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Progreso de fuerza
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {
                  ejercicio.nombre
                }
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {ejercicio.grupoMuscular ??
                  "Sin grupo muscular"}
                {" · "}
                {
                  ejercicio.sesiones
                    .length
                }{" "}
                sesiones registradas
              </p>
            </div>
          </div>
        </section>

        {/* ==================================== */}
        {/* MÉTRICAS PRINCIPALES */}
        {/* ==================================== */}

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metrica
            titulo="PR de carga"
            valor={
              prCarga
                ? `${formatearNumero(
                    prCarga.loadKg
                  )} kg`
                : "—"
            }
            detalle={
              prCarga
                ? `${prCarga.reps} reps`
                : "Sin registros"
            }
            icono={
              <Trophy
                size={20}
              />
            }
          />

          <Metrica
            titulo="1RM estimado"
            valor={
              pr1RM
                ? `${formatearNumero(
                    pr1RM.estimated1RM
                  )} kg`
                : "—"
            }
            detalle={
              pr1RM
                ? `${pr1RM.loadKg} kg × ${pr1RM.reps}`
                : "Epley · hasta 12 reps"
            }
            icono={
              <Gauge
                size={20}
              />
            }
          />

          <Metrica
            titulo="Mejora de 1RM"
            valor={
              mejora1RM !==
              null
                ? `${
                    mejora1RM >
                    0
                      ? "+"
                      : ""
                  }${formatearNumero(
                    mejora1RM
                  )} kg`
                : "—"
            }
            detalle="Primera vs. última sesión"
            icono={
              mejora1RM !==
                null &&
              mejora1RM < 0 ? (
                <TrendingDown
                  size={20}
                />
              ) : (
                <TrendingUp
                  size={20}
                />
              )
            }
          />

          <Metrica
            titulo="Volumen acumulado"
            valor={
              volumenTotal >
              0
                ? `${formatearNumero(
                    volumenTotal
                  )} kg`
                : "—"
            }
            detalle="Carga × repeticiones"
            icono={
              <BarChart3
                size={20}
              />
            }
          />
        </section>

        {/* ==================================== */}
        {/* RÉCORDS */}
        {/* ==================================== */}

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Crown
                size={20}
              />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Récords personales
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Mejores marcas históricas registradas en Entrena.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <RecordCard
              titulo="Mayor carga"
              valor={
                prCarga
                  ? `${formatearNumero(
                      prCarga.loadKg
                    )} kg`
                  : "—"
              }
              detalle={
                prCarga
                  ? `${prCarga.reps} reps · ${formatearFecha(
                      prCarga.fecha
                    )}`
                  : "Sin datos"
              }
              icono={
                <Trophy
                  size={18}
                />
              }
            />

            <RecordCard
              titulo="Mejor 1RM estimado"
              valor={
                pr1RM
                  ? `${formatearNumero(
                      pr1RM.estimated1RM
                    )} kg`
                  : "—"
              }
              detalle={
                pr1RM
                  ? `${pr1RM.loadKg} kg × ${pr1RM.reps}`
                  : "Sin datos"
              }
              icono={
                <Gauge
                  size={18}
                />
              }
            />

            <RecordCard
              titulo="Mejor serie"
              valor={
                mejorSerie
                  ? `${formatearNumero(
                      mejorSerie.loadKg
                    )} × ${mejorSerie.reps}`
                  : "—"
              }
              detalle={
                mejorSerie
                  ? `1RM ${formatearNumero(
                      mejorSerie.estimated1RM
                    )} kg`
                  : "Sin datos"
              }
              icono={
                <Medal
                  size={18}
                />
              }
            />

            <RecordCard
              titulo="Máximo de reps"
              valor={
                prRepeticiones
                  ? `${prRepeticiones.reps} reps`
                  : "—"
              }
              detalle={
                prRepeticiones
                  ? `con ${formatearNumero(
                      prRepeticiones.loadKg
                    )} kg`
                  : "Sin datos"
              }
              icono={
                <Repeat2
                  size={18}
                />
              }
            />

            <RecordCard
              titulo="Mayor volumen/serie"
              valor={
                prVolumenSerie
                  ? `${formatearNumero(
                      prVolumenSerie.volume
                    )} kg`
                  : "—"
              }
              detalle={
                prVolumenSerie
                  ? `${prVolumenSerie.loadKg} × ${prVolumenSerie.reps}`
                  : "Sin datos"
              }
              icono={
                <BarChart3
                  size={18}
                />
              }
            />

            <RecordCard
              titulo="Mayor volumen/sesión"
              valor={
                prVolumenSesion
                  ? `${formatearNumero(
                      prVolumenSesion.volume
                    )} kg`
                  : "—"
              }
              detalle={
                prVolumenSesion
                  ? formatearFecha(
                      prVolumenSesion.fecha
                    )
                  : "Sin datos"
              }
              icono={
                <Activity
                  size={18}
                />
              }
            />
          </div>
        </section>

        {/* ==================================== */}
        {/* 1RM CHART */}
        {/* ==================================== */}

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Gauge
                size={19}
              />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Evolución del 1RM estimado
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Mejor estimación de fuerza de cada sesión.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <StrengthChart
              puntos={
                puntos1RM
              }
            />
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            Estimación mediante la fórmula de Epley. Se utilizan series de hasta 12 repeticiones.
          </p>
        </section>

        {/* ==================================== */}
        {/* CARGA CHART */}
        {/* ==================================== */}

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Activity
                size={19}
              />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Evolución de carga real
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Mayor peso realmente utilizado en cada entrenamiento.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <StrengthChart
              puntos={
                puntosCarga
              }
            />
          </div>
        </section>

        {/* ==================================== */}
        {/* RESUMEN DE EVOLUCIÓN */}
        {/* ==================================== */}

        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Evolución de carga
            </p>

            <div className="mt-3 flex items-end gap-3">
              <p className="text-2xl font-bold text-slate-900">
                {ultimaCarga !==
                null
                  ? `${formatearNumero(
                      ultimaCarga
                    )} kg`
                  : "—"}
              </p>

              {mejoraCarga !==
                null && (
                <span
                  className={`mb-1 text-sm font-bold ${
                    mejoraCarga >
                    0
                      ? "text-emerald-600"
                      : mejoraCarga <
                          0
                        ? "text-red-500"
                        : "text-slate-400"
                  }`}
                >
                  {mejoraCarga >
                  0
                    ? "+"
                    : ""}
                  {formatearNumero(
                    mejoraCarga
                  )}{" "}
                  kg
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Primera carga máxima:{" "}
              {primeraCarga !==
              null
                ? `${formatearNumero(
                    primeraCarga
                  )} kg`
                : "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Evolución de fuerza estimada
            </p>

            <div className="mt-3 flex items-end gap-3">
              <p className="text-2xl font-bold text-slate-900">
                {ultimo1RM !==
                null
                  ? `${formatearNumero(
                      ultimo1RM
                    )} kg`
                  : "—"}
              </p>

              {mejora1RM !==
                null && (
                <span
                  className={`mb-1 text-sm font-bold ${
                    mejora1RM >
                    0
                      ? "text-emerald-600"
                      : mejora1RM <
                          0
                        ? "text-red-500"
                        : "text-slate-400"
                  }`}
                >
                  {mejora1RM >
                  0
                    ? "+"
                    : ""}
                  {formatearNumero(
                    mejora1RM
                  )}{" "}
                  kg
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Primer 1RM estimado:{" "}
              {primer1RM !==
              null
                ? `${formatearNumero(
                    primer1RM
                  )} kg`
                : "—"}
            </p>
          </div>
        </section>

        {/* ==================================== */}
        {/* HISTORIAL */}
        {/* ==================================== */}

        <section className="mt-6">
          <div className="flex items-center gap-3">
            <History
              size={20}
              className="text-slate-500"
            />

            <div>
              <h3 className="font-bold text-slate-900">
                Historial
              </h3>

              <p className="text-sm text-slate-500">
                Series realizadas de la más reciente a la más antigua.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {historial.map(
              (
                sesion,
                sessionIndex
              ) => {
                const volumenSesion =
                  calcularVolumenSesion(
                    sesion
                  );

                const metricas =
                  metricasSesiones.find(
                    (item) =>
                      item.sessionId ===
                      sesion.sessionId
                  );

                return (
                  <article
                    key={`${sesion.sessionId}-${sessionIndex}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900">
                            {formatearFecha(
                              sesion.fecha
                            )}
                          </p>

                          {metricas?.prCarga && (
                            <BadgePR>
                              PR carga
                            </BadgePR>
                          )}

                          {metricas?.pr1RM && (
                            <BadgePR>
                              PR 1RM
                            </BadgePR>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            sesion.dia
                          }
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {metricas?.estimated1RM !==
                          null &&
                          metricas?.estimated1RM !==
                            undefined && (
                            <div className="rounded-xl bg-violet-50 px-3 py-2 text-right">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">
                                1RM est.
                              </p>

                              <p className="text-sm font-bold text-violet-800">
                                {formatearNumero(
                                  metricas.estimated1RM
                                )}{" "}
                                kg
                              </p>
                            </div>
                          )}

                        {volumenSesion >
                          0 && (
                          <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Volumen
                            </p>

                            <p className="text-sm font-bold text-slate-800">
                              {formatearNumero(
                                volumenSesion
                              )}{" "}
                              kg
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {sesion.sets.map(
                        (
                          set,
                          index
                        ) => (
                          <div
                            key={`${sesion.sessionId}-${set.setNumber}-${index}`}
                            className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                          >
                            <span className="text-xs font-semibold text-slate-400">
                              Serie{" "}
                              {
                                set.setNumber
                              }
                            </span>

                            <div className="text-right">
                              <p className="font-bold text-slate-900">
                                {set.loadKg !==
                                null
                                  ? `${formatearNumero(
                                      set.loadKg
                                    )} kg`
                                  : "Sin carga"}
                              </p>

                              <p className="text-xs text-slate-500">
                                {set.reps !==
                                null
                                  ? `${set.reps} reps`
                                  : "Reps no registradas"}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * MÉTRICA
 * ============================================================
 */

function Metrica({
  titulo,
  valor,
  detalle,
  icono,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono:
    React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icono}
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {valor}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {detalle}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * RECORD CARD
 * ============================================================
 */

function RecordCard({
  titulo,
  valor,
  detalle,
  icono,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono:
    React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-amber-600">
        {icono}

        <p className="text-xs font-bold uppercase tracking-wide">
          {titulo}
        </p>
      </div>

      <p className="mt-3 text-xl font-bold text-slate-900">
        {valor}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {detalle}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * BADGE NUEVO PR
 * ============================================================
 */

function BadgePR({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
      <Sparkles
        size={11}
      />

      {children}
    </span>
  );
}