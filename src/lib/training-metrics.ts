type SemanaPlan = {
  number: number;

  days: {
    position: number;
  }[];
};

type SesionCompletada = {
  weekNumber: number;
  dayPosition: number | null;
};

function claveDia(
  semana: number,
  posicion: number
) {
  return `${semana}:${posicion}`;
}

export function calcularProgresoPlan(
  semanas: SemanaPlan[],
  sesiones: SesionCompletada[]
) {
  const diasPlan = semanas.flatMap(
    (semana) =>
      semana.days.map((dia) => ({
        semana:
          semana.number,

        posicion:
          dia.position,
      }))
  );

  const completadas =
    new Set(
      sesiones
        .filter(
          (
            sesion
          ): sesion is SesionCompletada & {
            dayPosition: number;
          } =>
            sesion.dayPosition !== null
        )
        .map((sesion) =>
          claveDia(
            sesion.weekNumber,
            sesion.dayPosition
          )
        )
    );

  const sesionesCompletadas =
    diasPlan.filter((dia) =>
      completadas.has(
        claveDia(
          dia.semana,
          dia.posicion
        )
      )
    ).length;

  const totalSesiones =
    diasPlan.length;

  const porcentaje =
    totalSesiones > 0
      ? Math.min(
          100,
          Math.round(
            (sesionesCompletadas /
              totalSesiones) *
              100
          )
        )
      : 0;

  return {
    totalSesiones,
    sesionesCompletadas,
    porcentaje,

    completado:
      totalSesiones > 0 &&
      sesionesCompletadas >=
        totalSesiones,
  };
}