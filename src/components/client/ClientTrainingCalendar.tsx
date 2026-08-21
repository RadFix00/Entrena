"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Target,
  Trophy,
} from "lucide-react";

import type {
  AdherenceAnalytics,
} from "@/lib/adherence-analytics";

import type {
  AdherenceStatus,
} from "@/lib/adherence";

export type ClientCalendarDayUI = {
  id: string;

  name: string;

  description:
    | string
    | null;

  weekNumber: number;

  position: number;

  scheduledDate:
    | string
    | null;

  completedAt:
    | string
    | null;

  status:
    AdherenceStatus;
};

type Props = {
  planName: string;

  todayKey: string;

  dias:
    ClientCalendarDayUI[];

  analytics:
    AdherenceAnalytics;
};

/*
 * ============================================================
 * FECHAS
 * ============================================================
 */

function fechaUTC(
  key: string
) {
  return new Date(
    `${key}T12:00:00Z`
  );
}

function formatearFecha(
  key: string
) {
  return new Intl.DateTimeFormat(
    "es-CO",
    {
      weekday:
        "short",

      day:
        "numeric",

      month:
        "short",

      timeZone:
        "UTC",
    }
  ).format(
    fechaUTC(key)
  );
}

function formatearFechaLarga(
  key: string
) {
  return new Intl.DateTimeFormat(
    "es-CO",
    {
      weekday:
        "long",

      day:
        "numeric",

      month:
        "long",

      timeZone:
        "UTC",
    }
  ).format(
    fechaUTC(key)
  );
}

function mesDeFecha(
  key: string
) {
  const [
    year,
    month,
  ] =
    key
      .split("-")
      .map(Number);

  return {
    year,

    month:
      month - 1,
  };
}

/*
 * ============================================================
 * COMPONENTE
 * ============================================================
 */

