"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Dumbbell,
  Save,
  Timer,
  Trophy,
} from "lucide-react";

type Serie = {
  id: string;
  setNumber: number;
  reps: string;
  loadKg: string;
  completed: boolean;
  notes: string;
};

type Ejercicio = {
  id: string;
  position: number;

  exerciseName: string;
  muscleGroup: string | null;

  prescribedSets: number;
  prescribedReps: string;
  prescribedLoadKg: string;
  prescribedRestSeconds: number;
  prescribedNotes: string;

  notes: string;

  sets: Serie[];
};

type Workout = {
  id: string;

  planName: string;
  weekNumber: number;
  dayName: string;

  status:
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

  startedAt: string;
  completedAt: string | null;

  notes: string;

  exercises: Ejercicio[];
};

type Props = {
  initialWorkout: Workout;
};

function primeraRepeticion(
  valor: string
) {
  return (
    valor.match(/\d+/)?.[0] ??
    ""
  );
}

export default function WorkoutRunner({
  initialWorkout,
}: Props) {
  const router =
    useRouter();

  const [
    workout,
    setWorkout,
  ] =
    useState<Workout>(
      initialWorkout
    );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const readonly =
    workout.status ===
    "COMPLETED";

  /*
   * =============================================
   * PROGRESO
   * =============================================
   */

  const resumen =
    useMemo(() => {
      const series =
        workout.exercises.flatMap(
          (ejercicio) =>
            ejercicio.sets
        );

      const completadas =
        series.filter(
          (serie) =>
            serie.completed
        ).length;

      return {
        total:
          series.length,

        completadas,

        porcentaje:
          series.length >
          0
            ? Math.round(
                (completadas /
                  series.length) *
                  100
              )
            : 0,
      };
    }, [
      workout.exercises,
    ]);

  /*
   * =============================================
   * ACTUALIZAR SERIE
   * =============================================
   */

  function actualizarSerie(
    ejercicioId: string,
    serieId: string,
    cambios: Partial<Serie>
  ) {
    setWorkout(
      (anterior) => ({
        ...anterior,

        exercises:
          anterior.exercises.map(
            (ejercicio) => {
              if (
                ejercicio.id !==
                ejercicioId
              ) {
                return ejercicio;
              }

              return {
                ...ejercicio,

                sets:
                  ejercicio.sets.map(
                    (serie) =>
                      serie.id ===
                      serieId
                        ? {
                            ...serie,
                            ...cambios,
                          }
                        : serie
                  ),
              };
            }
          ),
      })
    );
  }

  /*
   * =============================================
   * ACTUALIZAR NOTAS EJERCICIO
   * =============================================
   */

  function actualizarNotasEjercicio(
    ejercicioId: string,
    notes: string
  ) {
    setWorkout(
      (anterior) => ({
        ...anterior,

        exercises:
          anterior.exercises.map(
            (ejercicio) =>
              ejercicio.id ===
              ejercicioId
                ? {
                    ...ejercicio,
                    notes,
                  }
                : ejercicio
          ),
      })
    );
  }

  /*
   * =============================================
   * GUARDAR / FINALIZAR
   * =============================================
   */

  async function guardar(
    finalizar: boolean
  ) {
    if (readonly) {
      return;
    }

    if (
      finalizar &&
      !window.confirm(
        "¿Finalizar este entrenamiento? Después quedará registrado como completado."
      )
    ) {
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const response =
        await fetch(
          `/api/client/workouts/${workout.id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                finalizar,

                notes:
                  workout.notes,

                exercises:
                  workout.exercises.map(
                    (
                      ejercicio
                    ) => ({
                      id:
                        ejercicio.id,

                      notes:
                        ejercicio.notes,

                      sets:
                        ejercicio.sets.map(
                          (
                            serie
                          ) => ({
                            id:
                              serie.id,

                            reps:
                              serie.reps,

                            loadKg:
                              serie.loadKg,

                            completed:
                              serie.completed,

                            notes:
                              serie.notes,
                          })
                        ),
                    })
                  ),
              }),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;
          status?: string;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo guardar."
        );
      }

      if (finalizar) {
        setWorkout(
          (anterior) => ({
            ...anterior,

            status:
              "COMPLETED",

            completedAt:
              new Date().toISOString(),
          })
        );

        router.push(
          "/client/dashboard"
        );

        router.refresh();

        return;
      }

      setMensaje(
        "Progreso guardado."
      );

      window.setTimeout(
        () => {
          setMensaje("");
        },
        2500
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-4 pb-32 sm:p-6 sm:pb-32 lg:p-8 lg:pb-32">
      {/* VOLVER */}

      <Link
        href="/client/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft
          size={17}
        />

        Volver al dashboard
      </Link>

      {/* HEADER */}

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              {workout.planName}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              {workout.dayName}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Semana{" "}
              {
                workout.weekNumber
              }
            </p>
          </div>

          {readonly ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <Trophy
                size={19}
              />

              Completado
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Timer
                  size={17}
                  className="text-emerald-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  En progreso
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PROGRESO */}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">
              Series completadas
            </span>

            <span className="font-bold text-slate-900">
              {
                resumen.completadas
              }
              /
              {
                resumen.total
              }{" "}
              ·{" "}
              {
                resumen.porcentaje
              }
              %
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${resumen.porcentaje}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* MENSAJES */}

      {mensaje && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* EJERCICIOS */}

      <section className="mt-6 space-y-5">
        {workout.exercises.map(
          (
            ejercicio,
            index
          ) => {
            const repsObjetivo =
              primeraRepeticion(
                ejercicio.prescribedReps
              );

            return (
              <article
                key={
                  ejercicio.id
                }
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* EJERCICIO HEADER */}

                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
                      {index +
                        1}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-slate-900">
                        {
                          ejercicio.exerciseName
                        }
                      </h2>

                      <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                        {ejercicio.muscleGroup ??
                          "Ejercicio"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
                          {
                            ejercicio.prescribedSets
                          }{" "}
                          series
                        </span>

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
                          {
                            ejercicio.prescribedReps
                          }{" "}
                          reps
                        </span>

                        {ejercicio.prescribedLoadKg && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
                            {
                              ejercicio.prescribedLoadKg
                            }{" "}
                            kg
                          </span>
                        )}

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700">
                          {
                            ejercicio.prescribedRestSeconds
                          }
                          s descanso
                        </span>
                      </div>

                      {ejercicio.prescribedNotes && (
                        <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                          <strong>
                            Entrenador:
                          </strong>{" "}
                          {
                            ejercicio.prescribedNotes
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SERIES */}

                <div className="p-4 sm:p-5">
                  <div className="mb-2 grid grid-cols-[54px_1fr_1fr_48px] gap-2 px-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <span>
                      Serie
                    </span>

                    <span>
                      Carga
                    </span>

                    <span>
                      Reps
                    </span>

                    <span>
                      Hecha
                    </span>
                  </div>

                  <div className="space-y-2">
                    {ejercicio.sets.map(
                      (
                        serie
                      ) => (
                        <div
                          key={
                            serie.id
                          }
                          className={`grid grid-cols-[54px_1fr_1fr_48px] items-center gap-2 rounded-xl border p-2 transition ${
                            serie.completed
                              ? "border-emerald-200 bg-emerald-50/50"
                              : "border-slate-100 bg-slate-50/50"
                          }`}
                        >
                          <div className="text-center text-sm font-bold text-slate-700">
                            {
                              serie.setNumber
                            }
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.25"
                              disabled={
                                readonly
                              }
                              value={
                                serie.loadKg
                              }
                              placeholder={
                                ejercicio.prescribedLoadKg ||
                                "kg"
                              }
                              onChange={(
                                event
                              ) =>
                                actualizarSerie(
                                  ejercicio.id,
                                  serie.id,
                                  {
                                    loadKg:
                                      event
                                        .target
                                        .value,
                                  }
                                )
                              }
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 pr-8 text-center text-sm font-semibold outline-none focus:border-emerald-500 disabled:bg-slate-100"
                            />

                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                              kg
                            </span>
                          </div>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            disabled={
                              readonly
                            }
                            value={
                              serie.reps
                            }
                            placeholder={
                              repsObjetivo ||
                              "reps"
                            }
                            onChange={(
                              event
                            ) =>
                              actualizarSerie(
                                ejercicio.id,
                                serie.id,
                                {
                                  reps:
                                    event
                                      .target
                                      .value,
                                }
                              )
                            }
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-semibold outline-none focus:border-emerald-500 disabled:bg-slate-100"
                          />

                          <button
                            type="button"
                            disabled={
                              readonly
                            }
                            onClick={() => {
                              /*
                               * Al marcar completada,
                               * si reps está vacío
                               * precargamos la primera
                               * cifra del objetivo.
                               *
                               * La carga queda vacía
                               * si era peso corporal.
                               */
                              actualizarSerie(
                                ejercicio.id,
                                serie.id,
                                {
                                  completed:
                                    !serie.completed,

                                  ...(!serie.reps &&
                                  !serie.completed &&
                                  repsObjetivo
                                    ? {
                                        reps:
                                          repsObjetivo,
                                      }
                                    : {}),

                                  ...(!serie.loadKg &&
                                  !serie.completed &&
                                  ejercicio.prescribedLoadKg
                                    ? {
                                        loadKg:
                                          ejercicio.prescribedLoadKg,
                                      }
                                    : {}),
                                }
                              );
                            }}
                            className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                              serie.completed
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-slate-200 bg-white text-slate-300 hover:border-emerald-400 hover:text-emerald-600"
                            } disabled:cursor-default`}
                          >
                            <Check
                              size={
                                18
                              }
                            />
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {/* NOTAS EJERCICIO */}

                  <div className="mt-4">
                    <label className="text-xs font-semibold text-slate-500">
                      Notas del ejercicio
                    </label>

                    <input
                      disabled={
                        readonly
                      }
                      value={
                        ejercicio.notes
                      }
                      onChange={(
                        event
                      ) =>
                        actualizarNotasEjercicio(
                          ejercicio.id,
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Ej. última serie pesada, molestia, buena técnica..."
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </article>
            );
          }
        )}
      </section>

      {/* NOTA GENERAL */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="font-bold text-slate-900">
          Notas del entrenamiento
        </label>

        <textarea
          disabled={
            readonly
          }
          value={
            workout.notes
          }
          onChange={(
            event
          ) =>
            setWorkout(
              (anterior) => ({
                ...anterior,

                notes:
                  event.target
                    .value,
              })
            )
          }
          rows={3}
          placeholder="¿Cómo te sentiste hoy?"
          className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100"
        />
      </section>

      {/* BOTONES FIJOS */}

      {!readonly && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                guardar(
                  false
                )
              }
              disabled={
                guardando
              }
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Save
                size={18}
              />

              {guardando
                ? "Guardando..."
                : "Guardar progreso"}
            </button>

            <button
              type="button"
              onClick={() =>
                guardar(
                  true
                )
              }
              disabled={
                guardando
              }
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2
                size={19}
              />

              Finalizar entrenamiento
            </button>
          </div>
        </div>
      )}
    </main>
  );
}