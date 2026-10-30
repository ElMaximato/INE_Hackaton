import { describe, expect, it } from "vitest"
import { competitionRank, perTen } from "./electoral"
import type { EntityRecord } from "../data/types"

function entity(code: string, value: number | null): EntityRecord {
  return {
    code,
    name: code,
    elections: [
      {
        year: 2024,
        kind: "presidencial",
        value,
        source: "INE",
        precision: "oficial",
        voters: 1,
        nonVoters: 1,
        averageAge: null,
        listNominal: 3,
      },
    ],
    listNominal: 3,
    votesNoEsp: 1,
    votesNoEspPct: null,
    iml: null,
    imv: null,
  }
}

describe("perTen", () => {
  it("redondea y acota entre 0 y 10", () => {
    expect(perTen(47)).toBe(5)
    expect(perTen(54.5)).toBe(5)
    expect(perTen(71.4)).toBe(7)
    expect(perTen(-3)).toBe(0)
    expect(perTen(130)).toBe(10)
  })
})

describe("competitionRank", () => {
  const all = [entity("A", 70), entity("B", 55.8), entity("C", 55.8), entity("D", 47), entity("E", null)]

  it("comparte lugar en empates", () => {
    expect(competitionRank(all, all[1]!)).toBe(2)
    expect(competitionRank(all, all[2]!)).toBe(2)
    expect(competitionRank(all, all[3]!)).toBe(4)
  })

  it("devuelve null sin dato", () => {
    expect(competitionRank(all, all[4]!)).toBeNull()
  })
})