export default function ClientTrainingCalendar({
  planName,
  todayKey,
  dias,
  analytics,
}: Props) {
  /*
   * ============================================
   * MES INICIAL
   * ============================================
   *
   * Preferimos:
   *
   * hoy
   * ↓
   * próxima sesión
   * ↓
   * fecha actual
   */

  const primeraProxima =
    dias.find(
      (dia) =>
        dia.status ===
          "TODAY" ||
        dia.status ===
          "UPCOMING"
    );

  const fechaInicial =
    primeraProxima
      ?.scheduledDate ??
    todayKey;

  const [
    mes,
    setMes,
  ] = useState(
    mesDeFecha(
      fechaInicial
    )
  );

  /*
   * ============================================
   * CLASIFICAR
   * ============================================
   */

  const sesionesHoy =
    useMemo(
      () =>
        dias
          .filter(
            (dia) =>
              dia.status ===
              "TODAY"
          )
          .sort(
            (a, b) =>
              a.position -
              b.position
          ),
      [dias]
    );

  const proximas =
    useMemo(
      () =>
        dias
          .filter(
            (dia) =>
              dia.status ===
              "UPCOMING"
          )
          .sort(
            (a, b) =>
              (
                a.scheduledDate ??
                ""
              ).localeCompare(
                b.scheduledDate ??
                  ""
              )
          ),
      [dias]
    );

  const atrasadas =
    useMemo(
      () =>
        dias
          .filter(
            (dia) =>
              dia.status ===
              "MISSED"
          )
          .sort(
            (a, b) =>
              (
                b.scheduledDate ??
                ""
              ).localeCompare(
                a.scheduledDate ??
                  ""
              )
          ),
      [dias]
    );

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
          ClientCalendarDayUI[]
        >();

      for (
        const dia of dias
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
    }, [dias]);

  /*
   * ============================================
   * UI
   * ============================================
   */

  return (
    <div className="mt-7 space-y-6">
      {/* ====================================== */}
      {/* MÉTRICAS */}
      {/* ====================================== */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica
          titulo="Adherencia"
          valor={
            analytics
              .ultimos30
              .adherencia !==
            null
              ? `${analytics.ultimos30.adherencia}%`
              : "—"
          }
          detalle="Últimos 30 días"
          icono={
            <Target
              size={20}
            />
          }
        />

        <Metrica
          titulo="Racha actual"
          valor={`${analytics.rachaActual}`}
          detalle="Sesiones consecutivas"
          icono={
            <Flame
              size={20}
            />
          }
        />

        <Metrica
          titulo="Para hoy"
          valor={`${sesionesHoy.length}`}
          detalle={
            sesionesHoy.length ===
            1
              ? "Entrenamiento pendiente"
              : "Entrenamientos pendientes"
          }
          icono={
            <CalendarCheck2
              size={20}
            />
          }
        />

        <Metrica
          titulo="Atrasadas"
          valor={`${atrasadas.length}`}
          detalle="Sesiones sin completar"
          icono={
            <AlertTriangle
              size={20}
            />
          }
        />
      </section>

      {/* ====================================== */}
      {/* ESTADO DE HOY */}
      {/* ====================================== */}

      {sesionesHoy.length >
      0 ? (
        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <CalendarCheck2
                  size={23}
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Hoy entrenas
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {sesionesHoy.length ===
                  1
                    ? sesionesHoy[0]
                        .name
                    : `${sesionesHoy.length} sesiones programadas`}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatearFechaLarga(
                    todayKey
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {sesionesHoy.map(
                (dia) => (
                  <div
                    key={
                      dia.id
                    }
                    className="flex flex-col justify-between gap-2 rounded-xl border border-emerald-100 bg-white px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {
                          dia.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Semana{" "}
                        {
                          dia.weekNumber
                        }
                        {dia.description &&
                          ` · ${dia.description}`}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      HOY
                    </span>
                  </div>
                )
              )}
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Tu sesión de hoy todavía no reduce tu adherencia mientras el día siga en curso.
            </p>
          </div>
        </section>
      ) : atrasadas.length >
        0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock3
                size={21}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Hay sesiones pendientes
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Tienes{" "}
                {
                  atrasadas.length
                }{" "}
                {atrasadas.length ===
                1
                  ? "entrenamiento atrasado"
                  : "entrenamientos atrasados"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Revisa las sesiones pendientes más abajo y continúa con tu programación.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2
                size={21}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Todo al día
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                No tienes sesiones vencidas
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Continúa siguiendo tu calendario para mantener tu racha.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ====================================== */}
      {/* CALENDARIO */}
      {/* ====================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <MonthCalendar
          year={
            mes.year
          }
          month={
            mes.month
          }
          todayKey={
            todayKey
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

      {/* LEYENDA */}

      <section className="flex flex-wrap gap-2">
        <Leyenda
          label="Completado"
          estado="COMPLETED_ON_TIME"
        />

        <Leyenda
          label="Completado tarde"
          estado="COMPLETED_LATE"
        />

        <Leyenda
          label="Pendiente"
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
      {/* PRÓXIMOS */}
      {/* ====================================== */}

      <section>
        <div className="flex items-center gap-3">
          <CalendarDays
            size={20}
            className="text-emerald-600"
          />

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Próximos entrenamientos
            </h2>

            <p className="text-sm text-slate-500">
              Tu programación más cercana.
            </p>
          </div>
        </div>

        {proximas.length >
        0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {proximas
              .slice(
                0,
                6
              )
              .map(
                (dia) => (
                  <article
                    key={
                      dia.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                          {dia.scheduledDate
                            ? formatearFecha(
                                dia.scheduledDate
                              )
                            : ""}
                        </p>

                        <h3 className="mt-2 font-bold text-slate-900">
                          {
                            dia.name
                          }
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Semana{" "}
                          {
                            dia.weekNumber
                          }
                        </p>
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <CalendarDays
                          size={17}
                        />
                      </div>
                    </div>

                    {dia.description && (
                      <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">
                        {
                          dia.description
                        }
                      </p>
                    )}
                  </article>
                )
              )}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No hay más sesiones futuras programadas.
          </div>
        )}
      </section>

      {/* ====================================== */}
      {/* ATRASADAS */}
      {/* ====================================== */}

      {atrasadas.length >
        0 && (
        <section>
          <div className="flex items-center gap-3">
            <AlertTriangle
              size={20}
              className="text-red-500"
            />

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Sesiones pendientes
              </h2>

              <p className="text-sm text-slate-500">
                Entrenamientos cuya fecha ya pasó.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {atrasadas
              .slice(
                0,
                5
              )
              .map(
                (dia) => (
                  <article
                    key={
                      dia.id
                    }
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-red-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {
                          dia.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Semana{" "}
                        {
                          dia.weekNumber
                        }
                        {" · "}
                        {dia.scheduledDate
                          ? formatearFecha(
                              dia.scheduledDate
                            )
                          : ""}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
                      PENDIENTE
                    </span>
                  </article>
                )
              )}
          </div>
        </section>
      )}

      {/* ====================================== */}
      {/* ADHERENCIA */}
      {/* ====================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Trophy
              size={19}
            />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Tu constancia
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Cumplimiento de tus entrenamientos programados.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Periodo
            titulo="7 días"
            adherencia={
              analytics
                .ultimos7
                .adherencia
            }
            completadas={
              analytics
                .ultimos7
                .completadas
            }
            evaluadas={
              analytics
                .ultimos7
                .evaluadas
            }
          />

          <Periodo
            titulo="30 días"
            adherencia={
              analytics
                .ultimos30
                .adherencia
            }
            completadas={
              analytics
                .ultimos30
                .completadas
            }
            evaluadas={
              analytics
                .ultimos30
                .evaluadas
            }
          />

          <Periodo
            titulo="90 días"
            adherencia={
              analytics
                .ultimos90
                .adherencia
            }
            completadas={
              analytics
                .ultimos90
                .completadas
            }
            evaluadas={
              analytics
                .ultimos90
                .evaluadas
            }
          />
        </div>
      </section>

      {/* ====================================== */}
      {/* RESUMEN PLAN */}
      {/* ====================================== */}

      <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-400">
          Plan actual
        </p>

        <h2 className="mt-2 text-xl font-bold">
          {planName}
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ResumenDato
            valor={
              analytics
                .totales
                .completadas
            }
            label="Cumplidas"
          />

          <ResumenDato
            valor={
              analytics
                .totales
                .perdidas
            }
            label="Pendientes"
          />

          <ResumenDato
            valor={
              analytics
                .mejorRacha
            }
            label="Mejor racha"
          />
        </div>
      </section>
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
  todayKey,
  diasPorFecha,
  onPrevious,
  onNext,
}: {
  year: number;

  month: number;

  todayKey: string;

  diasPorFecha:
    Map<
      string,
      ClientCalendarDayUI[]
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
        1,
        12
      )
    );

  const diasMes =
    new Date(
      Date.UTC(
        year,
        month + 1,
        0,
        12
      )
    ).getUTCDate();

  const desplazamiento =
    (
      primerDia.getUTCDay() +
      6
    ) %
    7;

  const totalCeldas =
    Math.ceil(
      (
        desplazamiento +
        diasMes
      ) /
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
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
            Mi calendario
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
          (dia) => (
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
                  className="min-h-20 border-b border-r border-slate-100 bg-slate-50/50 sm:min-h-28"
                />
              );
            }

            const key =
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
                key
              ) ?? [];

            const esHoy =
              key ===
              todayKey;

            return (
              <div
                key={
                  key
                }
                className={`min-h-20 border-b border-r border-slate-100 p-1.5 sm:min-h-28 sm:p-2 ${
                  esHoy
                    ? "bg-blue-50/60"
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
                            sesion.status
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
 * MES
 * ============================================================
 */

function previousMonth(
  actual: {
    year: number;
    month: number;
  }
) {
  if (
    actual.month === 0
  ) {
    return {
      year:
        actual.year - 1,

      month: 11,
    };
  }

  return {
    year:
      actual.year,

    month:
      actual.month - 1,
  };
}

function nextMonth(
  actual: {
    year: number;
    month: number;
  }
) {
  if (
    actual.month === 11
  ) {
    return {
      year:
        actual.year + 1,

      month: 0,
    };
  }

  return {
    year:
      actual.year,

    month:
      actual.month + 1,
  };
}

/*
 * ============================================================
 * COLORES
 * ============================================================
 */

function estadoClasses(
  estado:
    AdherenceStatus
) {
  switch (estado) {
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
 * LEYENDA
 * ============================================================
 */

function Leyenda({
  label,
  estado,
}: {
  label: string;

  estado:
    AdherenceStatus;
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

/*
 * ============================================================
 * PERIODO
 * ============================================================
 */

function Periodo({
  titulo,
  adherencia,
  completadas,
  evaluadas,
}: {
  titulo: string;

  adherencia:
    | number
    | null;

  completadas: number;

  evaluadas: number;
}) {
  const porcentaje =
    adherencia ?? 0;

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {titulo}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {adherencia !==
            null
              ? `${adherencia}%`
              : "—"}
          </p>
        </div>

        <p className="text-xs font-semibold text-slate-500">
          {completadas}/
          {evaluadas}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${progressColor(
            adherencia
          )}`}
          style={{
            width: `${porcentaje}%`,
          }}
        />
      </div>
    </div>
  );
}

function progressColor(
  valor:
    | number
    | null
) {
  if (valor === null) {
    return "bg-slate-300";
  }

  if (valor >= 90) {
    return "bg-emerald-500";
  }

  if (valor >= 75) {
    return "bg-blue-500";
  }

  if (valor >= 60) {
    return "bg-amber-500";
  }

  return "bg-red-500";
}

/*
 * ============================================================
 * RESUMEN
 * ============================================================
 */

function ResumenDato({
  valor,
  label,
}: {
  valor: number;

  label: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <p className="text-2xl font-bold">
        {valor}
      </p>

      <p className="mt-1 text-xs text-slate-300">
        {label}
      </p>
    </div>
  );
}