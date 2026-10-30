/**
 * Gráfica técnica de cuartiles estatales para la página "Para el INE" (#/ine).
 * Corrección de desfase de eje: el eje 0%, 50% y 100% utiliza la misma cuadrícula
 * que las filas de datos, quedando matemáticamente alineado con las barras.
 */
import type { DashboardData } from "../data/types"

const quartileFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 })

interface QuartilesChartProps {
  quartiles: DashboardData["quartiles"]
}

export function QuartilesChart({ quartiles }: QuartilesChartProps) {
  return (
    <section className="quartile-section" aria-labelledby="ine-quartile-title">
      <div className="quartile-heading">
        <h3 id="ine-quartile-title">
          Distribución de cuartiles estatales de participación (2009–2024)
        </h3>
        <p className="support-text">
          Línea delgada: rango completo (mínimo a máximo). Caja central: rango intercuartil (Q1 a Q3, el 50 % central de las entidades). Línea vertical negra: mediana nacional.
        </p>
      </div>

      <div className="quartile-chart" role="list" aria-label="Rango de cuartiles estatales por elección">
        {quartiles.map((record) => (
          <div className={`quartile-row ${record.kind}`} key={record.year} role="listitem">
            <strong>{record.year}</strong>
            <span className="quartile-kind">
              {record.kind === "presidencial" ? "Presidencial" : "Intermedia"}
            </span>
            <div
              className="quartile-track"
              role="img"
              aria-label={`${record.year}: mínimo ${record.minimum} %, primer cuartil ${record.q1} %, mediana ${record.median} %, tercer cuartil ${record.q3} %, máximo ${record.maximum} %`}
            >
              <span
                className="quartile-whisker"
                style={{
                  left: `${record.minimum}%`,
                  width: `${record.maximum - record.minimum}%`,
                }}
              />
              <span
                className="quartile-box"
                style={{
                  left: `${record.q1}%`,
                  width: `${record.q3 - record.q1}%`,
                }}
              />
              <span className="quartile-median" style={{ left: `${record.median}%` }} />
            </div>
            <span className="quartile-values">
              {[record.minimum, record.q1, record.median, record.q3, record.maximum]
                .map((value) => quartileFormatter.format(value))
                .join(" · ")}{" "}
              %
            </span>
          </div>
        ))}
      </div>

      {/* Eje matemáticamente alineado con la pista de la gráfica */}
      <div className="quartile-axis-aligned" aria-hidden="true">
        <div className="quartile-axis-spacer" />
        <div className="quartile-axis-track">
          <span>0 %</span>
          <span>50 %</span>
          <span>100 %</span>
        </div>
        <div className="quartile-axis-tail" />
      </div>
    </section>
  )
}

