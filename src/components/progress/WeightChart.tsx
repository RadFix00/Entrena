type PuntoPeso = {
  id: string;
  fecha: string;
  peso: number;
};

type Props = {
  puntos: PuntoPeso[];
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

export default function WeightChart({
  puntos,
}: Props) {
  if (
    puntos.length === 0
  ) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-400">
          Todavía no hay registros de peso.
        </p>
      </div>
    );
  }

  /*
   * Si solo tenemos un registro,
   * mostramos una tarjeta sencilla.
   */
  if (
    puntos.length === 1
  ) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-slate-50">
        <p className="text-4xl font-bold text-slate-900">
          {puntos[0].peso} kg
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {fechaCorta(
            puntos[0].fecha
          )}
        </p>

        <p className="mt-4 text-xs text-slate-400">
          Registra más mediciones para ver la evolución.
        </p>
      </div>
    );
  }

  /*
   * ============================================
   * CONFIGURACIÓN SVG
   * ============================================
   */

  const width = 800;
  const height = 280;

  const paddingLeft =
    55;

  const paddingRight =
    25;

  const paddingTop =
    25;

  const paddingBottom =
    45;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const pesos =
    puntos.map(
      (punto) =>
        punto.peso
    );

  const minimoReal =
    Math.min(
      ...pesos
    );

  const maximoReal =
    Math.max(
      ...pesos
    );

  /*
   * Añadimos margen visual.
   */
  const margen =
    Math.max(
      1,
      (
        maximoReal -
        minimoReal
      ) *
        0.25
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
    maximo - minimo || 1;

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
            (punto.peso -
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

  /*
   * Línea inferior para crear
   * el área sombreada.
   */
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

  /*
   * Cinco líneas horizontales.
   */
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
   * No ponemos todas las fechas
   * si hay demasiados puntos.
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
        aria-label="Gráfica de evolución del peso"
        className="min-w-[650px] overflow-visible"
      >
        <defs>
          <linearGradient
            id="weightArea"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#10b981"
              stopOpacity="0.22"
            />

            <stop
              offset="100%"
              stopColor="#10b981"
              stopOpacity="0.02"
            />
          </linearGradient>
        </defs>

        {/* GRID */}

        {lineas.map(
          (linea) => (
            <g
              key={
                linea.y
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
                  10
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
          fill="url(#weightArea)"
        />

        {/* LÍNEA */}

        <path
          d={path}
          fill="none"
          stroke="#10b981"
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
                stroke="#10b981"
                strokeWidth="3"
              />

              <text
                x={
                  punto.x
                }
                y={
                  punto.y -
                  11
                }
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#334155"
              >
                {
                  punto.peso
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
                    12
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