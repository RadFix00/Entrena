export type StrengthChartPoint = {
  id: string;
  fecha: string;
  carga: number;
};

type Props = {
  puntos: StrengthChartPoint[];
};

function fechaCorta(
  fecha: string
) {
  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "numeric",
      month: "short",
    }
  ).format(
    new Date(fecha)
  );
}

export default function StrengthChart({
  puntos,
}: Props) {
  if (
    puntos.length === 0
  ) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-400">
          Todavía no hay registros de carga para este ejercicio.
        </p>
      </div>
    );
  }

  if (
    puntos.length === 1
  ) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-slate-50">
        <p className="text-4xl font-bold text-slate-900">
          {puntos[0].carga} kg
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {fechaCorta(
            puntos[0].fecha
          )}
        </p>

        <p className="mt-4 text-xs text-slate-400">
          Completa más sesiones para generar la evolución.
        </p>
      </div>
    );
  }

  const width = 850;
  const height = 300;

  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 50;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const cargas =
    puntos.map(
      (punto) =>
        punto.carga
    );

  const minimoReal =
    Math.min(
      ...cargas
    );

  const maximoReal =
    Math.max(
      ...cargas
    );

  const diferencia =
    maximoReal -
    minimoReal;

  const margen =
    Math.max(
      2.5,
      diferencia * 0.25
    );

  const minimo =
    Math.max(
      0,
      minimoReal -
        margen
    );

  const maximo =
    maximoReal +
    margen;

  const rango =
    maximo -
      minimo ||
    1;

  const coordenadas =
    puntos.map(
      (
        punto,
        index
      ) => {
        const x =
          paddingLeft +
          (index /
            (puntos.length -
              1)) *
            chartWidth;

        const y =
          paddingTop +
          (1 -
            (punto.carga -
              minimo) /
              rango) *
            chartHeight;

        return {
          ...punto,
          x,
          y,
        };
      }
    );

  const path =
    coordenadas
      .map(
        (
          punto,
          index
        ) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${punto.x} ${punto.y}`
      )
      .join(" ");

  const areaPath = `
    ${path}
    L ${
      coordenadas[
        coordenadas.length -
          1
      ].x
    } ${
      paddingTop +
      chartHeight
    }
    L ${
      coordenadas[0].x
    } ${
      paddingTop +
      chartHeight
    }
    Z
  `;

  const lineas =
    Array.from(
      {
        length: 5,
      },
      (
        _,
        index
      ) => {
        const porcentaje =
          index / 4;

        const y =
          paddingTop +
          porcentaje *
            chartHeight;

        const valor =
          maximo -
          porcentaje *
            rango;

        return {
          y,

          valor:
            Number(
              valor.toFixed(
                1
              )
            ),
        };
      }
    );

  /*
   * Si hay muchos entrenamientos,
   * no mostramos todas las fechas.
   */
  const indicesFecha =
    new Set<number>([
      0,

      Math.floor(
        (puntos.length -
          1) /
          2
      ),

      puntos.length -
        1,
    ]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Evolución de carga del ejercicio"
        className="min-w-[680px]"
      >
        <defs>
          <linearGradient
            id="strengthAreaGradient"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#059669"
              stopOpacity="0.20"
            />

            <stop
              offset="100%"
              stopColor="#059669"
              stopOpacity="0.01"
            />
          </linearGradient>
        </defs>

        {/* GRID */}

        {lineas.map(
          (
            linea,
            index
          ) => (
            <g
              key={
                index
              }
            >
              <line
                x1={
                  paddingLeft
                }
                x2={
                  width -
                  paddingRight
                }
                y1={
                  linea.y
                }
                y2={
                  linea.y
                }
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              <text
                x={
                  paddingLeft -
                  12
                }
                y={
                  linea.y +
                  4
                }
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
              >
                {
                  linea.valor
                }
              </text>
            </g>
          )
        )}

        {/* ÁREA */}

        <path
          d={areaPath}
          fill="url(#strengthAreaGradient)"
        />

        {/* LÍNEA */}

        <path
          d={path}
          fill="none"
          stroke="#059669"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* PUNTOS */}

        {coordenadas.map(
          (
            punto,
            index
          ) => (
            <g
              key={
                punto.id
              }
            >
              <circle
                cx={
                  punto.x
                }
                cy={
                  punto.y
                }
                r="5"
                fill="#ffffff"
                stroke="#059669"
                strokeWidth="3"
              />

              <text
                x={
                  punto.x
                }
                y={
                  punto.y -
                  12
                }
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#334155"
              >
                {
                  punto.carga
                }
              </text>

              {indicesFecha.has(
                index
              ) && (
                <text
                  x={
                    punto.x
                  }
                  y={
                    height -
                    15
                  }
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                >
                  {fechaCorta(
                    punto.fecha
                  )}
                </text>
              )}
            </g>
          )
        )}
      </svg>
    </div>
  );
}