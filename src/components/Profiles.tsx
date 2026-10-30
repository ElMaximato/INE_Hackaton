/**
 * Sección de perfiles y composición demográfica para el bloque plegado "Más información".
 * - Texto de apoyo visible (sin hover ni botones flotantes).
 * - Aclaración clara de que es composición y no tasa de participación.
 * - Una sola nota unificada de datos pendientes.
 */
import { useState, type KeyboardEvent } from "react"
import { elections } from "../data/elections"
import { Pending } from "./DataStatus"
import type { ElectionRecord, ProfileRecord } from "../data/types"

const profileTabs = [
  {
    id: "etapa_vida",
    label: "Etapa de vida (edad)",
    explanation:
      "Qué parte del total de votantes eran jóvenes, personas adultas o adultas mayores.",
  },
  {
    id: "tipo_seccion",
    label: "Tipo de zona (sección)",
    explanation:
      "Qué parte del total de votantes vive en zonas urbanas, rurales o mixtas.",
  },
] as const

type ProfileDimension = (typeof profileTabs)[number]["id"]

const percentFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 })

function percentage(value: number): string {
  return `${percentFormatter.format(value)} %`
}

function CompositionTable({ records }: { records: ProfileRecord[] }) {
  return (
    <div className="table-scroll">
      <table>
        <caption>
          Composición de las personas que fueron a votar. No representa la tasa de participación del grupo.
        </caption>
        <thead>
          <tr>
            <th scope="col">Año</th>
            <th scope="col">Tipo de elección</th>
            <th scope="col">Grupo</th>
            <th scope="col">% del total de votantes</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={`${record.year}-${record.group}`}>
              <td>{record.year}</td>
              <td>{record.kind === "presidencial" ? "Presidencial" : "Intermedia"}</td>
              <th scope="row">{record.group}</th>
              <td>{percentage(record.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompositionChart({
  records,
  dimension,
}: {
  records: ProfileRecord[]
  dimension: ProfileDimension
}) {
  const groups = [...new Set(records.map(({ group }) => group))]
  return (
    <div className="composition-chart" aria-label="Composición de votantes por elección">
      {elections.map(({ year, kind }) => {
        const electionRecords = records.filter((record) => record.year === year)
        const total = electionRecords.reduce((sum, record) => sum + record.value, 0)
        return (
          <div className="composition-row" key={year}>
            <strong>{year}</strong>
            <span className="composition-kind">
              {kind === "presidencial" ? "Presidencial" : "Intermedia"}
            </span>
            <div
              className={`composition-stack ${dimension}`}
              role="img"
              aria-label={`${year}, ${kind === "presidencial" ? "presidencial" : "intermedia"}: ${electionRecords.map(({ group, value }) => `${group} ${percentage(value)}`).join(", ") || "Dato pendiente"}`}
            >
              {electionRecords.map((record) => (
                <span
                  className={`composition-segment color-${groups.indexOf(record.group) % 5}`}
                  key={record.group}
                  style={{ width: `${record.value}%` }}
                  title={`${record.group}: ${percentage(record.value)}`}
                />
              ))}
            </div>
            <span className="composition-total" title="Suma de los porcentajes oficiales">
              {electionRecords.length ? percentage(total) : "Dato pendiente"}
            </span>
          </div>
        )
      })}
      <p className="field-note">
        Los porcentajes están redondeados en la fuente, por eso la suma de una elección puede
        ser 99 %, 100 % o 101 %.
      </p>
      <ul className="composition-legend" aria-label="Grupos">
        {groups.map((group, index) => (
          <li key={group}>
            <span className={`composition-key color-${index % 5}`} aria-hidden="true" />
            {group}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AverageAgeChart({ records }: { records: ElectionRecord[] }) {
  const available = records.flatMap(({ averageAge }) => (averageAge === null ? [] : [averageAge]))
  const max = Math.max(...available, 1)
  return (
    <div className="average-age-chart" role="list" aria-label="Edad promedio de las personas votantes">
      {elections.map(({ year, kind }) => {
        const age = records.find((record) => record.year === year)?.averageAge ?? null
        return (
          <div className={`average-age-item ${kind}`} key={year} role="listitem">
            <span className="average-age-value">
              {age === null ? "Dato pendiente" : `${percentFormatter.format(age)} años`}
            </span>
            <span className="average-age-track">
              <span style={{ height: age === null ? "0%" : `${(age / max) * 100}%` }} />
            </span>
            <strong>{year}</strong>
          </div>
        )
      })}
    </div>
  )
}

export function Profiles({
  records,
  national,
}: {
  records: ProfileRecord[]
  national: ElectionRecord[]
}) {
  const [tab, setTab] = useState<ProfileDimension>("etapa_vida")
  const [showTable, setShowTable] = useState(false)
  const dimensionRecords = records.filter(({ dimension }) => dimension === tab)
  const activeTab = profileTabs.find((item) => item.id === tab)!

  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const direction = event.key === "ArrowRight" ? 1 : -1
    const next = (currentIndex + direction + profileTabs.length) % profileTabs.length
    const nextTab = profileTabs[next]!.id
    setTab(nextTab)
    setShowTable(false)
    document.getElementById(`tab-${nextTab}`)?.focus()
  }

  return (
    <div className="profiles-block" id="perfiles">
      <div className="profiles-intro">
        <h4>¿Quiénes acuden a las urnas? (Composición del electorado)</h4>
        <p className="support-text">
          <strong>Aclaración importante:</strong> Estas cifras muestran cómo se reparte el total
          de personas que acudieron a votar. No indican qué porcentaje de los jóvenes o adultos
          salió a votar, sino qué fracción de la votación total representaron.
        </p>
      </div>

      <div className="profile-card">
        <div className="tabs" role="tablist" aria-label="Composición de votantes">
          {profileTabs.map(({ id, label }, index) => (
            <button
              id={`tab-${id}`}
              key={id}
              role="tab"
              aria-selected={tab === id}
              aria-controls="profile-panel"
              tabIndex={tab === id ? 0 : -1}
              onClick={() => {
                setTab(id)
                setShowTable(false)
              }}
              onKeyDown={(event) => handleTabKey(event, index)}
            >
              {label}
            </button>
          ))}
        </div>

        <div id="profile-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          <div className="profile-chart-heading">
            <div>
              <h5>{activeTab.label}</h5>
              <p className="support-text">{activeTab.explanation}</p>
            </div>
            {dimensionRecords.length > 0 && (
              <button
                className="button button-senior button-senior-secondary"
                type="button"
                aria-controls="composition-content"
                aria-pressed={showTable}
                onClick={() => setShowTable((shown) => !shown)}
              >
                {showTable ? "Ver gráfica" : "Ver tabla de datos"}
              </button>
            )}
          </div>

          {dimensionRecords.length ? (
            <div id="composition-content">
              {showTable ? (
                <CompositionTable records={dimensionRecords} />
              ) : (
                <CompositionChart records={dimensionRecords} dimension={tab} />
              )}
            </div>
          ) : (
            <div className="profile-pending">
              <Pending />
              <p>El INE no incluye esta categoría en los datos disponibles.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edad promedio */}
      <div className="age-section">
        <h4>Edad promedio de las personas votantes</h4>
        <p className="support-text">
          Edad promedio de las personas que votaron en cada elección presidencial e intermedia, según la Plataforma CCPC.
        </p>
        <AverageAgeChart records={national} />
      </div>

      {/* Una sola nota amable unificada de datos pendientes */}
      <aside className="pending-unified-note" aria-label="Información sobre datos pendientes">
        <span className="pending-icon" aria-hidden="true">ℹ️</span>
        <div>
          <h5>Sobre los datos pendientes</h5>
          <p>
            La fuente consultada (Plataforma CCPC) no incluye la tasa de participación
            desagregada por edad, por sexo o por tipo de sección, ni la participación estatal antes
            de 2024. Si se publican, podrán incorporarse al sistema.
          </p>
        </div>
      </aside>
    </div>
  )
}
