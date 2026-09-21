import {
  z,
} from "zod";

/*
 * ============================================================
 * VALIDADORES COMPARTIDOS DE API
 * ============================================================
 *
 * Reemplazan las múltiples copias de `convertirDecimal`,
 * `convertirFecha` y del parseo de body JSON que existían
 * en las rutas, con una única implementación consistente.
 */

/*
 * Lee el body JSON de una request de forma segura.
 * Devuelve `null` si el body no es JSON válido
 * (para que la ruta decida cómo responder).
 */
export async function leerJson(
  request: Request
): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/*
 * Convierte un valor a número decimal seguro:
 *   - acepta "" / null / undefined → null
 *   - acepta coma o punto como separador
 *   - máximo 2 decimales
 *   - no acepta negativos ni matches parciales
 */
export function convertirDecimal(
  valor: unknown
): number | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const texto = String(valor)
    .trim()
    .replace(",", ".");

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      texto
    )
  ) {
    return null;
  }

  const numero =
    Number(texto);

  return Number.isFinite(
    numero
  )
    ? numero
    : null;
}

/*
 * Convierte "YYYY-MM-DD" a Date (medianoche UTC).
 * Devuelve null si el formato o la fecha son inválidos.
 */
export function convertirFecha(
  valor: unknown
): Date | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const texto = String(valor)
    .trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      texto
    )
  ) {
    return null;
  }

  const [anio, mes, dia] =
    texto
      .split("-")
      .map(Number);

  const fecha = new Date(
    Date.UTC(
      anio,
      mes - 1,
      dia
    )
  );

  /*
   * Verificamos que la fecha sea real
   * (p. ej. rechaza 2026-02-31).
   */
  if (
    fecha.getUTCFullYear() !==
      anio ||
    fecha.getUTCMonth() !==
      mes - 1 ||
    fecha.getUTCDate() !==
      dia
  ) {
    return null;
  }

  return fecha;
}

/*
 * Política de contraseña compartida
 * (mín. 8, máx. 72, mayúscula, minúscula y número).
 */
export const passwordSchema = z
  .string()
  .min(
    8,
    "La contraseña debe tener mínimo 8 caracteres."
  )
  .max(
    72,
    "La contraseña es demasiado larga."
  )
  .regex(
    /[a-z]/,
    "Debe contener al menos una letra minúscula."
  )
  .regex(
    /[A-Z]/,
    "Debe contener al menos una letra mayúscula."
  )
  .regex(
    /\d/,
    "Debe contener al menos un número."
  );
