import type {
  AdherenceWorkout,
} from "@/lib/adherence";

/*
 * ============================================================
 * TIPOS
 * ============================================================
 */

export type AdherencePeriodMetric = {
  key: string;

  label: string;

  startDate: string;

  endDate: string;

  programadas: number;

  evaluadas: number;

  completadas: number;

  aTiempo: number;

  tarde: number;

  perdidas: number;

  adherencia:
    | number
    | null;

  puntualidad:
    | number
    | null;
};

export type AdherenceAnalytics = {
  ultimos7:
    AdherencePeriodMetric;

  ultimos30:
    AdherencePeriodMetric;

  ultimos90:
    AdherencePeriodMetric;

  tendencia30:
    | number
    | null;

  rachaActual:
    number;

  mejorRacha:
    number;

  totales: {
    programadas:
      number;

    evaluadas:
      number;

    completadas:
      number;

    aTiempo:
      number;

    tarde:
      number;

    perdidas:
      number;

    hoy:
      number;

    proximas:
      number;
  };

  semanas:
    AdherencePeriodMetric[];

  meses:
    AdherencePeriodMetric[];
};

/*
 * ============================================================
 * FECHAS
 * ============================================================
 */

function scheduledKey(
  date: Date
) {
  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function localDateKey(
  date: Date,
  timeZone: string
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      date
    );

  const year =
    partes.find(
      (parte) =>
        parte.type ===
        "year"
    )?.value;

  const month =
    partes.find(
      (parte) =>
        parte.type ===
        "month"
    )?.value;

  const day =
    partes.find(
      (parte) =>
        parte.type ===
        "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function keyToDate(
  key: string
) {
  const [
    year,
    month,
    day,
  ] =
    key
      .split("-")
      .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12,
      0,
      0
    )
  );
}

function addDays(
  key: string,
  days: number
) {
  const date =
    keyToDate(
      key
    );

  date.setUTCDate(
    date.getUTCDate() +
      days
  );

  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function startOfWeek(
  key: string
) {
  const date =
    keyToDate(
      key
    );

  /*
   * JS:
   * domingo = 0
   *
   * Nosotros:
   * lunes inicia semana.
   */
  const offset =
    (
      date.getUTCDay() +
      6
    ) %
    7;

  date.setUTCDate(
    date.getUTCDate() -
      offset
  );

  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function formatDayMonth(
  key: string
) {
  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day:
        "numeric",

      month:
        "short",

      timeZone:
        "UTC",
    }
  ).format(
    keyToDate(
      key
    )
  );
}

function formatMonth(
  key: string
) {
  return new Intl.DateTimeFormat(
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
    keyToDate(
      key
    )
  );
}

/*
 * ============================================================
 * SESIÓN EVALUABLE
 * ============================================================
 *
 * IMPORTANTE:
 *
 * Una sesión pendiente de HOY
 * todavía NO cuenta negativamente.
 *
 * Una sesión completada hoy sí.
 */

function esEvaluable(
  item:
    AdherenceWorkout,

  today:
    string
) {
  if (
    !item.scheduledDate
  ) {
    return false;
  }

  const scheduled =
    scheduledKey(
      item.scheduledDate
    );

  return (
    scheduled <
      today ||
    item.completedAt !==
      null
  );
}

function completada(
  item:
    AdherenceWorkout
) {
  return (
    item.status ===
      "COMPLETED_ON_TIME" ||
    item.status ===
      "COMPLETED_LATE"
  );
}

/*
 * ============================================================
 * MÉTRICA DE PERIODO
 * ============================================================
 */

