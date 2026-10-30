import { describe, expect, it } from "vitest"
import { computeStateRange } from "./stateRange"
import type { EntityRecord } from "../data/types"

function createMockEntity(code: string, name: string, value2024: number | null): EntityRecord {
  return {
    code,
    name,
    elections: [
      {
        year: 2024,
        kind: "presidencial",
        value: value2024,
        source: "INE",
        precision: "oficial",
        voters: 1000,
        nonVoters: 500,
        averageAge: 40,
        listNominal: 1500,
      },
    ],
    listNominal: 1500,
    votesNoEsp: null,
    votesNoEspPct: null,
    iml: null,
    imv: null,
  }
}

describe("computeStateRange", () => {
  const minEntity = createMockEntity("CHIH", "Chihuahua", 47.0)
  const otherEntity = createMockEntity("PUE", "Puebla", 55.0)
  const midEntity = createMockEntity("CDMX", "Ciudad de México", 59.7)
  const maxEntity = createMockEntity("YUC", "Yucatán", 71.4)
  const pendingEntity = createMockEntity("PEND", "Sin Dato", null)

  const entities = [minEntity, otherEntity, midEntity, maxEntity, pendingEntity]
  const nationalValue = 59.7

  it("calcula correctamente la posición y frase cuando el estado es el mínimo", () => {
    const result = computeStateRange(entities, minEntity, nationalValue)

    expect(result.hasData).toBe(true)
    expect(result.isMinimum).toBe(true)
    expect(result.isMaximum).toBe(false)
    expect(result.selectedPositionPercent).toBe(0)
    expect(result.summaryPhrase).toBe("Es el estado con menos participación.")
    expect(result.ariaLabel).toContain("El estado con menos fue Chihuahua")
    expect(result.ariaLabel).toContain("Tu estado, Chihuahua, tuvo 47 %")
  })

  it("calcula correctamente la posición y frase cuando el estado es el máximo", () => {
    const result = computeStateRange(entities, maxEntity, nationalValue)

    expect(result.hasData).toBe(true)
    expect(result.isMinimum).toBe(false)
    expect(result.isMaximum).toBe(true)
    expect(result.selectedPositionPercent).toBe(100)
    expect(result.summaryPhrase).toBe("Es el estado con más participación.")
    expect(result.ariaLabel).toContain("el que más fue Yucatán")
    expect(result.ariaLabel).toContain("Tu estado, Yucatán, tuvo 71.4 %")
  })

  it("genera frase dinámica 'Solo N estado(s) votó/votaron menos que el tuyo' cuando está en la mitad baja", () => {
    // En este mock: minEntity (47.0) < otherEntity (55.0) < midEntity (59.7) < maxEntity (71.4)
    // Para otherEntity (55.0): lowerCount = 1 (Chihuahua), higherCount = 2 (CDMX, Yucatán)
    const result = computeStateRange(entities, otherEntity, nationalValue)

    expect(result.hasData).toBe(true)
    expect(result.lowerCount).toBe(1)
    expect(result.higherCount).toBe(2)
    expect(result.summaryPhrase).toBe("Solo 1 estado votó menos que el tuyo.")
  })

  it("genera frase dinámica 'N estados votaron más que el tuyo' cuando está en la mitad alta", () => {
    // Para midEntity (59.7): lowerCount = 2 (Chihuahua, Puebla), higherCount = 1 (Yucatán)
    const result = computeStateRange(entities, midEntity, nationalValue)

    expect(result.hasData).toBe(true)
    expect(result.lowerCount).toBe(2)
    expect(result.higherCount).toBe(1)
    expect(result.summaryPhrase).toBe("Solo 1 estado votó más que el tuyo.")
  })

  it("calcula correctamente la posición proporcional del estado y del promedio nacional", () => {
    const result = computeStateRange(entities, midEntity, nationalValue)

    expect(result.hasData).toBe(true)
    expect(result.selectedPositionPercent).toBeCloseTo(result.nationalPositionPercent!, 4)
  })

  it("maneja amablemente el caso cuando el estado seleccionado no tiene dato (null)", () => {
    const result = computeStateRange(entities, pendingEntity, nationalValue)

    expect(result.hasData).toBe(false)
    expect(result.selectedValue).toBeNull()
    expect(result.selectedPositionPercent).toBeNull()
    expect(result.summaryPhrase).toBe("Dato pendiente para este estado.")
  })
})
