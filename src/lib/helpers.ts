/*
 * ============================================================
 * HELPERS COMPARTIDOS
 * ============================================================
 */

/*
 * Devuelve las iniciales de un nombre.
 *
 * Reglas:
 *   - ""                      → ""
 *   - "Juan"                  → "JU" (dos primeras letras)
 *   - "María López"           → "ML"
 *   - "Entrenador Entrena"    → "EE"
 */
export function obtenerIniciales(
  nombre: string
): string {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "";
  }

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    partes[0][0] +
    partes[
      partes.length - 1
    ][0]
  ).toUpperCase();
}