function calcularPeriodo({
  key,
  label,
  startDate,
  endDate,
  detalle,
  today,
}: {
  key: string;

  label: string;

  startDate:
    string;

  endDate:
    string;

  detalle:
    AdherenceWorkout[];

  today:
    string;
}): AdherencePeriodMetric {
  const programadas =
    detalle.filter(
      (item) => {
        if (
          !item.scheduledDate
        ) {
          return false;
        }

        const fecha =
          scheduledKey(
            item.scheduledDate
          );

        return (
          fecha >=
            startDate &&
          fecha <=
            endDate
        );
      }
    );

  const evaluadas =
    programadas.filter(
      (item) =>
        esEvaluable(
          item,
          today
        )
    );

  const completadas =
    evaluadas.filter(
      completada
    );

  const aTiempo =
    completadas.filter(
      (item) =>
        item.status ===
        "COMPLETED_ON_TIME"
    );

  const tarde =
    completadas.filter(
      (item) =>
        item.status ===
        "COMPLETED_LATE"
    );

  const perdidas =
    evaluadas.filter(
      (item) =>
        item.status ===
        "MISSED"
    );

  const adherencia =
    evaluadas.length >
    0
      ? Math.round(
          (completadas.length /
            evaluadas.length) *
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
    key,

    label,

    startDate,

    endDate,

    programadas:
      programadas.length,

    evaluadas:
      evaluadas.length,

    completadas:
      completadas.length,

    aTiempo:
      aTiempo.length,

    tarde:
      tarde.length,

    perdidas:
      perdidas.length,

    adherencia,

    puntualidad,
  };
}

/*
 * ============================================================
 * RACHAS
 * ============================================================
 */

