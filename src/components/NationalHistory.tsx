/**
 * Bloque 4: "¿Cómo ha votado el país?"
 * Una sola gráfica de barras anchas con la cifra sobre cada barra.
 * Presidenciales vs. intermedias distinguidas por color Y por etiqueta de texto.
 * Frase de resumen simple generada desde los datos reales.
 */
import { formatPercent } from "./DataStatus"
import type { DashboardData } from "../data/types"

export function NationalHistory({ data }: { data: DashboardData }) {
  // Encontrar la elección presidencial más alta y la intermedia más baja
  const presidential = data.national
    .filter((record) => record.kind === "presidencial" && record.value !== null)
    .sort((left, right) => (right.value ?? 0) - (left.value ?? 0))[0]

  const intermediate = data.national
    .filter((record) => record.kind === "intermedia" && record.value !== null)
    .sort((left, right) => (left.value ?? 0) - (right.value ?? 0))[0]

  const insight =
    presidential && intermediate
      ? `En los últimos 15 años, la mayor participación fue de ${formatPercent(presidential.value)} en ${presidential.year} (elección presidencial), y la menor fue de ${formatPercent(intermediate.value)} en ${intermediate.year} (elección intermedia).`
      : "Cifras oficiales de participación nacional registradas por el INE."

  // Elecciones intermedias: de la primera a la última, y rango de las presidenciales
  const intermediateSeries = data.national
    .filter((record) => record.kind === "intermedia" && record.value !== null)
    .sort((a, b) => a.year - b.year)
  const presidentialValues = data.national
    .filter((record) => record.kind === "presidencial" && record.value !== null)
    .map((record) => record.value as number)
  const firstIntermediate = intermediateSeries[0]
  const lastIntermediate = intermediateSeries[intermediateSeries.length - 1]
  const intermediateInsight =
    firstIntermediate && lastIntermediate && presidentialValues.length
      ? `También se vota en las elecciones intermedias, donde se eligen diputaciones federales. En ellas la participación pasó de ${formatPercent(firstIntermediate.value)} en ${firstIntermediate.year} a ${formatPercent(lastIntermediate.value)} en ${lastIntermediate.year}; en las presidenciales ha estado entre ${formatPercent(Math.min(...presidentialValues))} y ${formatPercent(Math.max(...presidentialValues))}.`
      : null

  // Ordenar cronológicamente (2009 a 2024)
  const sortedElections = [...data.national].sort((a, b) => a.year - b.year)

  return (
    <section className="section section-country" id="pais" aria-labelledby="country-title">
      <div className="container">
        <div className="country-intro">
          <p className="eyebrow">Historia electoral de México</p>
          <h2 id="country-title">¿Cómo ha votado el país en 15 años?</h2>
          <p className="country-lead">
            En México se celebran dos tipos de elecciones federales: las <strong>presidenciales</strong> (cada 6 años, cuando elegimos Presidente) y las <strong>elecciones intermedias</strong> (a la mitad del sexenio, cuando se eligen únicamente diputaciones federales).
          </p>
        </div>

        {/* Gráfica única de barras anchas con valores sobre las barras */}
        <div className="single-bar-chart-card">
          <h3 className="chart-card-title">Participación ciudadana en cada elección (2009–2024)</h3>
          <p className="chart-card-subtitle">
            El porcentaje oficial se muestra arriba de cada barra. La altura refleja cuántas personas votaron de cada 100 contabilizadas (quienes sí votaron más quienes no votaron).
          </p>

          <div
            className="unified-bar-chart"
            role="img"
            aria-label="Gráfica de participación nacional de 2009 a 2024"
          >
            {sortedElections.map((record) => {
              const isPres = record.kind === "presidencial"
              const pct = record.value ?? 0
              return (
                <div
                  key={record.year}
                  className={`bar-column ${isPres ? "bar-column--presidential" : "bar-column--intermediate"}`}
                >
                  {/* Cifra grande visible directamente arriba de la barra */}
                  <span className="bar-top-value">
                    {record.value !== null ? formatPercent(record.value) : "Pendiente"}
                  </span>

                  {/* Barra física */}
                  <div className="bar-column-track">
                    <div
                      className="bar-column-fill"
                      style={{ height: `${pct}%` }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Año en negrita grande */}
                  <strong className="bar-column-year">{record.year}</strong>

                  {/* Etiqueta visible: distingue por texto además de color */}
                  <span className="bar-column-kind">
                    {isPres ? "Presidencial" : "Intermedia"}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Leyenda visible con explicación de una línea */}
          <div className="chart-legend-box" aria-hidden="true">
            <div className="legend-item">
              <span className="legend-swatch legend-swatch--presidential" />
              <span>
                <strong>Elección presidencial:</strong> Se elige a la Presidenta o Presidente de la República.
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-swatch legend-swatch--intermediate" />
              <span>
                <strong>Elección intermedia:</strong> Se eligen únicamente diputaciones federales al Congreso.
              </span>
            </div>
          </div>
        </div>

        {/* Resumen simple en una frase */}
        <div className="country-insight-banner">
          <span className="insight-icon" aria-hidden="true">💡</span>
          <p className="insight-text">{insight}</p>
        </div>
        {intermediateInsight && (
          <div className="country-insight-banner">
            <span className="insight-icon" aria-hidden="true">🗳️</span>
            <p className="insight-text">{intermediateInsight}</p>
          </div>
        )}
      </div>
    </section>
  )
}
