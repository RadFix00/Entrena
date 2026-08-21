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
  Medal,
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
  obtenerPRVolumenSesion,
} from "@/lib/strength-metrics";

export type ClientStrengthSet = {
  setNumber: number;

  reps:
    | number
    | null;

  loadKg:
    | number
    | null;
};

export type ClientStrengthSession = {
  sessionId: string;
  fecha: string;
  dia: string;

  sets:
    ClientStrengthSet[];
};

export type ClientStrengthExercise = {
  key: string;

  nombre: string;

  grupoMuscular:
    | string
    | null;

  sesiones:
    ClientStrengthSession[];
};

type Props = {
  ejercicios:
    ClientStrengthExercise[];
};

function numero(
  valor: number
) {
  return new Intl.NumberFormat(
    "es-CO",
    {
      maximumFractionDigits: 2,
    }
  ).format(valor);
}

function fecha(
  valor: string
) {
  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(valor)
  );
}

export default function ClientStrengthProgress({
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

  const filtrados =
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
            .includes(texto) ||
          ejercicio.grupoMuscular
            ?.toLowerCase()
            .includes(texto)
      );
    }, [
      busqueda,
      ejercicios,
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
   * ============================================
   * SIN DATOS
   * ============================================
   */

  if (
    ejercicios.length === 0
  ) {
    return (
      <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Dumbbell
          size={32}
          className="mx-auto text-slate-300"
        />

        <h2 className="mt-4 text-lg font-bold text-slate-800">
          Tu progreso aparecerá aquí
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Completa entrenamientos registrando cargas y repeticiones para comenzar a construir tu historial de fuerza.
        </p>
      </div>
    );
  }

  if (!ejercicio) {
    return null;
  }

  /*
   * ============================================
   * MÉTRICAS
   * ============================================
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

  const mejorVolumen =
    obtenerPRVolumenSesion(
      ejercicio.sesiones
    );

  const metricas =
    calcularMetricasSesiones(
      ejercicio.sesiones
    );

  const metricas1RM =
    metricas.filter(
      (
        item
      ): item is typeof item & {
        estimated1RM: number;
      } =>
        item.estimated1RM !==
        null
    );

  const primer1RM =
    metricas1RM[0]
      ?.estimated1RM ??
    null;

  const ultimo1RM =
    metricas1RM[
      metricas1RM.length - 1
    ]?.estimated1RM ??
    null;

  const mejora =
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

  const puntos =
    metricas1RM.map(
      (
        item,
        index
      ) => ({
        id:
          `${item.sessionId}-${index}`,

        fecha:
          item.fecha,

        carga:
          item.estimated1RM,
      })
    );

  const historial =
    [
      ...ejercicio.sesiones,
    ].reverse();

  /*
   * ============================================
   * UI
   * ============================================
   */

  return (
    <div className="mt-7">
      {/* SELECTOR */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Ejercicio
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Selecciona qué movimiento quieres analizar.
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search
              size={17}
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
                  event.target.value
                )
              }
              placeholder="Buscar ejercicio..."
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filtrados.map(
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
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    activo
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {
                    item.nombre
                  }
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* EJERCICIO */}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Dumbbell
              size={22}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Analizando
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {
                ejercicio.nombre
              }
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {ejercicio.grupoMuscular ??
                "Ejercicio"}
              {" · "}
              {
                ejercicio.sesiones
                  .length
              }{" "}
              sesiones
            </p>
          </div>
        </div>
      </section>

      {/* MÉTRICAS */}

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          titulo="Récord de carga"
          valor={
            prCarga
              ? `${numero(
                  prCarga.loadKg
                )} kg`
              : "—"
          }
          detalle={
            prCarga
              ? `${prCarga.reps} repeticiones`
              : "Sin registros"
          }
          icono={
            <Trophy
              size={20}
            />
          }
        />

        <Card
          titulo="Fuerza estimada"
          valor={
            pr1RM
              ? `${numero(
                  pr1RM.estimated1RM
                )} kg`
              : "—"
          }
          detalle="Mejor 1RM estimado"
          icono={
            <Gauge
              size={20}
            />
          }
        />

        <Card
          titulo="Evolución"
          valor={
            mejora !== null
              ? `${
                  mejora > 0
                    ? "+"
                    : ""
                }${numero(
                  mejora
                )} kg`
              : "—"
          }
          detalle="Primer registro vs. último"
          icono={
            mejora !==
              null &&
            mejora < 0 ? (
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

        <Card
          titulo="Mejor sesión"
          valor={
            mejorVolumen
              ? `${numero(
                  mejorVolumen.volume
                )} kg`
              : "—"
          }
          detalle="Mayor volumen realizado"
          icono={
            <BarChart3
              size={20}
            />
          }
        />
      </section>

      {/* RÉCORD DESTACADO */}

      {mejorSerie && (
        <section className="mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Crown
                size={23}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Mejor rendimiento
                </p>

                <Sparkles
                  size={14}
                  className="text-amber-600"
                />
              </div>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {numero(
                  mejorSerie.loadKg
                )}{" "}
                kg ×{" "}
                {
                  mejorSerie.reps
                }
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Fuerza estimada de{" "}
                <strong className="text-slate-700">
                  {numero(
                    mejorSerie.estimated1RM
                  )}{" "}
                  kg
                </strong>
                .
              </p>
            </div>
          </div>
        </section>
      )}

      {/* GRÁFICA */}

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <Activity
            size={20}
            className="mt-0.5 text-emerald-600"
          />

          <div>
            <h3 className="font-bold text-slate-900">
              Tu evolución
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Evolución de tu fuerza estimada a través del tiempo.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <StrengthChart
            puntos={
              puntos
            }
          />
        </div>
      </section>

      {/* HISTORIAL */}

      <section className="mt-6">
        <h3 className="text-xl font-bold text-slate-900">
          Historial de{" "}
          {
            ejercicio.nombre
          }
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Tus últimas marcas registradas.
        </p>

        <div className="mt-4 space-y-3">
          {historial.map(
            (sesion) => {
              const volumen =
                calcularVolumenSesion(
                  sesion
                );

              return (
                <article
                  key={
                    sesion.sessionId
                  }
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-bold text-slate-900">
                        {fecha(
                          sesion.fecha
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          sesion.dia
                        }
                      </p>
                    </div>

                    {volumen >
                      0 && (
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Volumen
                        </p>

                        <p className="text-sm font-bold text-slate-800">
                          {numero(
                            volumen
                          )}{" "}
                          kg
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {sesion.sets.map(
                      (
                        set,
                        index
                      ) => (
                        <div
                          key={`${sesion.sessionId}-${index}`}
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
                                ? `${numero(
                                    set.loadKg
                                  )} kg`
                                : "—"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {set.reps !==
                              null
                                ? `${set.reps} reps`
                                : "—"}
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
  );
}

function Card({
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

      <p className="mt-4 text-sm text-slate-500">
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