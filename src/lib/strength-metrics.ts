export type StrengthSet = {
  setNumber: number;
  reps: number | null;
  loadKg: number | null;
};

export type StrengthSession = {
  sessionId: string;
  fecha: string;
  dia: string;
  sets: StrengthSet[];
};

export type StrengthRecordSet = {
  sessionId: string;
  fecha: string;
  dia: string;

  setNumber: number;

  reps: number;
  loadKg: number;

  estimated1RM: number;
  volume: number;
};

export type StrengthSessionMetric = {
  sessionId: string;
  fecha: string;
  dia: string;

  maxLoad: number | null;
  estimated1RM: number | null;
  volume: number;

  prCarga: boolean;
  pr1RM: boolean;
};

/*
 * ============================================================
 * REDONDEAR
 * ============================================================
 */

function round(
  value: number,
  decimals = 2
) {
  const factor =
    10 ** decimals;

  return (
    Math.round(
      value * factor
    ) / factor
  );
}

/*
 * ============================================================
 * 1RM ESTIMADO
 * ============================================================
 *
 * Fórmula Epley:
 *
 * 1RM = peso × (1 + reps / 30)
 *
 * Para 1 repetición:
 * 1RM = peso utilizado.
 *
 * Limitamos el cálculo a 12 reps
 * porque con series muy largas
 * la estimación empieza a perder
 * bastante utilidad práctica.
 */

export function calcular1RM(
  loadKg: number | null,
  reps: number | null
) {
  if (
    loadKg === null ||
    reps === null ||
    loadKg <= 0 ||
    reps <= 0
  ) {
    return null;
  }

  if (reps === 1) {
    return round(
      loadKg
    );
  }

  if (reps > 12) {
    return null;
  }

  return round(
    loadKg *
      (1 + reps / 30)
  );
}

/*
 * ============================================================
 * SERIES VÁLIDAS
 * ============================================================
 */

export function obtenerSeriesValidas(
  sesiones: StrengthSession[]
): StrengthRecordSet[] {
  const resultado:
    StrengthRecordSet[] =
      [];

  for (
    const sesion of sesiones
  ) {
    for (
      const set of sesion.sets
    ) {
      if (
        set.loadKg ===
          null ||
        set.reps === null ||
        set.loadKg <=
          0 ||
        set.reps <= 0
      ) {
        continue;
      }

      const estimated1RM =
        calcular1RM(
          set.loadKg,
          set.reps
        );

      resultado.push({
        sessionId:
          sesion.sessionId,

        fecha:
          sesion.fecha,

        dia:
          sesion.dia,

        setNumber:
          set.setNumber,

        reps:
          set.reps,

        loadKg:
          set.loadKg,

        estimated1RM:
          estimated1RM ??
          set.loadKg,

        volume:
          round(
            set.loadKg *
              set.reps
          ),
      });
    }
  }

  return resultado;
}

/*
 * ============================================================
 * MEJOR CARGA
 * ============================================================
 */

export function obtenerPRCarga(
  sesiones: StrengthSession[]
) {
  const series =
    obtenerSeriesValidas(
      sesiones
    );

  if (
    series.length === 0
  ) {
    return null;
  }

  return [...series].sort(
    (a, b) => {
      if (
        b.loadKg !==
        a.loadKg
      ) {
        return (
          b.loadKg -
          a.loadKg
        );
      }

      return (
        b.reps -
        a.reps
      );
    }
  )[0];
}

/*
 * ============================================================
 * MEJOR 1RM
 * ============================================================
 */

export function obtenerPR1RM(
  sesiones: StrengthSession[]
) {
  const series =
    obtenerSeriesValidas(
      sesiones
    ).filter(
      (serie) =>
        serie.reps <= 12
    );

  if (
    series.length === 0
  ) {
    return null;
  }

  return [...series].sort(
    (a, b) =>
      b.estimated1RM -
      a.estimated1RM
  )[0];
}

/*
 * ============================================================
 * MEJOR SERIE
 * ============================================================
 *
 * La consideramos como la serie
 * con mayor 1RM estimado.
 */

