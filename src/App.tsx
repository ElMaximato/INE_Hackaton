import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react"
import * as d3 from "d3"
import { feature } from "topojson-client"
import type { Topology } from "topojson-specification"
import { dashboardSchema } from "./data/schemas"
import { getMapBucket, createMapRanges } from "./data/map-scale"
import { Pending, formatPercent } from "./components/DataStatus"
import { NationalHistory } from "./components/NationalHistory"
import { Profiles } from "./components/Profiles"
import { PersonPictogram } from "./components/PersonPictogram"
import { PersonCounts } from "./components/PersonCounts"
import { StateRangeBar } from "./components/StateRangeBar"
import { CitizenActions } from "./components/CitizenActions"
import { MinMaxTable } from "./components/MinMaxTable"
import { InePage } from "./components/InePage"
import { Footer, Header } from "./components/SiteChrome"
import { downloadCard } from "./lib/drawCard"
import { competitionRank, perTen, recordForYear } from "./lib/electoral"
import type { DashboardData, EntityRecord } from "./data/types"

const oneDecimalFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const countFormatter = new Intl.NumberFormat("es-MX")

function getEntityName(featureProperties: Record<string, unknown> | null): string {
  const candidates = [
    featureProperties?.nombre,
    featureProperties?.NOMGEO,
    featureProperties?.NOMGEO_1,
    featureProperties?.name,
    featureProperties?.NAME_1,
    featureProperties?.entidad,
  ]
  return String(candidates.find((candidate) => typeof candidate === "string") ?? "")
}

function getEntityCode(featureProperties: Record<string, unknown> | null): string {
  return typeof featureProperties?.clave === "string" ? featureProperties.clave : ""
}

/** Ruta a un recurso local respetando `base` de Vite (despliegue en subcarpeta). */
function dataUrl(file: string): string {
  return `${import.meta.env.BASE_URL}data/${file}`
}

/** El TopoJSON se descarga una sola vez por sesión, no en cada cambio de estado. */
let topologyPromise: Promise<Topology> | null = null
function loadTopology(): Promise<Topology> {
  if (!topologyPromise) {
    topologyPromise = fetch(dataUrl("mexico.topo.json"))
      .then(async (response) => {
        if (!response.ok) throw new Error(`No se pudo cargar el mapa local (${response.status}).`)
        return (await response.json()) as Topology
      })
      .catch((error: unknown) => {
        topologyPromise = null
        throw error
      })
  }
  return topologyPromise
}

async function loadDashboard(): Promise<DashboardData> {
  const response = await fetch(dataUrl("dashboard.json"), { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`No se pudo cargar el archivo local de datos (${response.status}).`)
  }
  const parsed: unknown = await response.json()
  return dashboardSchema.parse(parsed)
}

class ErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error de interfaz:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-error" role="alert">
          <p className="eyebrow">Aviso</p>
          <h1>No pudimos mostrar esta sección.</h1>
          <p>{this.state.error.message}</p>
          <button className="button button-senior button-senior-primary" onClick={this.props.onRetry}>
            Volver a intentar
          </button>
        </main>
      )
    }
    return this.props.children
  }
}

function Skeleton() {
  return (
    <div className="loading-shell" role="status" aria-label="Cargando información">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-copy" />
      <div className="skeleton skeleton-card" />
    </div>
  )
}

function MapLegend({ records, year }: { records: EntityRecord[]; year: number }) {
  const ranges = useMemo(
    () =>
      createMapRanges(
        records.flatMap(({ elections: entityElections }) => {
          const value = recordForYear(entityElections, year)?.value
          return value === null || value === undefined ? [] : [value]
        }),
      ),
    [records, year],
  )
  const rangeLabel = (index: number) => {
    const range = ranges[index]
    return range
      ? `${oneDecimalFormatter.format(range.min)} a ${oneDecimalFormatter.format(range.max)} %`
      : "Rango pendiente"
  }
  return (
    <div className="map-legend" aria-label="Nivel de participación en el mapa">
      {Array.from({ length: 4 }, (_, index) => (
        <span key={index}>
          <i className={`map-swatch swatch-${index}`} aria-hidden="true" />
          {rangeLabel(index)}
        </span>
      ))}
      <span>
        <i className="map-swatch swatch-pending" aria-hidden="true" />
        Dato pendiente
      </span>
    </div>
  )
}

