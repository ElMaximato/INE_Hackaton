/**
 * Lógica pura para la barra horizontal de rango de participación 2024.
 * Calcula la escala proporcional entre el estado mínimo y el máximo,
 * las posiciones relativas de "Tu estado" y "Promedio del país",
 * y las frases dinámicas basadas en los datos reales.
 */
import type { EntityRecord } from "../data/types"
import { formatPercent } from "../components/DataStatus"

export type StateRangeResult = {
  hasData: boolean
  minEntity: { name: string; code: string; value: number } | null
  maxEntity: { name: string; code: string; value: number } | null
  selectedValue: number | null
  nationalValue: number | null
  selectedPositionPercent: number | null
  nationalPositionPercent: number | null
  isMinimum: boolean
  isMaximum: boolean
  lowerCount: number
  higherCount: number
  summaryPhrase: string
  ariaLabel: string
}

export function computeStateRange(
  entities: EntityRecord[],
  selectedEntity: EntityRecord | null,
  nationalValue: number | null,
): StateRangeResult {
  // Extraer valores de participación 2024 válidos
  const validEntities = entities
    .map((e) => {
      const rec = e.elections.find((el) => el.year === 2024)
      return {
        name: e.name,
        code: e.code,
        value: rec?.value ?? null,
      }
    })
    .filter((e): e is { name: string; code: string; value: number } => e.value !== null)

  if (validEntities.length === 0 || !selectedEntity) {
    return {
      hasData: false,
      minEntity: null,
      maxEntity: null,
      selectedValue: null,
      nationalValue,
      selectedPositionPercent: null,
      nationalPositionPercent: null,
      isMinimum: false,
      isMaximum: false,
      lowerCount: 0,
      higherCount: 0,
      summaryPhrase: "Dato pendiente para este estado.",
      ariaLabel: "Datos de participación 2024 pendientes.",
    }
  }

  // Ordenar de menor a mayor
  const sorted = [...validEntities].sort((a, b) => a.value - b.value)
  const minEntity = sorted[0]!
  const maxEntity = sorted[sorted.length - 1]!

  const selectedRec = selectedEntity.elections.find((el) => el.year === 2024)
  const selectedValue = selectedRec?.value ?? null

  if (selectedValue === null) {
    return {
      hasData: false,
      minEntity,
      maxEntity,
      selectedValue: null,
      nationalValue,
      selectedPositionPercent: null,
      nationalPositionPercent: null,
      isMinimum: false,
      isMaximum: false,
      lowerCount: 0,
      higherCount: 0,
      summaryPhrase: "Dato pendiente para este estado.",
      ariaLabel: `Participación 2024. El estado con menos fue ${minEntity.name} con ${formatPercent(minEntity.value)}, el que más fue ${maxEntity.name} con ${formatPercent(maxEntity.value)}. Tu estado, ${selectedEntity.name}, tiene dato pendiente. El promedio del país fue ${formatPercent(nationalValue)}.`,
    }
  }

  const rangeSpan = maxEntity.value - minEntity.value || 1
  const rawSelectedPos = ((selectedValue - minEntity.value) / rangeSpan) * 100
  const selectedPositionPercent = Math.max(0, Math.min(100, rawSelectedPos))

  const nationalPositionPercent =
    nationalValue !== null
      ? Math.max(0, Math.min(100, ((nationalValue - minEntity.value) / rangeSpan) * 100))
      : null

  const isMinimum = selectedValue <= minEntity.value
  const isMaximum = selectedValue >= maxEntity.value

  const lowerCount = validEntities.filter((e) => e.value < selectedValue).length
  const higherCount = validEntities.filter((e) => e.value > selectedValue).length

  let summaryPhrase = ""
  if (isMinimum) {
    summaryPhrase = "Es el estado con menos participación."
  } else if (isMaximum) {
    summaryPhrase = "Es el estado con más participación."
  } else if (lowerCount <= higherCount) {
    summaryPhrase =
      lowerCount === 1
        ? "Solo 1 estado votó menos que el tuyo."
        : `Solo ${lowerCount} estados votaron menos que el tuyo.`
  } else {
    summaryPhrase =
      higherCount === 1
        ? "Solo 1 estado votó más que el tuyo."
        : `Solo ${higherCount} estados votaron más que el tuyo.`
  }

  const ariaLabel = `Participación 2024. El estado con menos fue ${minEntity.name} con ${formatPercent(minEntity.value)}, el que más fue ${maxEntity.name} con ${formatPercent(maxEntity.value)}. Tu estado, ${selectedEntity.name}, tuvo ${formatPercent(selectedValue)}. El promedio del país fue ${formatPercent(nationalValue)}.`

  return {
    hasData: true,
    minEntity,
    maxEntity,
    selectedValue,
    nationalValue,
    selectedPositionPercent,
    nationalPositionPercent,
    isMinimum,
    isMaximum,
    lowerCount,
    higherCount,
    summaryPhrase,
    ariaLabel,
  }
}
