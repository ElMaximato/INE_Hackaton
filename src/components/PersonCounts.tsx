/**
 * Propósito del sitio hecho visible: "Cada elección la deciden quienes llegan a votar".
 * Muestra, con los conteos oficiales de 2024, cuántas personas votaron y cuántas no en el estado.
 * Solo describe: no explica causas ni califica.
 */
import { Pending, formatPercent } from "./DataStatus"

const countFormatter = new Intl.NumberFormat("es-MX")

interface PersonCountsProps {
  stateName: string
  voters: number | null
  nonVoters: number | null
  topState: { name: string; value: number } | null
}

export function PersonCounts({ stateName, voters, nonVoters, topState }: PersonCountsProps) {
  if (voters === null || nonVoters === null) {
    return (
      <section className="person-counts" aria-labelledby="counts-title">
        <h3 id="counts-title" className="counts-title">
          Cada elección la deciden quienes llegan a votar
        </h3>
        <Pending />
      </section>
    )
  }

  const total = voters + nonVoters
  const votedShare = total > 0 ? (voters / total) * 100 : 0

  return (
    <section className="person-counts" aria-labelledby="counts-title">
      <h3 id="counts-title" className="counts-title">
        Cada elección la deciden quienes llegan a votar
      </h3>
      <p className="counts-lead">Así se repartió en {stateName} en 2024:</p>

      <dl className="counts-pair">
        <div className="counts-card counts-card--voted">
          <dt>Sí votaron</dt>
          <dd>
            <strong>{countFormatter.format(voters)}</strong> personas
          </dd>
        </div>
        <div className="counts-card counts-card--not">
          <dt>No votaron</dt>
          <dd>
            <strong>{countFormatter.format(nonVoters)}</strong> personas
          </dd>
        </div>
      </dl>

      <div className="counts-bar" aria-hidden="true">
        <span className="counts-bar-fill" style={{ width: `${votedShare}%` }} />
      </div>

      {topState && topState.name !== stateName && (
        <p className="counts-reference">
          Para comparar: el estado con mayor participación fue <strong>{topState.name}</strong>,
          con <strong>{formatPercent(topState.value)}</strong>.
        </p>
      )}
    </section>
  )
}