function MexicoMap({
  data,
  selected,
  year,
  onSelect,
}: {
  data: DashboardData
  selected: EntityRecord
  year: number
  onSelect: (entity: EntityRecord) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(data.map.topologyAvailable)

  useEffect(() => {
    if (!data.map.topologyAvailable || !data.map.objectName || !svgRef.current) return
    let active = true
    setMapLoading(true)
    void loadTopology()
      .then((topology) => {
        if (!active || !svgRef.current || !data.map.objectName) return
        const geometry = topology.objects[data.map.objectName]
        if (!geometry) throw new Error("No se encontró el mapa de México en los archivos locales.")
        const collection = feature(topology, geometry)
        const features =
          collection.type === "FeatureCollection" ? collection.features : [collection]
        const projection = d3.geoMercator().fitSize([700, 460], collection)
        const path = d3.geoPath(projection)
        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()
        const values = data.entities.flatMap(({ elections: records }) => {
          const value = recordForYear(records, year)?.value
          return value === null || value === undefined ? [] : [value]
        })
        const ranges = createMapRanges(values)
        const styles = getComputedStyle(document.documentElement)
        const fills = [0, 1, 2, 3].map((index) =>
          styles.getPropertyValue(`--map-${index}`).trim(),
        )
        const group = svg.append("g").attr("transform", "translate(0 0)")
        const paths = group
          .selectAll<SVGPathElement, (typeof features)[number]>("path")
          .data(features)
          .join("path")
          .attr("d", (item) => path(item) ?? "")
          .attr("data-entity-code", (item) =>
            getEntityCode(item.properties as Record<string, unknown> | null),
          )
          .attr("fill", (item) => {
            const code = getEntityCode(item.properties as Record<string, unknown> | null)
            const entity = data.entities.find(({ code: entityCode }) => entityCode === code)
            const value = entity ? recordForYear(entity.elections, year)?.value : null
            return value === null || value === undefined
              ? "url(#missing-data-pattern)"
              : fills[getMapBucket(value, ranges)] || "var(--map-0)"
          })
          .attr("stroke", (item) => {
            const code = getEntityCode(item.properties as Record<string, unknown> | null)
            return code === selected.code ? "var(--magenta)" : "var(--map-outline)"
          })
          .attr("stroke-width", (item) => {
            const code = getEntityCode(item.properties as Record<string, unknown> | null)
            return code === selected.code ? 3 : 1
          })
          .attr("tabindex", 0)
          .attr("role", "button")
          .attr("aria-label", (item) => {
            const code = getEntityCode(item.properties as Record<string, unknown> | null)
            const entity = data.entities.find(({ code: entityCode }) => entityCode === code)
            const name = entity?.name ?? getEntityName(item.properties as Record<string, unknown> | null)
            return `${name}: ${formatPercent(entity ? recordForYear(entity.elections, year)?.value ?? null : null)}`
          })
          .on("click", (_event, item) => {
            const code = getEntityCode(item.properties as Record<string, unknown> | null)
            const entity = data.entities.find(({ code: entityCode }) => entityCode === code)
            if (entity) onSelect(entity)
          })
          .on("keydown", (event: KeyboardEvent, item) => {
            if (event.key !== "Enter" && event.key !== " ") return
            event.preventDefault()
            const code = getEntityCode(item.properties as Record<string, unknown> | null)
            const entity = data.entities.find(({ code: entityCode }) => entityCode === code)
            if (entity) onSelect(entity)
          })

        group
          .selectAll<SVGTextElement, (typeof features)[number]>("text")
          .data(features)
          .join("text")
          .attr("x", (item) => path.centroid(item)[0] ?? 0)
          .attr("y", (item) => path.centroid(item)[1] ?? 0)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("pointer-events", "none")
          .attr("fill", (item) => {
            const code = getEntityCode(item.properties as Record<string, unknown> | null)
            const entity = data.entities.find(({ code: entityCode }) => entityCode === code)
            const value = entity ? recordForYear(entity.elections, year)?.value : null
            return value !== null && value !== undefined && ranges.length && getMapBucket(value, ranges) === 3
              ? "var(--paper)"
              : "var(--ink)"
          })
          .text((item) => getEntityName(item.properties as Record<string, unknown> | null))

        paths.append("title").text((item) => getEntityName(item.properties as Record<string, unknown> | null))
        setMapError(null)
        setMapLoading(false)
      })
      .catch((error: unknown) => {
        if (active) {
          setMapError(error instanceof Error ? error.message : "Error al mostrar el mapa.")
          setMapLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [data, onSelect, selected.code, year])

  if (!data.map.topologyAvailable) {
    return (
      <div className="map-empty" role="status">
        <Pending />
        <p>{data.map.topologyError ?? "El mapa no está disponible temporalmente."}</p>
      </div>
    )
  }
  if (mapError) {
    return (
      <div className="map-empty" role="alert">
        <p>{mapError}</p>
      </div>
    )
  }
  return (
    <div className="map-visualization">
      {mapLoading && (
        <div className="map-loading-overlay" role="status">
          Cargando el mapa de México…
        </div>
      )}
      <svg
        className="mexico-map"
        ref={svgRef}
        viewBox="0 0 700 460"
        role="group"
        aria-label={`Mapa interactivo de las 32 entidades federativas, año ${year}`}
      >
        <defs>
          <pattern
            id="missing-data-pattern"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="8" fill="var(--map-pending)" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--map-pending-line)" strokeWidth="3" />
          </pattern>
        </defs>
      </svg>
    </div>
  )
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [activeSection, setActiveSection] = useState("inicio")
  const [largeFont, setLargeFont] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string>("")
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [currentHash, setCurrentHash] = useState<string>(
    typeof window !== "undefined" ? window.location.hash : "",
  )

  // Escuchar cambios de hash (para navegar a #/ine y volver)
  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash)
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    let active = true
    setLoadError(null)
    void loadDashboard()
      .then((loaded) => {
        if (active) {
          setData(loaded)
          // Estado inicial: el primero alfabéticamente (el selector está ordenado así).
          setSelectedCode((current) =>
            current ||
            [...loaded.entities].sort((a, b) => a.name.localeCompare(b.name, "es"))[0]?.code ||
            "",
          )
        }
      })
      .catch((error: unknown) => {
        if (active) {
          const message = error instanceof Error ? error.message : "Error al cargar la información."
          setLoadError(message)
          console.error("Error al cargar datos:", error)
        }
      })
    return () => {
      active = false
    }
  }, [retry])

  // Observador de secciones activas para el menú
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("main section[id], footer[id]")
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible?.target.id) setActiveSection(visible.target.id)
      },
      { rootMargin: "-30% 0px -60% 0px" },
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [data, loadError])

  const sortedEntities = useMemo(() => {
    if (!data) return []
    return [...data.entities].sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [data])

  const selectedEntity = useMemo(() => {
    if (!data || !sortedEntities.length) return null
    return sortedEntities.find((e) => e.code === selectedCode) ?? sortedEntities[0]!
  }, [data, selectedCode, sortedEntities])

  const national2024 = useMemo(() => {
    if (!data) return undefined
    return recordForYear(data.national, 2024)
  }, [data])

  const ranking = useMemo(() => {
    if (!data || !selectedEntity) return null
    return competitionRank(data.entities, selectedEntity, 2024)
  }, [data, selectedEntity])

  // Umbral de comparación: si la diferencia con el promedio nacional
  // es mayor a 1.0 punto, se considera "más"; si es menor a -1.0 punto, "menos";
  // si está entre -1.0 y 1.0 punto, se considera "igual".
  const comparisonResult = useMemo(() => {
    if (!selectedEntity || national2024?.value === null || national2024?.value === undefined) return null
    const val = recordForYear(selectedEntity.elections, 2024)?.value
    if (val === null || val === undefined) return null
    const diff = val - national2024.value
    if (diff > 1.0) {
      return {
        word: "Votaron más que el promedio del país",
        diff,
      }
    } else if (diff < -1.0) {
      return {
        word: "Votaron menos que el promedio del país",
        diff,
      }
    } else {
      return {
        word: "Votaron igual que el promedio del país",
        diff,
      }
    }
  }, [selectedEntity, national2024])

  // Estado con mayor participación 2024 (referencia para comparar)
  const topState = useMemo(() => {
    if (!data) return null
    let best: { name: string; value: number } | null = null
    for (const entity of data.entities) {
      const value = recordForYear(entity.elections, 2024)?.value
      if (value !== null && value !== undefined && (best === null || value > best.value)) {
        best = { name: entity.name, value }
      }
    }
    return best
  }, [data])

  const handleStateChange = useCallback((code: string) => {
    setSelectedCode(code)
    setTimeout(() => {
      document.getElementById("estado")?.scrollIntoView({ behavior: "smooth" })
    }, 80)
  }, [])
  const handleMapSelect = useCallback(
    (entity: EntityRecord) => handleStateChange(entity.code),
    [handleStateChange],
  )

  const handleDownloadSingle = async () => {
    if (!selectedEntity) return
    try {
      setDownloadError(null)
      const stat = recordForYear(selectedEntity.elections, 2024)
      await downloadCard(
        selectedEntity,
        stat,
        ranking,
        comparisonResult?.diff ?? null,
        national2024?.value ?? null,
      )
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "No se pudo generar la imagen.")
    }
  }

  // Vista dedicada para personal del INE (#/ine)
  if (currentHash === "#/ine") {
    if (!data) return <main id="contenido"><Skeleton /></main>
    return (
      <InePage
        data={data}
        onBack={() => {
          window.location.hash = ""
        }}
      />
    )
  }

  return (
    <div className={`app-shell ${largeFont ? "font-size-large" : ""}`}>
      <Header
        activeSection={activeSection}
        largeFont={largeFont}
        onToggleFont={() => setLargeFont((prev) => !prev)}
      />

      {data && selectedEntity ? (
        <main id="contenido">
          {/* ========================================================
              BLOQUE 1: "¿En qué estado vives?"
              ======================================================== */}
          <section className="section-question" id="inicio" aria-labelledby="question-title">
            <div className="container question-container">
              <span className="hero-kicker">Elecciones en México · 2009 a 2024 · INE</span>
              <h1 id="question-title" className="giant-title">
                ¿En qué estado vives?
              </h1>
              <p className="giant-subtitle">
                Elige tu entidad federativa para conocer de inmediato cómo votaron tus vecinos y qué significa para tu comunidad.
              </p>

              <p className="purpose-line">
                Cada elección la deciden quienes llegan a votar. Mira cuántas personas lo hicieron
                en tu estado y cuántas no.
              </p>

              <div className="giant-select-wrapper">
                <label htmlFor="entity-select" className="giant-select-label">
                  Selecciona tu estado:
                </label>
                <select
                  id="entity-select"
                  className="giant-state-select"
                  value={selectedEntity.code}
                  onChange={(e) => handleStateChange(e.target.value)}
                  aria-label="Selecciona un estado de la República Mexicana"
                >
                  {sortedEntities.map((entity) => (
                    <option key={entity.code} value={entity.code}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ========================================================
              BLOQUE 2: "Así votó tu estado en 2024"
              - Frase enorme: "En [Estado] votaron X de cada 10 personas"
              - Pictograma de 10 figuras
              - Cifra oficial debajo en pequeño
              - Comparación con el país en palabras
              - BARRA HORIZONTAL DE RANGO (mínimo a máximo con Tu estado y Promedio país)
              - Posición en una línea pequeña
              - Recuadro visible "¿Qué significa esto?"
              ======================================================== */}
          <section className="section-state" id="estado" aria-labelledby="state-heading">
            <div className="container state-container">
              <div className="state-header-badge">
                <span className="badge-year">Elección presidencial 2024</span>
                <span className="badge-source">Cifras oficiales del INE</span>
              </div>

              <h2 id="state-heading" className="state-main-title">
                Así votó {selectedEntity.name}
              </h2>

              {(() => {
                const stat = recordForYear(selectedEntity.elections, 2024)
                const val = stat?.value ?? null

                if (val === null) {
                  return (
                    <div className="state-pending-box">
                      <Pending />
                      <p>La fuente consultada no incluye la cifra de participación para esta entidad.</p>
                    </div>
                  )
                }

                const n = perTen(val)

                return (
                  <div className="state-result-card">
                    {/* Frase enorme principal */}
                    <div className="result-headline-box">
                      <p className="headline-lead">En {selectedEntity.name}</p>
                      <strong className="headline-big">
                        votaron {n} de cada 10 personas
                      </strong>
                    </div>

                    {/* Pictograma accesible de 10 figuras humanas */}
                    <PersonPictogram votedCount={n} />

                    {/* Cifra oficial en texto secundario más pequeño */}
                    <p className="official-percent-note">
                      Porcentaje oficial exacto: <strong>{formatPercent(val)}</strong>
                    </p>

                    {/* Propósito: cuántas personas votaron y cuántas no en el estado */}
                    <PersonCounts
                      stateName={selectedEntity.name}
                      voters={stat?.voters ?? null}
                      nonVoters={stat?.nonVoters ?? null}
                      topState={topState}
                    />

                    {/* Comparación en palabras con el país */}
                    {comparisonResult && (
                      <div className="comparison-banner">
                        <span className="comparison-tag">{comparisonResult.word}</span>
                        <p className="comparison-subtext">
                          El promedio de participación en todo el país fue de <strong>{formatPercent(national2024?.value ?? null)}</strong>.
                        </p>
                      </div>
                    )}

                    {/* ── BARRA HORIZONTAL DE RANGO ENTRE ESTADOS ── */}
                    <StateRangeBar
                      entities={data.entities}
                      selectedEntity={selectedEntity}
                      nationalValue={national2024?.value ?? null}
                    />

                    {/* Posición en el ranking de estados */}
                    {ranking !== null && (
                      <p className="ranking-line">
                        {selectedEntity.name} quedó en el <strong>lugar {ranking} de los 32 estados</strong> de México.
                      </p>
                    )}

                    {/* Recuadro siempre visible: ¿Qué significa esto? */}
                    <div className="meaning-box" role="region" aria-labelledby="meaning-title">
                      <h3 id="meaning-title" className="meaning-title">
                        ¿Qué significa esto para tu estado?
                      </h3>
                      <p className="meaning-text">
                        {val >= 50 ? (
                          <>
                            En {selectedEntity.name}, más de la mitad de las personas contabilizadas acudió a las urnas
                            en la elección presidencial de 2024.
                          </>
                        ) : (
                          <>
                            En {selectedEntity.name}, menos de la mitad de las personas contabilizadas acudió a las urnas
                            en la elección presidencial de 2024.
                          </>
                        )}{" "}
                        {comparisonResult && comparisonResult.diff > 1
                          ? "Su participación estuvo por encima del promedio del país."
                          : comparisonResult && comparisonResult.diff < -1
                            ? "Su participación estuvo por debajo del promedio del país."
                            : "Su participación fue muy parecida al promedio del país."}
                      </p>
                    </div>

                    {/* Mapa interactivo integrado para explorar visualmente */}
                    <div className="map-wrapper">
                      <h3 className="map-title">Ubicación de {selectedEntity.name} en el mapa</h3>
                      <p className="support-text">
                        Puedes tocar cualquier otro estado en el mapa para ver sus resultados.
                      </p>
                      <MexicoMap
                        data={data}
                        selected={selectedEntity}
                        year={2024}
                        onSelect={handleMapSelect}
                      />
                      <MapLegend records={sortedEntities} year={2024} />
                    </div>
                  </div>
                )
              })()}
            </div>
          </section>

          {/* ========================================================
              BLOQUE 3: "Comparte esto con tu familia"
              ======================================================== */}
          <CitizenActions
            entity={selectedEntity}
            statistic={recordForYear(selectedEntity.elections, 2024)}
            onDownloadPng={() => void handleDownloadSingle()}
            downloadError={downloadError}
          />

          {/* ========================================================
              BLOQUE 4: "¿Cómo ha votado el país?"
              ======================================================== */}
          <NationalHistory data={data} />

          {/* ========================================================
              BLOQUE 5: "Ver más información" (cerrado por defecto)
              - Detalles técnicos del estado
              - Quiénes votan por etapa de vida y sección
              - Tabla simple de 6 filas (mínimo y máximo por elección, sin cuartiles ni medianas)
              ======================================================== */}
          <section className="section-more-info" id="detalles" aria-labelledby="more-info-title">
            <div className="container">
              <details className="more-info-accordion">
                <summary className="more-info-summary">
                  <span id="more-info-title">Ver más información y datos técnicos</span>
                  <span className="summary-arrow" aria-hidden="true">▾</span>
                </summary>

                <div className="more-info-content">
                  {/* Cifras detalladas de la entidad */}
                  <div className="detail-card">
                    <h4>Cifras detalladas de {selectedEntity.name} (2024)</h4>
                    <p className="support-text">
                      Conteos oficiales de personas inscritas y votos emitidos según la Plataforma CCPC del INE.
                    </p>

                    {(() => {
                      const stat = recordForYear(selectedEntity.elections, 2024)
                      return (
                        <dl className="state-counts-grid">
                          <div>
                            <dt>Personas que sí votaron</dt>
                            <dd>{stat?.voters != null ? countFormatter.format(stat.voters) : "Dato pendiente"}</dd>
                          </div>
                          <div>
                            <dt>Personas que no votaron</dt>
                            <dd>{stat?.nonVoters != null ? countFormatter.format(stat.nonVoters) : "Dato pendiente"}</dd>
                          </div>
                          <div>
                            <dt>Lista nominal</dt>
                            <dd>{selectedEntity.listNominal != null ? countFormatter.format(selectedEntity.listNominal) : "Dato pendiente"}</dd>
                          </div>
                          <div>
                            <dt>Votos no especificados</dt>
                            <dd>{selectedEntity.votesNoEsp != null ? countFormatter.format(selectedEntity.votesNoEsp) : "Dato pendiente"}</dd>
                          </div>
                          <div>
                            <dt>IML (sigla del tablero oficial)</dt>
                            <dd>{selectedEntity.iml ?? "Dato pendiente"}</dd>
                            <small className="field-note">Sigla registrada en el tablero del INE; se conserva su valor numérico.</small>
                          </div>
                          <div>
                            <dt>IMV (sigla del tablero oficial)</dt>
                            <dd>{selectedEntity.imv ?? "Dato pendiente"}</dd>
                            <small className="field-note">Sigla registrada en el tablero del INE; se conserva su valor numérico.</small>
                          </div>
                        </dl>
                      )
                    })()}

                    <p className="state-pending-note">
                      Participación por estado en otras elecciones: dato pendiente. La fuente consultada solo incluye el desglose estatal de 2024.
                    </p>
                  </div>

                  {/* Quiénes votan (Composición) y Edad Promedio */}
                  <Profiles records={data.profiles} national={data.national} />

                  {/* Tabla simple de 6 filas con mínimo y máximo entre estados (sin cuartiles ni medianas) */}
                  <MinMaxTable quartiles={data.quartiles} />
                </div>
              </details>
            </div>
          </section>
        </main>
      ) : loadError ? (
        <main className="load-error" id="contenido" role="alert">
          <p className="eyebrow">Aviso</p>
          <h1>No se pudo cargar la información.</h1>
          <p>{loadError}</p>
          <button
            className="button button-senior button-senior-primary"
            onClick={() => setRetry((c) => c + 1)}
          >
            Reintentar
          </button>
        </main>
      ) : (
        <main id="contenido"><Skeleton /></main>
      )}

      <Footer />
    </div>
  )
}

export default function App() {
  const [boundaryKey, setBoundaryKey] = useState(0)
  return (
    <ErrorBoundary key={boundaryKey} onRetry={() => setBoundaryKey((key) => key + 1)}>
      <Dashboard />
    </ErrorBoundary>
  )
}
