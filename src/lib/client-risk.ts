import type {
  AdherenceWorkout,
} from "@/lib/adherence";

import type {
  AdherenceAnalytics,
} from "@/lib/adherence-analytics";

export type ClientRiskLevel =
  | "NO_DATA"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ClientRiskResult = {
  level: ClientRiskLevel;

  score: number;

  reasons: string[];

  consecutiveMissed: number;

  missed30: number;

  late30: number;

  maxOverdueDays: number;
};

/*
 * ============================================================
 * FECHAS
 * ============================================================
 */

function bogotaTodayKey(
  now = new Date()
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
      now
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

function dateKey(
  date: Date
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function daysBetween(
  start: string,
  end: string
) {
  const inicio =
    new Date(
      `${start}T12:00:00Z`
    );

  const fin =
    new Date(
      `${end}T12:00:00Z`
    );

  return Math.max(
    0,
    Math.floor(
      (fin.getTime() -
        inicio.getTime()) /
        86_400_000
    )
  );
}

/*
 * ============================================================
 * SESIONES PERDIDAS CONSECUTIVAS
 * ============================================================
 */

function calcularPerdidasConsecutivas(
  detalle: AdherenceWorkout[]
) {
  const evaluadas =
    detalle
      .filter(
        (item) =>
          item.status ===
            "MISSED" ||
          item.status ===
            "COMPLETED_ON_TIME" ||
          item.status ===
            "COMPLETED_LATE"
      )
      .sort(
        (a, b) => {
          if (
            !a.scheduledDate ||
            !b.scheduledDate
          ) {
            return 0;
          }

          const fechaA =
            dateKey(
              a.scheduledDate
            );

          const fechaB =
            dateKey(
              b.scheduledDate
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

  let consecutivas =
    0;

  for (
    let index =
      evaluadas.length -
      1;
    index >= 0;
    index--
  ) {
    if (
      evaluadas[index]
        .status ===
      "MISSED"
    ) {
      consecutivas++;
    } else {
      break;
    }
  }

  return consecutivas;
}

/*
 * ============================================================
 * ATRASO MÁXIMO
 * ============================================================
 */

function calcularMaximoAtraso(
  detalle: AdherenceWorkout[],
  now: Date
) {
  const today =
    bogotaTodayKey(now);

  const perdidas =
    detalle.filter(
      (
        item
      ): item is AdherenceWorkout & {
        scheduledDate: Date;
      } =>
        item.status ===
          "MISSED" &&
        item.scheduledDate !==
          null
    );

  if (
    perdidas.length === 0
  ) {
    return 0;
  }

  return Math.max(
    ...perdidas.map(
      (item) =>
        daysBetween(
          dateKey(
            item.scheduledDate
          ),
          today
        )
    )
  );
}

/*
 * ============================================================
 * MOTOR DE RIESGO
 * ============================================================
 */

export function calcularRiesgoCliente({
  detalle,
  analytics,
  now = new Date(),
}: {
  detalle:
    AdherenceWorkout[];

  analytics:
    AdherenceAnalytics;

  now?: Date;
}): ClientRiskResult {
  /*
   * Sin sesiones evaluables todavía:
   *
   * no tiene sentido etiquetar al cliente
   * como de riesgo.
   */
  if (
    analytics.totales
      .evaluadas === 0
  ) {
    return {
      level:
        "NO_DATA",

      score: 0,

      reasons: [
        "Todavía no hay suficientes sesiones evaluables.",
      ],

      consecutiveMissed:
        0,

      missed30: 0,

      late30: 0,

      maxOverdueDays:
        0,
    };
  }

  let score =
    0;

  const reasons:
    string[] = [];

  const adherencia30 =
    analytics.ultimos30
      .adherencia;

  const tendencia =
    analytics.tendencia30;

  const missed30 =
    analytics.ultimos30
      .perdidas;

  const late30 =
    analytics.ultimos30
      .tarde;

  const consecutiveMissed =
    calcularPerdidasConsecutivas(
      detalle
    );

  const maxOverdueDays =
    calcularMaximoAtraso(
      detalle,
      now
    );

  /*
   * ==========================================================
   * ADHERENCIA
   * ==========================================================
   */

  if (
    adherencia30 !==
    null
  ) {
    if (
      adherencia30 < 50
    ) {
      score += 4;

      reasons.push(
        `Adherencia crítica de ${adherencia30}% en los últimos 30 días.`
      );
    } else if (
      adherencia30 < 70
    ) {
      score += 3;

      reasons.push(
        `Adherencia baja de ${adherencia30}% en los últimos 30 días.`
      );
    } else if (
      adherencia30 < 85
    ) {
      score += 1;

      reasons.push(
        `Adherencia por debajo del objetivo: ${adherencia30}%.`
      );
    }
  }

  /*
   * ==========================================================
   * SESIONES CONSECUTIVAS PERDIDAS
   * ==========================================================
   */

  if (
    consecutiveMissed >=
    3
  ) {
    score += 5;

    reasons.push(
      `${consecutiveMissed} sesiones consecutivas sin completar.`
    );
  } else if (
    consecutiveMissed ===
    2
  ) {
    score += 3;

    reasons.push(
      "2 sesiones consecutivas sin completar."
    );
  } else if (
    consecutiveMissed ===
    1
  ) {
    score += 1;

    reasons.push(
      "La última sesión exigible no fue completada."
    );
  }

  /*
   * ==========================================================
   * SESIONES PERDIDAS ÚLTIMOS 30 DÍAS
   * ==========================================================
   */

  if (
    missed30 >= 3
  ) {
    score += 3;

    reasons.push(
      `${missed30} sesiones perdidas durante los últimos 30 días.`
    );
  } else if (
    missed30 === 2
  ) {
    score += 2;

    reasons.push(
      "2 sesiones perdidas durante los últimos 30 días."
    );
  } else if (
    missed30 === 1
  ) {
    score += 1;
  }

  /*
   * ==========================================================
   * TENDENCIA
   * ==========================================================
   */

  if (
    tendencia !== null
  ) {
    if (
      tendencia <= -20
    ) {
      score += 2;

      reasons.push(
        `La adherencia cayó ${Math.abs(
          tendencia
        )} puntos porcentuales.`
      );
    } else if (
      tendencia <= -10
    ) {
      score += 1;

      reasons.push(
        `La adherencia cayó ${Math.abs(
          tendencia
        )} puntos porcentuales.`
      );
    }
  }

  /*
   * ==========================================================
   * SESIONES REALIZADAS TARDE
   * ==========================================================
   */

  if (
    late30 >= 3
  ) {
    score += 1;

    reasons.push(
      `${late30} entrenamientos fueron realizados tarde durante los últimos 30 días.`
    );
  }

  /*
   * ==========================================================
   * ATRASO ANTIGUO
   * ==========================================================
   */

  if (
    maxOverdueDays >= 7
  ) {
    score += 1;

    reasons.push(
      `Existe una sesión pendiente desde hace ${maxOverdueDays} días.`
    );
  }

  /*
   * ==========================================================
   * NIVEL
   * ==========================================================
   */

  let level:
    ClientRiskLevel;

  if (score >= 9) {
    level =
      "CRITICAL";
  } else if (
    score >= 6
  ) {
    level =
      "HIGH";
  } else if (
    score >= 3
  ) {
    level =
      "MEDIUM";
  } else {
    level =
      "LOW";
  }

  if (
    reasons.length === 0
  ) {
    reasons.push(
      "El cliente mantiene un comportamiento estable."
    );
  }

  return {
    level,

    score,

    reasons,

    consecutiveMissed,

    missed30,

    late30,

    maxOverdueDays,
  };
}