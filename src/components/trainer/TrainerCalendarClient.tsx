"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

/*
 * ============================================================
 * TIPOS
 * ============================================================
 */

export type CalendarDayUI = {
  id: string;

  name: string;

  description:
    | string
    | null;

  weekNumber:
    number;

  position:
    number;

  scheduledDate:
    | string
    | null;

  completedAt:
    | string
    | null;
};

type Props = {
  clientId: string;

  clientName: string;

  plan: {
    id: string;
    name: string;
    status: string;

    startDate:
      | string
      | null;
  };

  dias:
    CalendarDayUI[];
};

type EstadoDia =
  | "COMPLETED_ON_TIME"
  | "COMPLETED_LATE"
  | "MISSED"
  | "TODAY"
  | "UPCOMING"
  | "UNSCHEDULED";

/*
 * ============================================================
 * FECHAS
 * ============================================================
 */

function hoyBogota() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Bogota",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const year =
    partes.find(
      (item) =>
        item.type ===
        "year"
    )?.value;

  const month =
    partes.find(
      (item) =>
        item.type ===
        "month"
    )?.value;

  const day =
    partes.find(
      (item) =>
        item.type ===
        "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function fechaBogota(
  fecha: Date
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Bogota",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      fecha
    );

  const year =
    partes.find(
      (item) =>
        item.type ===
        "year"
    )?.value;

  const month =
    partes.find(
      (item) =>
        item.type ===
        "month"
    )?.value;

  const day =
    partes.find(
      (item) =>
        item.type ===
        "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function sumarDias(
  fecha: string,
  cantidad: number
) {
  const [
    year,
    month,
    day,
  ] =
    fecha
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day + cantidad,
        12,
        0,
        0
      )
    );

  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function diaSemana(
  fecha: string
) {
  const [
    year,
    month,
    day,
  ] =
    fecha
      .split("-")
      .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12
    )
  ).getUTCDay();
}

function mesDeFecha(
  fecha: string
) {
  const [
    year,
    month,
  ] =
    fecha
      .split("-")
      .map(Number);

  return {
    year,
    month:
      month - 1,
  };
}

function formatearFecha(
  fecha:
    | string
    | null
) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      timeZone:
        "UTC",
    }
  ).format(
    new Date(
      `${fecha}T12:00:00Z`
    )
  );
}

/*
 * ============================================================
 * ESTADO DE UNA SESIÓN
 * ============================================================
 */

function obtenerEstado({
  scheduledDate,
  completedAt,
}: {
  scheduledDate:
    | string
    | null;

  completedAt:
    | string
    | null;
}): EstadoDia {
  if (!scheduledDate) {
    return "UNSCHEDULED";
  }

  if (completedAt) {
    const completada =
      fechaBogota(
        new Date(
          completedAt
        )
      );

    return completada <=
      scheduledDate
      ? "COMPLETED_ON_TIME"
      : "COMPLETED_LATE";
  }

  const hoy =
    hoyBogota();

  if (
    scheduledDate <
    hoy
  ) {
    return "MISSED";
  }

  if (
    scheduledDate ===
    hoy
  ) {
    return "TODAY";
  }

  return "UPCOMING";
}

/*
 * ============================================================
 * COMPONENTE
 * ============================================================
 */

