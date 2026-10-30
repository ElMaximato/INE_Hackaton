/**
 * Tabla simple de 6 filas que muestra el porcentaje más bajo y el más alto
 * registrado entre los estados en cada elección (2009 a 2024).
 * No incluye cuartiles ni medianas para mantener la máxima claridad.
 */
import type { DashboardData } from "../data/types"

const oneDecimal = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function formatPct(val: number): string {
  return `${oneDecimal.format(val)} %`
}

interface MinMaxTableProps {
  quartiles: DashboardData["quartiles"]
}

export function MinMaxTable({ quartiles }: MinMaxTableProps) {
  // Ordenar cronológicamente (2009 a 2024)
  const sorted = [...quartiles].sort((a, b) => a.year - b.year)

  return (
    <div className="minmax-table-wrapper">
      <h4>Rango entre estados en las elecciones de 2009 a 2024</h4>
      <p className="support-text">
        Muestra la menor y la mayor participación registrada entre las 32 entidades en cada elección federal.
      </p>

      <div className="table-scroll">
        <table className="minmax-table">
          <caption className="sr-only">
            Participación mínima y máxima entre estados de 2009 a 2024
          </caption>
          <thead>
            <tr>
              <th scope="col">Año</th>
              <th scope="col">Tipo de elección</th>
              <th scope="col">Participación más baja</th>
              <th scope="col">Participación más alta</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((q) => (
              <tr key={q.year}>
                <td>
                  <strong>{q.year}</strong>
                </td>
                <td>{q.kind === "presidencial" ? "Presidencial" : "Intermedia"}</td>
                <td>
                  <span className="minmax-chip minmax-chip--min">{formatPct(q.minimum)}</span>
                </td>
                <td>
                  <span className="minmax-chip minmax-chip--max">{formatPct(q.maximum)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="field-note">
        Fuente: Plataforma CCPC 2009–2024, INE. En las fuentes oficiales para elecciones anteriores a 2024 no se especifica el nombre de los estados en este resumen, solo los valores numéricos.
      </p>
    </div>
  )
}