function calcularRachas(
  detalle:
    AdherenceWorkout[],

  today:
    string
) {
  const evaluadas =
    detalle
      .filter(
        (item) =>
          item.scheduledDate &&
          esEvaluable(
            item,
            today
          )
      )
      .sort(
        (
          a,
          b
        ) => {
          const fechaA =
            scheduledKey(
              a.scheduledDate!
            );

          const fechaB =
            scheduledKey(
              b.scheduledDate!
            );

          if (
            fechaA !==
            fechaB
          ) {
            return fechaA.localeCompare(
              fechaB
            );
          }

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

  let mejor =
    0;

  let actual =
    0;

  let temporal =
    0;

  /*
   * Mejor racha histórica.
   */
  for (
    const item of
      evaluadas
  ) {
    if (
      completada(
        item
      )
    ) {
      temporal++;

      mejor =
        Math.max(
          mejor,
          temporal
        );
    } else {
      temporal =
        0;
    }
  }

  /*
   * Racha actual:
   *
   * contar desde el entrenamiento
   * exigible más reciente hacia atrás.
   */
  for (
    let index =
      evaluadas.length -
      1;
    index >= 0;
    index--
  ) {
    if (
      completada(
        evaluadas[
          index
        ]
      )
    ) {
      actual++;
    } else {
      break;
    }
  }

  return {
    actual,
    mejor,
  };
}

/*
 * ============================================================
 * ANALÍTICA COMPLETA
 * ============================================================
 */

export function calcularAnaliticaAdherencia({
  detalle,
  now = new Date(),
  timeZone = "America/Bogota",
}: {
  detalle:
    AdherenceWorkout[];

  now?:
    Date;

  timeZone?:
    string;
}): AdherenceAnalytics {
  const today =
    localDateKey(
      now,
      timeZone
    );

  /*
   * ============================================
   * 7 / 30 / 90 DÍAS
   * ============================================
   */

  const ultimos7 =
    calcularPeriodo({
      key:
        "last-7",

      label:
        "Últimos 7 días",

      startDate:
        addDays(
          today,
          -6
        ),

      endDate:
        today,

      detalle,

      today,
    });

  const ultimos30 =
    calcularPeriodo({
      key:
        "last-30",

      label:
        "Últimos 30 días",

      startDate:
        addDays(
          today,
          -29
        ),

      endDate:
        today,

      detalle,

      today,
    });

  const ultimos90 =
    calcularPeriodo({
      key:
        "last-90",

      label:
        "Últimos 90 días",

      startDate:
        addDays(
          today,
          -89
        ),

      endDate:
        today,

      detalle,

      today,
    });

  /*
   * Periodo anterior de 30 días
   * para tendencia.
   */
  const anteriores30 =
    calcularPeriodo({
      key:
        "previous-30",

      label:
        "30 días anteriores",

      startDate:
        addDays(
          today,
          -59
        ),

      endDate:
        addDays(
          today,
          -30
        ),

      detalle,

      today,
    });

  const tendencia30 =
    ultimos30.adherencia !==
      null &&
    anteriores30.adherencia !==
      null
      ? ultimos30.adherencia -
        anteriores30.adherencia
      : null;

  /*
   * ============================================
   * RACHAS
   * ============================================
   */

  const rachas =
    calcularRachas(
      detalle,
      today
    );

  /*
   * ============================================
   * TOTALES DEL PLAN
   * ============================================
   */

  const programadas =
    detalle.filter(
      (item) =>
        item.scheduledDate !==
        null
    );

  const evaluadas =
    programadas.filter(
      (item) =>
        esEvaluable(
          item,
          today
        )
    );

  const totalCompletadas =
    evaluadas.filter(
      completada
    );

  const totalATiempo =
    totalCompletadas.filter(
      (item) =>
        item.status ===
        "COMPLETED_ON_TIME"
    );

  const totalTarde =
    totalCompletadas.filter(
      (item) =>
        item.status ===
        "COMPLETED_LATE"
    );

  const totalPerdidas =
    evaluadas.filter(
      (item) =>
        item.status ===
        "MISSED"
    );

  const hoy =
    programadas.filter(
      (item) =>
        item.status ===
        "TODAY"
    );

  const proximas =
    programadas.filter(
      (item) =>
        item.status ===
        "UPCOMING"
    );

  /*
   * ============================================
   * ÚLTIMAS 8 SEMANAS
   * ============================================
   */

  const semanaActual =
    startOfWeek(
      today
    );

  const semanas:
    AdherencePeriodMetric[] =
      [];

  for (
    let offset = 7;
    offset >= 0;
    offset--
  ) {
    const inicio =
      addDays(
        semanaActual,
        -(offset * 7)
      );

    const fin =
      addDays(
        inicio,
        6
      );

    semanas.push(
      calcularPeriodo({
        key:
          `week-${inicio}`,

        label:
          `${formatDayMonth(
            inicio
          )} – ${formatDayMonth(
            fin
          )}`,

        startDate:
          inicio,

        endDate:
          fin,

        detalle,

        today,
      })
    );
  }

  /*
   * ============================================
   * ÚLTIMOS 6 MESES
   * ============================================
   */

  const todayDate =
    keyToDate(
      today
    );

  const meses:
    AdherencePeriodMetric[] =
      [];

  for (
    let offset = 5;
    offset >= 0;
    offset--
  ) {
    const inicioDate =
      new Date(
        Date.UTC(
          todayDate.getUTCFullYear(),
          todayDate.getUTCMonth() -
            offset,
          1,
          12
        )
      );

    const finDate =
      new Date(
        Date.UTC(
          inicioDate.getUTCFullYear(),
          inicioDate.getUTCMonth() +
            1,
          0,
          12
        )
      );

    const inicio =
      inicioDate
        .toISOString()
        .slice(
          0,
          10
        );

    const fin =
      finDate
        .toISOString()
        .slice(
          0,
          10
        );

    meses.push(
      calcularPeriodo({
        key:
          `month-${inicio}`,

        label:
          formatMonth(
            inicio
          ),

        startDate:
          inicio,

        endDate:
          fin,

        detalle,

        today,
      })
    );
  }

  return {
    ultimos7,

    ultimos30,

    ultimos90,

    tendencia30,

    rachaActual:
      rachas.actual,

    mejorRacha:
      rachas.mejor,

    totales: {
      programadas:
        programadas.length,

      evaluadas:
        evaluadas.length,

      completadas:
        totalCompletadas.length,

      aTiempo:
        totalATiempo.length,

      tarde:
        totalTarde.length,

      perdidas:
        totalPerdidas.length,

      hoy:
        hoy.length,

      proximas:
        proximas.length,
    },

    semanas,

    meses,
  };
}