export default function TrainerCalendarClient({
  clientId,
  clientName,
  plan,
  dias,
}: Props) {
  const router =
    useRouter();

  /*
   * ============================================
   * FECHAS EDITABLES
   * ============================================
   */

  const fechasIniciales =
    Object.fromEntries(
      dias.map(
        (dia) => [
          dia.id,
          dia.scheduledDate ??
            "",
        ]
      )
    );

  const [
    fechas,
    setFechas,
  ] = useState<
    Record<
      string,
      string
    >
  >(
    fechasIniciales
  );

  /*
   * ============================================
   * GENERADOR
   * ============================================
   */

  const primeraFecha =
    dias.find(
      (dia) =>
        dia.scheduledDate
    )?.scheduledDate;

  const [
    fechaInicio,
    setFechaInicio,
  ] = useState(
    plan.startDate ??
      primeraFecha ??
      hoyBogota()
  );

  /*
   * JS:
   *
   * 0 domingo
   * 1 lunes
   * 2 martes
   * ...
   */
  const [
    diasSemana,
    setDiasSemana,
  ] = useState<
    Set<number>
  >(
    new Set([
      1,
      3,
      5,
    ])
  );

  /*
   * ============================================
   * MES VISIBLE
   * ============================================
   */

  const mesInicial =
    mesDeFecha(
      primeraFecha ??
        plan.startDate ??
        hoyBogota()
    );

  const [
    mes,
    setMes,
  ] = useState(
    mesInicial
  );

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  /*
   * ============================================
   * DÍAS + ESTADOS ACTUALES
   * ============================================
   */

  const diasActuales =
    useMemo(
      () =>
        dias.map(
          (dia) => {
            const scheduledDate =
              fechas[
                dia.id
              ] ||
              null;

            return {
              ...dia,

              scheduledDate,

              estado:
                obtenerEstado({
                  scheduledDate,

                  completedAt:
                    dia.completedAt,
                }),
            };
          }
        ),
      [
        dias,
        fechas,
      ]
    );

  /*
   * ============================================
   * MÉTRICAS DE ADHERENCIA
   * ============================================
   */

  const metricas =
    useMemo(() => {
      const hoy =
        hoyBogota();

      const programadas =
        diasActuales.filter(
          (dia) =>
            dia.scheduledDate !==
            null
        );

      /*
       * Programadas cuya fecha ya llegó.
       */
      const exigibles =
        programadas.filter(
            (dia) =>
            dia.scheduledDate! <
                hoy ||
            dia.completedAt !==
                null
        );

      const completadas =
        exigibles.filter(
          (dia) =>
            dia.estado ===
              "COMPLETED_ON_TIME" ||
            dia.estado ===
              "COMPLETED_LATE"
        );

      const aTiempo =
        completadas.filter(
          (dia) =>
            dia.estado ===
            "COMPLETED_ON_TIME"
        );

      const tarde =
        completadas.filter(
          (dia) =>
            dia.estado ===
            "COMPLETED_LATE"
        );

      const perdidas =
        exigibles.filter(
          (dia) =>
            dia.estado ===
            "MISSED"
        );

      const hoyPendientes =
        programadas.filter(
          (dia) =>
            dia.estado ===
            "TODAY"
        );

      const proximas =
        programadas.filter(
          (dia) =>
            dia.estado ===
            "UPCOMING"
        );

      const adherencia =
        exigibles.length >
        0
          ? Math.round(
              (completadas.length /
                exigibles.length) *
                100
            )
          : null;

      const puntualidad =
        completadas.length >
        0
          ? Math.round(
              (aTiempo.length /
                completadas.length) *
                100
            )
          : null;

      return {
        programadas:
          programadas.length,

        exigibles:
          exigibles.length,

        completadas:
          completadas.length,

        aTiempo:
          aTiempo.length,

        tarde:
          tarde.length,

        perdidas:
          perdidas.length,

        hoy:
          hoyPendientes.length,

        proximas:
          proximas.length,

        adherencia,

        puntualidad,
      };
    }, [
      diasActuales,
    ]);

  /*
   * ============================================
   * GENERAR CALENDARIO
   * ============================================
   */

  function generarCalendario() {
    setError("");
    setMensaje("");

    if (!fechaInicio) {
      setError(
        "Selecciona una fecha de inicio."
      );

      return;
    }

    if (
      diasSemana.size ===
      0
    ) {
      setError(
        "Selecciona al menos un día de la semana."
      );

      return;
    }

    /*
     * Los días ya vienen:
     *
     * semana 1 día 1
     * semana 1 día 2
     * ...
     */
    const ordenados =
      [...dias].sort(
        (
          a,
          b
        ) => {
          if (
            a.weekNumber !==
            b.weekNumber
          ) {
            return (
              a.weekNumber -
              b.weekNumber
            );
          }

          return (
            a.position -
            b.position
          );
        }
      );

    const nuevasFechas =
      {
        ...fechas,
      };

    let cursor =
      fechaInicio;

    let index =
      0;

    let seguridad =
      0;

    while (
      index <
        ordenados.length &&
      seguridad <
        3000
    ) {
      if (
        diasSemana.has(
          diaSemana(
            cursor
          )
        )
      ) {
        nuevasFechas[
          ordenados[
            index
          ].id
        ] =
          cursor;

        index++;
      }

      cursor =
        sumarDias(
          cursor,
          1
        );

      seguridad++;
    }

    setFechas(
      nuevasFechas
    );

    setMes(
      mesDeFecha(
        fechaInicio
      )
    );

    setMensaje(
      `${ordenados.length} sesiones programadas. Revisa las fechas y guarda los cambios.`
    );
  }

  /*
   * ============================================
   * CAMBIAR DÍA DE SEMANA
   * ============================================
   */

  function toggleDiaSemana(
    numero: number
  ) {
    setDiasSemana(
      (actual) => {
        const nuevo =
          new Set(
            actual
          );

        if (
          nuevo.has(
            numero
          )
        ) {
          nuevo.delete(
            numero
          );
        } else {
          nuevo.add(
            numero
          );
        }

        return nuevo;
      }
    );
  }

  /*
   * ============================================
   * LIMPIAR
   * ============================================
   */

  function limpiarCalendario() {
    const confirmar =
      window.confirm(
        "¿Quitar todas las fechas programadas? Tendrás que guardar para confirmar el cambio."
      );

    if (!confirmar) {
      return;
    }

    setFechas(
      Object.fromEntries(
        dias.map(
          (dia) => [
            dia.id,
            "",
          ]
        )
      )
    );

    setMensaje(
      "Las fechas fueron limpiadas localmente. Guarda los cambios para aplicarlo."
    );
  }

  /*
   * ============================================
   * GUARDAR
   * ============================================
   */

  async function guardar() {
    try {
      setGuardando(true);

      setError("");
      setMensaje("");

      const response =
        await fetch(
          `/api/trainer/clientes/${clientId}/calendario`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                planId:
                  plan.id,

                dias:
                  dias.map(
                    (dia) => ({
                      workoutDayId:
                        dia.id,

                      scheduledDate:
                        fechas[
                          dia.id
                        ] ||
                        null,
                    })
                  ),
              }),
          }
        );

      const data =
        (await response.json()) as {
          ok?: boolean;

          error?: string;

          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No se pudo guardar el calendario."
        );
      }

      setMensaje(
        data.message ??
          "Calendario guardado correctamente."
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el calendario."
      );
    } finally {
      setGuardando(false);
    }
  }

  /*
   * ============================================
   * CALENDARIO POR FECHA
   * ============================================
   */

  const diasPorFecha =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          typeof diasActuales
        >();

      for (
        const dia of
          diasActuales
      ) {
        if (
          !dia.scheduledDate
        ) {
          continue;
        }

        const existentes =
          mapa.get(
            dia.scheduledDate
          ) ?? [];

        existentes.push(
          dia
        );

        mapa.set(
          dia.scheduledDate,
          existentes
        );
      }

      return mapa;
    }, [
      diasActuales,
    ]);

  return (
    <div className="mt-7 space-y-6">
      {/* ====================================== */}
      {/* MÉTRICAS */}
      {/* ====================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica
          titulo="Adherencia"
          valor={
            metricas.adherencia !==
            null
              ? `${metricas.adherencia}%`
              : "—"
          }
          detalle={`${metricas.completadas}/${metricas.exigibles} sesiones cumplidas`}
          icono={
            <CheckCircle2
              size={20}
            />
          }
        />

        <Metrica
          titulo="Puntualidad"
          valor={
            metricas.puntualidad !==
            null
              ? `${metricas.puntualidad}%`
              : "—"
          }
          detalle={`${metricas.aTiempo} a tiempo · ${metricas.tarde} tarde`}
          icono={
            <Clock
              size={20}
            />
          }
        />

        <Metrica
          titulo="Vencidas"
          valor={String(
            metricas.perdidas
          )}
          detalle="Sesiones no realizadas"
          icono={
            <AlertTriangle
              size={20}
            />
          }
        />

        <Metrica
          titulo="Próximas"
          valor={String(
            metricas.proximas +
              metricas.hoy
          )}
          detalle={`${metricas.hoy} para hoy`}
          icono={
            <CalendarDays
              size={20}
            />
          }
        />
      </section>

      {/* ====================================== */}
      {/* GENERADOR AUTOMÁTICO */}
      {/* ====================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Sparkles
              size={19}
            />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Programación rápida
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Selecciona los días habituales de entrenamiento y Entrena distribuirá todas las sesiones automáticamente.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* FECHA INICIO */}

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Iniciar desde
            </span>

            <input
              type="date"
              value={
                fechaInicio
              }
              onChange={(
                event
              ) =>
                setFechaInicio(
                  event.target
                    .value
                )
              }
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>

          {/* DÍAS */}

          <div>
            <p className="text-sm font-semibold text-slate-700">
              Días de entrenamiento
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {[
                [1, "Lun"],
                [2, "Mar"],
                [3, "Mié"],
                [4, "Jue"],
                [5, "Vie"],
                [6, "Sáb"],
                [0, "Dom"],
              ].map(
                ([
                  numero,
                  label,
                ]) => {
                  const activo =
                    diasSemana.has(
                      numero as number
                    );

                  return (
                    <button
                      key={
                        numero
                      }
                      type="button"
                      onClick={() =>
                        toggleDiaSemana(
                          numero as number
                        )
                      }
                      className={`h-11 min-w-14 rounded-xl px-3 text-sm font-bold transition ${
                        activo
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {
                        label
                      }
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={
              generarCalendario
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            <Sparkles
              size={17}
            />

            Generar calendario
          </button>

          <button
            type="button"
            onClick={
              limpiarCalendario
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw
              size={17}
            />

            Limpiar fechas
          </button>
        </div>
      </section>

      {/* MENSAJES */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {mensaje}
        </div>
      )}

      {/* ====================================== */}
      {/* CALENDARIO MENSUAL */}
      {/* ====================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <MonthCalendar
          year={
            mes.year
          }
          month={
            mes.month
          }
          diasPorFecha={
            diasPorFecha
          }
          onPrevious={() =>
            setMes(
              previousMonth(
                mes
              )
            )
          }
          onNext={() =>
            setMes(
              nextMonth(
                mes
              )
            )
          }
        />
      </section>

      {/* ====================================== */}
      {/* LEYENDA */}
      {/* ====================================== */}

      <section className="flex flex-wrap gap-2">
        <Leyenda
          label="A tiempo"
          estado="COMPLETED_ON_TIME"
        />

        <Leyenda
          label="Completado tarde"
          estado="COMPLETED_LATE"
        />

        <Leyenda
          label="Vencido"
          estado="MISSED"
        />

        <Leyenda
          label="Hoy"
          estado="TODAY"
        />

        <Leyenda
          label="Próximo"
          estado="UPCOMING"
        />
      </section>

      {/* ====================================== */}
      {/* EDICIÓN POR SEMANA */}
      {/* ====================================== */}

      <section>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Programación del plan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Puedes corregir cualquier fecha manualmente antes o después de generar el calendario.
          </p>
        </div>

        <div className="mt-4 space-y-5">
          {Array.from(
            new Set(
              diasActuales.map(
                (dia) =>
                  dia.weekNumber
              )
            )
          ).map(
            (
              semana
            ) => {
              const diasSemanaActual =
                diasActuales.filter(
                  (dia) =>
                    dia.weekNumber ===
                    semana
                );

              return (
                <div
                  key={
                    semana
                  }
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                    <p className="font-bold text-slate-800">
                      Semana{" "}
                      {
                        semana
                      }
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {diasSemanaActual.map(
                      (
                        dia
                      ) => (
                        <div
                          key={
                            dia.id
                          }
                          className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_200px_170px] lg:items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              {
                                dia.name
                              }
                            </p>

                            {dia.description && (
                              <p className="mt-1 text-sm text-slate-500">
                                {
                                  dia.description
                                }
                              </p>
                            )}

                            {dia.completedAt && (
                              <p className="mt-2 text-xs text-slate-400">
                                Realizado:{" "}
                                {new Intl.DateTimeFormat(
                                  "es-CO",
                                  {
                                    day:
                                      "numeric",

                                    month:
                                      "short",

                                    year:
                                      "numeric",

                                    timeZone:
                                      "America/Bogota",
                                  }
                                ).format(
                                  new Date(
                                    dia.completedAt
                                  )
                                )}
                              </p>
                            )}
                          </div>

                          <input
                            type="date"
                            value={
                              fechas[
                                dia.id
                              ] ??
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              setFechas(
                                (
                                  actual
                                ) => ({
                                  ...actual,

                                  [dia.id]:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                          />

                          <StatusBadge
                            estado={
                              dia.estado
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* ====================================== */}
      {/* GUARDAR */}
      {/* ====================================== */}

      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          type="button"
          disabled={
            guardando
          }
          onClick={
            guardar
          }
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
        >
          <Save
            size={18}
          />

          {guardando
            ? "Guardando..."
            : "Guardar calendario"}
        </button>
      </div>

      <p className="pb-2 text-center text-xs text-slate-400">
        Calendario de{" "}
        {clientName}
        {" · "}
        {plan.name}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * CALENDARIO MENSUAL
 * ============================================================
 */

function MonthCalendar({
  year,
  month,
  diasPorFecha,
  onPrevious,
  onNext,
}: {
  year: number;

  month: number;

  diasPorFecha:
    Map<
      string,
      (CalendarDayUI & {
        estado:
          EstadoDia;
      })[]
    >;

  onPrevious:
    () => void;

  onNext:
    () => void;
}) {
  const primerDia =
    new Date(
      Date.UTC(
        year,
        month,
        1
      )
    );

  const diasMes =
    new Date(
      Date.UTC(
        year,
        month + 1,
        0
      )
    ).getUTCDate();

  /*
   * Convertir domingo=0
   * a semana que inicia en lunes.
   */
  const desplazamiento =
    (
      primerDia.getUTCDay() +
      6
    ) %
    7;

  const totalCeldas =
    Math.ceil(
      (desplazamiento +
        diasMes) /
        7
    ) * 7;

  const titulo =
    new Intl.DateTimeFormat(
      "es-CO",
      {
        month:
          "long",

        year:
          "numeric",

        timeZone:
          "UTC",
      }
    ).format(
      primerDia
    );

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={
            onPrevious
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
        >
          <ChevronLeft
            size={19}
          />
        </button>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Calendario
          </p>

          <h2 className="mt-1 text-lg font-bold capitalize text-slate-900">
            {titulo}
          </h2>
        </div>

        <button
          type="button"
          onClick={
            onNext
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
        >
          <ChevronRight
            size={19}
          />
        </button>
      </div>

      {/* NOMBRES DÍAS */}

      <div className="mt-6 grid grid-cols-7 text-center">
        {[
          "L",
          "M",
          "X",
          "J",
          "V",
          "S",
          "D",
        ].map(
          (
            dia
          ) => (
            <div
              key={
                dia
              }
              className="pb-2 text-xs font-bold text-slate-400"
            >
              {dia}
            </div>
          )
        )}
      </div>

      {/* DÍAS */}

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-100">
        {Array.from(
          {
            length:
              totalCeldas,
          },
          (
            _,
            index
          ) => {
            const numero =
              index -
              desplazamiento +
              1;

            if (
              numero <
                1 ||
              numero >
                diasMes
            ) {
              return (
                <div
                  key={
                    index
                  }
                  className="min-h-24 border-b border-r border-slate-100 bg-slate-50/50 sm:min-h-28"
                />
              );
            }

            const fecha =
              `${year}-${String(
                month + 1
              ).padStart(
                2,
                "0"
              )}-${String(
                numero
              ).padStart(
                2,
                "0"
              )}`;

            const sesiones =
              diasPorFecha.get(
                fecha
              ) ?? [];

            const esHoy =
              fecha ===
              hoyBogota();

            return (
              <div
                key={
                  fecha
                }
                className={`min-h-24 border-b border-r border-slate-100 p-1.5 sm:min-h-28 sm:p-2 ${
                  esHoy
                    ? "bg-blue-50/50"
                    : "bg-white"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    esHoy
                      ? "bg-blue-600 text-white"
                      : "text-slate-600"
                  }`}
                >
                  {
                    numero
                  }
                </div>

                <div className="mt-1 space-y-1">
                  {sesiones
                    .slice(
                      0,
                      2
                    )
                    .map(
                      (
                        sesion
                      ) => (
                        <div
                          key={
                            sesion.id
                          }
                          title={
                            sesion.name
                          }
                          className={`truncate rounded-md px-1.5 py-1 text-[9px] font-bold sm:text-[10px] ${estadoClasses(
                            sesion.estado
                          )}`}
                        >
                          {
                            sesion.name
                          }
                        </div>
                      )
                    )}

                  {sesiones.length >
                    2 && (
                    <p className="px-1 text-[9px] font-semibold text-slate-400">
                      +
                      {sesiones.length -
                        2}{" "}
                      más
                    </p>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </>
  );
}

/*
 * ============================================================
 * MOVER MES
 * ============================================================
 */

function previousMonth(
  actual: {
    year: number;
    month: number;
  }
) {
  if (
    actual.month ===
    0
  ) {
    return {
      year:
        actual.year -
        1,

      month:
        11,
    };
  }

  return {
    year:
      actual.year,

    month:
      actual.month -
      1,
  };
}

function nextMonth(
  actual: {
    year: number;
    month: number;
  }
) {
  if (
    actual.month ===
    11
  ) {
    return {
      year:
        actual.year +
        1,

      month:
        0,
    };
  }

  return {
    year:
      actual.year,

    month:
      actual.month +
      1,
  };
}

/*
 * ============================================================
 * COLORES ESTADO
 * ============================================================
 */

function estadoClasses(
  estado: EstadoDia
) {
  switch (
    estado
  ) {
    case "COMPLETED_ON_TIME":
      return "bg-emerald-100 text-emerald-700";

    case "COMPLETED_LATE":
      return "bg-amber-100 text-amber-700";

    case "MISSED":
      return "bg-red-100 text-red-700";

    case "TODAY":
      return "bg-blue-100 text-blue-700";

    case "UPCOMING":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-50 text-slate-400";
  }
}

/*
 * ============================================================
 * BADGE
 * ============================================================
 */

function StatusBadge({
  estado,
}: {
  estado:
    EstadoDia;
}) {
  const datos: Record<
    EstadoDia,
    {
      label: string;
      icon:
        React.ReactNode;
    }
  > = {
    COMPLETED_ON_TIME: {
      label:
        "Completado a tiempo",

      icon:
        <CheckCircle2
          size={14}
        />,
    },

    COMPLETED_LATE: {
      label:
        "Completado tarde",

      icon:
        <Clock
          size={14}
        />,
    },

    MISSED: {
      label:
        "Vencido",

      icon:
        <AlertTriangle
          size={14}
        />,
    },

    TODAY: {
      label:
        "Hoy",

      icon:
        <CalendarDays
          size={14}
        />,
    },

    UPCOMING: {
      label:
        "Próximo",

      icon:
        <Circle
          size={14}
        />,
    },

    UNSCHEDULED: {
      label:
        "Sin programar",

      icon:
        <Circle
          size={14}
        />,
    },
  };

  return (
    <div
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${estadoClasses(
        estado
      )}`}
    >
      {
        datos[
          estado
        ].icon
      }

      {
        datos[
          estado
        ].label
      }
    </div>
  );
}

/*
 * ============================================================
 * LEYENDA
 * ============================================================
 */

function Leyenda({
  label,
  estado,
}: {
  label: string;

  estado:
    EstadoDia;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
      <span
        className={`h-2.5 w-2.5 rounded-full ${estadoClasses(
          estado
        )}`}
      />

      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>
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