export function obtenerMejorSerie(
  sesiones: StrengthSession[]
) {
  return obtenerPR1RM(
    sesiones
  );
}

/*
 * ============================================================
 * RÉCORD DE REPETICIONES
 * ============================================================
 *
 * Máximo número de repeticiones
 * realizado utilizando una carga > 0.
 */

export function obtenerPRRepeticiones(
  sesiones: StrengthSession[]
) {
  const series =
    obtenerSeriesValidas(
      sesiones
    );

  if (
    series.length === 0
  ) {
    return null;
  }

  return [...series].sort(
    (a, b) => {
      if (
        b.reps !==
        a.reps
      ) {
        return (
          b.reps -
          a.reps
        );
      }

      return (
        b.loadKg -
        a.loadKg
      );
    }
  )[0];
}

/*
 * ============================================================
 * MEJOR VOLUMEN POR SERIE
 * ============================================================
 */

export function obtenerPRVolumenSerie(
  sesiones: StrengthSession[]
) {
  const series =
    obtenerSeriesValidas(
      sesiones
    );

  if (
    series.length === 0
  ) {
    return null;
  }

  return [...series].sort(
    (a, b) =>
      b.volume -
      a.volume
  )[0];
}

/*
 * ============================================================
 * VOLUMEN DE SESIÓN
 * ============================================================
 */

export function calcularVolumenSesion(
  sesion: StrengthSession
) {
  return round(
    sesion.sets.reduce(
      (
        total,
        set
      ) => {
        if (
          set.loadKg ===
            null ||
          set.reps ===
            null ||
          set.loadKg <=
            0 ||
          set.reps <= 0
        ) {
          return total;
        }

        return (
          total +
          set.loadKg *
            set.reps
        );
      },
      0
    )
  );
}

/*
 * ============================================================
 * MEJOR SESIÓN POR VOLUMEN
 * ============================================================
 */

export function obtenerPRVolumenSesion(
  sesiones: StrengthSession[]
) {
  if (
    sesiones.length === 0
  ) {
    return null;
  }

  const valores =
    sesiones.map(
      (sesion) => ({
        ...sesion,

        volume:
          calcularVolumenSesion(
            sesion
          ),
      })
    );

  const conVolumen =
    valores.filter(
      (item) =>
        item.volume > 0
    );

  if (
    conVolumen.length ===
    0
  ) {
    return null;
  }

  return [...conVolumen].sort(
    (a, b) =>
      b.volume -
      a.volume
  )[0];
}

/*
 * ============================================================
 * MÉTRICAS POR SESIÓN
 * ============================================================
 *
 * Además detectamos cuándo una sesión
 * estableció un nuevo récord.
 */

export function calcularMetricasSesiones(
  sesiones: StrengthSession[]
): StrengthSessionMetric[] {
  let recordCarga =
    -Infinity;

  let record1RM =
    -Infinity;

  return sesiones.map(
    (sesion) => {
      const series =
        obtenerSeriesValidas([
          sesion,
        ]);

      const maxLoad =
        series.length > 0
          ? Math.max(
              ...series.map(
                (serie) =>
                  serie.loadKg
              )
            )
          : null;

      const series1RM =
        series.filter(
          (serie) =>
            serie.reps <=
            12
        );

      const estimated1RM =
        series1RM.length >
        0
          ? Math.max(
              ...series1RM.map(
                (serie) =>
                  serie.estimated1RM
              )
            )
          : null;

      let prCarga =
        false;

      let pr1RM =
        false;

      if (
        maxLoad !==
          null &&
        maxLoad >
          recordCarga
      ) {
        prCarga =
          recordCarga !==
          -Infinity;

        recordCarga =
          maxLoad;
      }

      if (
        estimated1RM !==
          null &&
        estimated1RM >
          record1RM
      ) {
        pr1RM =
          record1RM !==
          -Infinity;

        record1RM =
          estimated1RM;
      }

      return {
        sessionId:
          sesion.sessionId,

        fecha:
          sesion.fecha,

        dia:
          sesion.dia,

        maxLoad,

        estimated1RM,

        volume:
          calcularVolumenSesion(
            sesion
          ),

        prCarga,
        pr1RM,
      };
    }
  );
}