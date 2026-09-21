/*
 * ============================================================
 * FORMATEO DE FECHAS
 * ============================================================
 *
 * Utilidades compartidas para formatear fechas.
 *
 * IMPORTANTE: usamos siempre la zona horaria de Colombia
 * (America/Bogota) para que los inputs de fecha <input
 * type="date"> muestren el día correcto. Antes se usaba
 * `toISOString().slice(0, 10)`, que convierte a UTC y
 * desplazaba un día las fechas locales.
 */

const TIMEZONE_BOGOTA =
  "America/Bogota";

export function fechaParaInput(
  fecha:
    | Date
    | null
    | undefined
): string {
  if (!fecha) {
    return "";
  }

  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          TIMEZONE_BOGOTA,

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

  const valor = (
    tipo: string
  ) =>
    partes.find(
      (parte) =>
        parte.type ===
        tipo
    )?.value ?? "";

  return `${valor(
    "year"
  )}-${valor(
    "month"
  )}-${valor(
    "day"
  )}`;
}

/*
 * Fecha legible en español de Colombia
 * (ej. "15 ene 2026").
 */
export function formatearFecha(
  fecha:
    | Date
    | null
    | undefined,
  fallback = "Sin registros"
): string {
  if (!fecha) {
    return fallback;
  }

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(fecha);
}
