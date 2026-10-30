/**
 * Encabezado y pie de página simplificados y accesibles para personas mayores.
 * - Header: solo "Inicio", "Mi estado", "Más información", y el control "Letra grande / Letra normal".
 * - Footer: fuentes, metodología y enlace discreto "Para el personal del INE".
 */

export function Header({
  activeSection,
  largeFont,
  onToggleFont,
}: {
  activeSection: string
  largeFont: boolean
  onToggleFont: () => void
}) {
  const links = [
    ["inicio", "Inicio"],
    ["estado", "Mi estado"],
    ["pais", "¿Cómo votó el país?"],
    ["detalles", "Más información"],
  ]

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="navbar">
        <div className="nav-inner">
          <a className="brand" href="#inicio" aria-label="15 años de tu voto, volver al inicio">
            <span className="brand-mark" aria-hidden="true">15</span>
            <span>15 años<br />de tu voto</span>
          </a>

          <nav aria-label="Navegación principal" className="nav-links">
            {links.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className={activeSection === id ? "active" : ""}
                aria-current={activeSection === id ? "location" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Control visible para personas mayores: cambiar tamaño de letra */}
          <button
            type="button"
            className="font-size-toggle"
            onClick={onToggleFont}
            aria-pressed={largeFont}
            aria-label={largeFont ? "Letra normal" : "Letra más grande"}
          >
            <span aria-hidden="true" className="font-size-icon">A+</span>
            <span className="font-size-text">
              {largeFont ? "Letra normal" : "Letra más grande"}
            </span>
          </button>
        </div>
      </header>
    </>
  )
}

export function Footer() {
  const glossaryTerms = [
    {
      term: "¿Qué es la participación electoral?",
      def: "De cada 100 personas contabilizadas (quienes sí votaron más quienes no votaron), cuántas acudieron a las urnas. No se calcula sobre la lista nominal.",
    },
    {
      term: "¿Qué es una elección presidencial?",
      def: "Cuando la ciudadanía elige a la Presidenta o Presidente de la República. Ocurrió en 2012, 2018 y 2024.",
    },
    {
      term: "¿Qué es una elección intermedia?",
      def: "Cuando se eligen únicamente diputaciones federales, sin votar por la Presidencia. Ocurrió en 2009, 2015 y 2021.",
    },
    {
      term: "¿Qué significa 'Dato pendiente'?",
      def: "Significa que la fuente oficial del INE no ha publicado ese desglose en los tableros consultados. En este sitio no se inventan ni calculan cifras no oficiales.",
    },
  ]

  return (
    <footer className="footer" id="fuentes">
      <div className="container footer-grid">
        <div>
          <a className="brand footer-brand" href="#inicio">
            <span className="brand-mark">15</span>
            <span>15 años<br />de tu voto</span>
          </a>
          <p className="footer-tagline">Datos oficiales del INE explicados de forma clara y accesible para toda la ciudadanía.</p>
        </div>

        <div>
          <h2>Fuentes y metodología oficial</h2>
          <p>
            <strong>Fuente oficial:</strong> Plataforma CCPC 2009–2024, Instituto Nacional Electoral (INE).
          </p>
          <p>
            <strong>Fórmula oficial de participación:</strong> Personas que sí votaron ÷ (Personas que sí votaron + Personas que no votaron) × 100.
            La lista nominal no se usa como divisor en esta fórmula oficial.
          </p>
          <p>
            Participación por estado solo disponible para 2024 en esta versión.
            Los porcentajes se presentan tal como los publicó el INE.
          </p>

          <h3>Preguntas frecuentes</h3>
          <dl className="footer-glossary">
            {glossaryTerms.map(({ term, def }) => (
              <div key={term} className="glossary-item">
                <dt>{term}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Enlace discreto para el personal del INE al pie de página */}
        <div className="footer-bottom-row">
          <p className="copyright">© 2026 · 15 años de tu voto · Datos del INE</p>
          <a href="#/ine" className="ine-discreet-link">
            Herramientas para personal del INE y Juntas Locales →
          </a>
        </div>
      </div>
    </footer>
  )
}
