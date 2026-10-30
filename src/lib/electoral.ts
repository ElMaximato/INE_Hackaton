/**
 * Utilidades compartidas de presentación electoral.
 * Antes estaban duplicadas en App, CitizenActions, drawCard e IneTools.
 */
import type { ElectionRecord, EntityRecord } from "../data/types"

/** Cuántas personas de cada 10 votaron (redondeo estándar, acotado a 0–10). */
export function perTen(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value / 10)))
}

export function recordForYear(
  records: ElectionRecord[],
  year: number,
): ElectionRecord | undefined {
  return records.find((record) => record.year === year)
}

/**
 * Lugar por participación en `year` con empates compartidos
 * (ranking "de competencia": 1 + cuántos tienen un valor estrictamente mayor).
 * Devuelve null si la entidad no tiene dato.
 */
export function competitionRank(
  entities: EntityRecord[],
  entity: EntityRecord,
  year = 2024,
): number | null {
  const value = recordForYear(entity.elections, year)?.value
  if (value === null || value === undefined) return null
  return (
    1 +
    entities.filter((other) => {
      const otherValue = recordForYear(other.elections, year)?.value
      return otherValue !== null && otherValue !== undefined && otherValue > value
    }).length
  )
}
