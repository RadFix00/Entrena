/*
 * ============================================================
 * ADHERENCIA DE ENTRENAMIENTO
 * ============================================================
 */

export type ScheduledWorkout = {
  id: string;

  weekNumber:
    number;

  position:
    number;

  scheduledDate:
    Date | null;
};

export type CompletedWorkout = {
  workoutDayId:
    | string
    | null;

  weekNumber:
    number;

  dayPosition:
    | number
    | null;

  completedAt:
    | Date
    | null;
};

export type AdherenceStatus =
  | "COMPLETED_ON_TIME"
  | "COMPLETED_LATE"
  | "MISSED"
  | "TODAY"
  | "UPCOMING"
  | "UNSCHEDULED";

export type AdherenceWorkout = {
  workoutDayId:
    string;

  weekNumber:
    number;

  position:
    number;

  scheduledDate:
    Date | null;

  completedAt:
    Date | null;

  status:
    AdherenceStatus;
};

/*
 * ============================================================
 * FECHA DEL CALENDARIO
 * ============================================================
 */

function scheduledDateKey(
  date: Date
) {
  /*
   * scheduledDate se guarda
   * como mediodía UTC.
   */
  return date
    .toISOString()
    .slice(0, 10);
}

/*
 * ============================================================
 * FECHA REAL EN ZONA HORARIA
 * ============================================================
 */

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

function dayKey(
  weekNumber: number,
  position: number
) {
  return `${weekNumber}:${position}`;
}

/*
 * ============================================================
 * CALCULAR ADHERENCIA
 * ============================================================
 */

export function calcularAdherencia({
  dias,
  sesiones,
  now = new Date(),
  timeZone = "America/Bogota",
}: {
  dias:
    ScheduledWorkout[];

  sesiones:
    CompletedWorkout[];

  now?:
    Date;

  timeZone?:
    string;
}) {
  const today =
    localDateKey(
      now,
      timeZone
    );

  /*
   * ============================================
   * MAPA POR ID
   * ============================================
   */

  const sesionesPorId =
    new Map<
      string,
      CompletedWorkout
    >();

  /*
   * Fallback:
   *
   * semana + posición.
   */
  const sesionesPorPosicion =
    new Map<
      string,
      CompletedWorkout
    >();

  for (
    const sesion of sesiones
  ) {
    if (
      sesion.workoutDayId
    ) {
      sesionesPorId.set(
        sesion.workoutDayId,
        sesion
      );
    }

    if (
      sesion.dayPosition !==
      null
    ) {
      sesionesPorPosicion.set(
        dayKey(
          sesion.weekNumber,
          sesion.dayPosition
        ),
        sesion
      );
    }
  }

  /*
   * ============================================
   * ANALIZAR DÍAS
   * ============================================
   */

  const detalle:
    AdherenceWorkout[] =
      dias.map(
        (dia) => {
          const sesion =
            sesionesPorId.get(
              dia.id
            ) ??
            sesionesPorPosicion.get(
              dayKey(
                dia.weekNumber,
                dia.position
              )
            ) ??
            null;

          const completedAt =
            sesion?.completedAt ??
            null;

          /*
           * Sin programación.
           */
          if (
            !dia.scheduledDate
          ) {
            return {
              workoutDayId:
                dia.id,

              weekNumber:
                dia.weekNumber,

              position:
                dia.position,

              scheduledDate:
                null,

              completedAt,

              status:
                "UNSCHEDULED" as const,
            };
          }

          const scheduled =
            scheduledDateKey(
              dia.scheduledDate
            );

          /*
           * Ya fue completado.
           */
          if (completedAt) {
            const completed =
              localDateKey(
                completedAt,
                timeZone
              );

            return {
              workoutDayId:
                dia.id,

              weekNumber:
                dia.weekNumber,

              position:
                dia.position,

              scheduledDate:
                dia.scheduledDate,

              completedAt,

              status:
                completed <=
                scheduled
                  ? ("COMPLETED_ON_TIME" as const)
                  : ("COMPLETED_LATE" as const),
            };
          }

          /*
           * No realizado y fecha vencida.
           */
          if (
            scheduled <
            today
          ) {
            return {
              workoutDayId:
                dia.id,

              weekNumber:
                dia.weekNumber,

              position:
                dia.position,

              scheduledDate:
                dia.scheduledDate,

              completedAt:
                null,

              status:
                "MISSED" as const,
            };
          }

          /*
           * Debe entrenar hoy.
           */
          if (
            scheduled ===
            today
          ) {
            return {
              workoutDayId:
                dia.id,

              weekNumber:
                dia.weekNumber,

              position:
                dia.position,

              scheduledDate:
                dia.scheduledDate,

              completedAt:
                null,

              status:
                "TODAY" as const,
            };
          }

          /*
           * Futuro.
           */
          return {
            workoutDayId:
              dia.id,

            weekNumber:
              dia.weekNumber,

            position:
              dia.position,

            scheduledDate:
              dia.scheduledDate,

            completedAt:
              null,

            status:
              "UPCOMING" as const,
          };
        }
      );

  /*
   * ============================================
   * MÉTRICAS
   * ============================================
   */

  const programadas =
    detalle.filter(
      (dia) =>
        dia.status !==
        "UNSCHEDULED"
    );

  /*
   * Solo sesiones cuya fecha ya llegó.
   */
 const exigibles =
  programadas.filter(
    (dia) => {
      if (!dia.scheduledDate) {
        return false;
      }

      const scheduled =
        scheduledDateKey(
          dia.scheduledDate
        );

      /*
       * Una sesión pendiente de HOY
       * todavía no penaliza adherencia.
       *
       * Si ya se completó hoy,
       * sí entra en el cálculo.
       */
      return (
        scheduled < today ||
        dia.completedAt !== null
      );
    }
  );

  const completadas =
    exigibles.filter(
      (dia) =>
        dia.status ===
          "COMPLETED_ON_TIME" ||
        dia.status ===
          "COMPLETED_LATE"
    );

  const aTiempo =
    exigibles.filter(
      (dia) =>
        dia.status ===
        "COMPLETED_ON_TIME"
    );

  const tarde =
    exigibles.filter(
      (dia) =>
        dia.status ===
        "COMPLETED_LATE"
    );

  const perdidas =
    exigibles.filter(
      (dia) =>
        dia.status ===
        "MISSED"
    );

  const hoy =
    detalle.filter(
      (dia) =>
        dia.status ===
        "TODAY"
    );

  const proximas =
    detalle.filter(
      (dia) =>
        dia.status ===
        "UPCOMING"
    );

  /*
   * ADHERENCIA:
   *
   * completadas / sesiones que
   * deberían haberse realizado.
   */
  const adherencia =
    exigibles.length > 0
      ? Math.round(
          (completadas.length /
            exigibles.length) *
            100
        )
      : null;

  /*
   * PUNTUALIDAD:
   *
   * realizadas a tiempo /
   * realizadas.
   */
  const puntualidad =
    completadas.length > 0
      ? Math.round(
          (aTiempo.length /
            completadas.length) *
            100
        )
      : null;

  return {
    detalle,

    totalProgramadas:
      programadas.length,

    sesionesExigibles:
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
      hoy.length,

    proximas:
      proximas.length,

    adherencia,

    puntualidad,
  };
}