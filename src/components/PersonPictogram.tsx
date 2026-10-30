/**
 * Pictograma de 10 figuras humanas para representar "X de cada 10 personas votaron".
 * Cada figura es un SVG simple, accesible para personas mayores.
 * Las primeras `votedCount` figuras están rellenas de color destacado;
 * las restantes están en color tenue con borde.
 */
interface PersonPictogramProps {
  /** Cantidad de personas que votaron (0 a 10) */
  votedCount: number
}

export function PersonPictogram({ votedCount }: PersonPictogramProps) {
  // Asegura rango 0 a 10
  const activeCount = Math.max(0, Math.min(10, Math.round(votedCount)))

  return (
    <div
      className="person-pictogram"
      role="img"
      aria-label={`Pictograma: ${activeCount} de cada 10 personas votaron`}
    >
      <div className="person-pictogram-grid">
        {Array.from({ length: 10 }, (_, index) => {
          const isVoted = index < activeCount
          return (
            <div
              key={index}
              className={`person-icon-wrapper ${isVoted ? "person-icon--active" : "person-icon--inactive"}`}
              title={isVoted ? "Persona que sí votó" : "Persona que no votó"}
            >
              <svg
                viewBox="0 0 24 36"
                className="person-svg"
                aria-hidden="true"
                focusable="false"
              >
                {/* Cabeza */}
                <circle cx="12" cy="7" r="5" />
                {/* Cuerpo */}
                <path d="M4 33 C4 23, 7 16, 12 16 C17 16, 20 23, 20 33 Z" />
              </svg>
            </div>
          )
        })}
      </div>
      <p className="person-pictogram-legend" aria-hidden="true">
        <span className="legend-sample legend-sample--active" /> Sí votaron ({activeCount})
        <span className="legend-spacer">·</span>
        <span className="legend-sample legend-sample--inactive" /> No votaron ({10 - activeCount})
      </p>
    </div>
  )
}

