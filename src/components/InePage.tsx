/**
 * InePage — Página independiente "Para el personal del INE y Juntas Locales" (#/ine).
 * Separada del recorrido ciudadano para no abrumar a las personas usuarias.
 *
 * Contiene:
 * - Botón para regresar al inicio.
 * - Descarga del archivo .zip con las 32 fichas PNG.
 * - Descarga de los datos en Excel (.xlsx) con hoja de fuente y metodología.
 * - Gráfica técnica de cuartiles con eje corregido.
 * - Guía para actualizar los datos reemplazando los CSV en data-source/.
 * - Totales nacionales de 2024 para verificación.
 */
import { useState, useMemo } from "react"
import JSZip from "jszip"
import ExcelJS from "exceljs"
import type { DashboardData } from "../data/types"
import { drawCardToCanvas } from "../lib/drawCard"
import { competitionRank, recordForYear } from "../lib/electoral"
import { QuartilesChart } from "./QuartilesChart"

const oneDecimal = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const countFmt = new Intl.NumberFormat("es-MX")

function computeRankings(data: DashboardData) {
  const national2024 = recordForYear(data.national, 2024)?.value ?? null
  return data.entities.map((entity) => {
    const statistic = recordForYear(entity.elections, 2024)
    const value = statistic?.value ?? null
    const position = competitionRank(data.entities, entity, 2024)
    const comparison = value !== null && national2024 !== null ? value - national2024 : null
    return { entity, statistic, position, comparison }
  })
}

async function generateZip(
  data: DashboardData,
  onProgress: (done: number) => void,
): Promise<Blob> {
  const rankings = computeRankings(data)
  const national2024 = recordForYear(data.national, 2024)?.value ?? null
  const zip = new JSZip()
  const folder = zip.folder("15-anos-de-tu-voto-fichas-32-estados")

  for (let i = 0; i < rankings.length; i++) {
    const { entity, statistic, position, comparison } = rankings[i]!
    const canvas = await drawCardToCanvas(entity, statistic, position, comparison, national2024)
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b ?? new Blob()), "image/png"),
    )
    const arrayBuffer = await blob.arrayBuffer()
    folder?.file(`voto-2024-${entity.code}.png`, arrayBuffer)
    onProgress(i + 1)
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" })
}

async function generateExcel(data: DashboardData): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "15 años de tu voto"
  workbook.created = new Date()

  // 1. Participación 2024 entidades
  const sheet1 = workbook.addWorksheet("Participación 2024 estados")
  sheet1.columns = [
    { header: "Clave", key: "clave", width: 8 },
    { header: "Entidad", key: "nombre", width: 28 },
    { header: "Participación (%)", key: "participacion", width: 18 },
    { header: "Precisión", key: "precision", width: 12 },
    { header: "Sí votaron", key: "si_votaron", width: 20 },
    { header: "No votaron", key: "no_votaron", width: 20 },
    { header: "Lista nominal", key: "lista_nominal", width: 16 },
    { header: "Votos no esp.", key: "votos_no_esp", width: 18 },
    { header: "IML", key: "iml", width: 10 },
    { header: "IMV", key: "imv", width: 10 },
    { header: "Fuente", key: "fuente", width: 40 },
  ]
  sheet1.getRow(1).font = { bold: true }
  const rankings = computeRankings(data)
  for (const { entity, statistic } of rankings) {
    sheet1.addRow({
      clave: entity.code,
      nombre: entity.name,
      participacion: statistic?.value ?? null,
      precision: statistic?.precision ?? "Dato pendiente",
      si_votaron: statistic?.voters ?? null,
      no_votaron: statistic?.nonVoters ?? null,
      lista_nominal: entity.listNominal ?? null,
      votos_no_esp: entity.votesNoEsp ?? null,
      iml: entity.iml ?? null,
      imv: entity.imv ?? null,
      fuente: statistic?.source ?? "Dato pendiente",
    })
  }

  // 2. Historia nacional
  const sheet2 = workbook.addWorksheet("Historia nacional")
  sheet2.columns = [
    { header: "Año", key: "año", width: 8 },
    { header: "Tipo de elección", key: "tipo", width: 22 },
    { header: "Participación (%)", key: "participacion", width: 18 },
    { header: "Precisión", key: "precision", width: 12 },
    { header: "Personas que sí votaron", key: "si_votaron", width: 24 },
    { header: "Edad promedio", key: "edad_promedio", width: 18 },
    { header: "Fuente", key: "fuente", width: 40 },
  ]
  sheet2.getRow(1).font = { bold: true }
  for (const record of data.national) {
    sheet2.addRow({
      año: record.year,
      tipo: record.kind === "presidencial" ? "Presidencial" : "Intermedia (diputaciones)",
      participacion: record.value ?? null,
      precision: record.precision ?? "Dato pendiente",
      si_votaron: record.voters ?? null,
      edad_promedio: record.averageAge ?? null,
      fuente: record.source ?? "Dato pendiente",
    })
  }

  // 3. Cuartiles estatales (la tarjeta de la página anuncia esta hoja)
  const sheetQ = workbook.addWorksheet("Cuartiles estatales")
  sheetQ.columns = [
    { header: "Año", key: "año", width: 8 },
    { header: "Tipo de elección", key: "tipo", width: 22 },
    { header: "Mínimo (%)", key: "minimo", width: 12 },
    { header: "Q1 (%)", key: "q1", width: 10 },
    { header: "Mediana (%)", key: "mediana", width: 12 },
    { header: "Q3 (%)", key: "q3", width: 10 },
    { header: "Máximo (%)", key: "maximo", width: 12 },
    { header: "Precisión", key: "precision", width: 12 },
    { header: "Fuente", key: "fuente", width: 40 },
  ]
  sheetQ.getRow(1).font = { bold: true }
  for (const q of data.quartiles) {
    sheetQ.addRow({
      año: q.year,
      tipo: q.kind === "presidencial" ? "Presidencial" : "Intermedia (diputaciones)",
      minimo: q.minimum,
      q1: q.q1,
      mediana: q.median,
      q3: q.q3,
      maximo: q.maximum,
      precision: q.precision,
      fuente: q.source,
    })
  }

  // 4. Metodología
  const sheet3 = workbook.addWorksheet("Fuente y metodología")
  const meta = [
    ["Herramienta", "15 años de tu voto · Divulgación de participación ciudadana"],
    ["Fuente oficial", "Plataforma CCPC 2009–2024, Instituto Nacional Electoral (INE)"],
    ["Fórmula de participación", "Personas que sí votaron ÷ (Personas que sí votaron + Personas que no votaron) × 100"],
    ["Regla de lista nominal", "La lista nominal no se usa como denominador en esta fórmula."],
    ["Elecciones presidenciales", "2012, 2018, 2024"],
    ["Elecciones intermedias", "2009, 2015, 2021 (elección de diputaciones federales, sin Presidente)"],
    ["Siglas IML e IMV", "Siglas oficiales pendientes de confirmación pública de su desglose por el INE; se conserva solo su valor numérico."],
    ["Dato pendiente", "La fuente disponible no incluye el dato desagregado; no se inventa ni se estima."],
    ["Composición de votantes", "Porcentaje de los votantes; no es tasa de participación del grupo."],
    ["Participación estatal", "Disponible solo para 2024 en esta versión"],
    ["Fecha de exportación", new Date().toLocaleDateString("es-MX")],
  ]
  sheet3.getColumn(1).width = 28
  sheet3.getColumn(2).width = 72
  for (const [key, val] of meta) {
    const row = sheet3.addRow([key, val])
    row.getCell(1).font = { bold: true }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "15-anos-de-tu-voto-datos.xlsx"
  link.click()
  URL.revokeObjectURL(url)
}

interface InePageProps {
  data: DashboardData
  onBack: () => void
}

export function InePage({ data, onBack }: InePageProps) {
  const [zipState, setZipState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [zipProgress, setZipProgress] = useState(0)
  const [zipError, setZipError] = useState<string | null>(null)
  const [xlsxState, setXlsxState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [xlsxError, setXlsxError] = useState<string | null>(null)

  const rankings = useMemo(() => computeRankings(data), [data])
  const national2024 = recordForYear(data.national, 2024)

  const totalVoters = useMemo(() => {
    return rankings.reduce((acc, r) => acc + (r.statistic?.voters ?? 0), 0)
  }, [rankings])

  const totalNonVoters = useMemo(() => {
    return rankings.reduce((acc, r) => acc + (r.statistic?.nonVoters ?? 0), 0)
  }, [rankings])

  const handleZip = async () => {
    try {
      setZipState("loading")
      setZipError(null)
      setZipProgress(0)
      const blob = await generateZip(data, (done) => setZipProgress(done))
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "fichas-32-estados-ine-2024.zip"
      link.click()
      URL.revokeObjectURL(url)
      setZipState("done")
      setTimeout(() => setZipState("idle"), 4000)
    } catch (err) {
      setZipError(err instanceof Error ? err.message : "No se pudo generar el archivo ZIP.")
      setZipState("error")
    }
  }

  const handleXlsx = async () => {
    try {
      setXlsxState("loading")
      setXlsxError(null)
      await generateExcel(data)
      setXlsxState("done")
      setTimeout(() => setXlsxState("idle"), 4000)
    } catch (err) {
      setXlsxError(err instanceof Error ? err.message : "No se pudo exportar a Excel.")
      setXlsxState("error")
    }
  }

  return (
    <main className="ine-page-shell" id="contenido">
      <div className="container">
        <div className="ine-page-header">
          <button
            type="button"
            className="button button-senior button-senior-secondary ine-back-btn"
            onClick={onBack}
          >
            ← Volver a la página principal
          </button>
          <p className="eyebrow">Herramienta de divulgación institucional</p>
          <h1>Para el INE y las 32 Juntas Locales</h1>
          <p className="ine-page-lead">
            Material listo para descargar, compartir y actualizar en las 32 Juntas Locales Ejecutivas.
            Todo se procesa en el navegador de forma segura y sin conexión a servidores externos.
          </p>
        </div>

        <div className="ine-tools-grid">
          {/* Tarjeta 1: ZIP con 32 fichas */}
          <div className="ine-card">
            <span className="ine-card-icon" aria-hidden="true">🗂️</span>
            <h2>Fichas PNG de las 32 entidades (.zip)</h2>
            <p>
              Genera en un solo archivo comprimido las imágenes de los 32 estados, listas para
              publicar en redes sociales o proyectar en actividades de educación cívica.
            </p>
            {zipState === "loading" && (
              <p className="ine-progress" role="status" aria-live="polite">
                Generando imagen {zipProgress} de {data.entities.length}…
              </p>
            )}
            {zipState === "done" && (
              <p className="ine-success" role="status" aria-live="polite">
                ✓ Archivo ZIP descargado con las 32 fichas.
              </p>
            )}
            {zipError && (
              <p className="inline-error" role="alert">
                {zipError}
              </p>
            )}
            <button
              className="button button-senior button-senior-primary"
              type="button"
              disabled={zipState === "loading"}
              onClick={() => void handleZip()}
            >
              {zipState === "loading"
                ? `Generando… (${zipProgress}/32)`
                : "Descargar ZIP con 32 fichas"}
            </button>
          </div>

          {/* Tarjeta 2: Excel con datos y metodología */}
          <div className="ine-card">
            <span className="ine-card-icon" aria-hidden="true">📊</span>
            <h2>Datos completos en Excel (.xlsx)</h2>
            <p>
              Descarga la tabla con las 32 entidades, el histórico de las 6 elecciones nacionales,
              cuartiles y la hoja con la fuente y metodología oficial.
            </p>
            {xlsxState === "done" && (
              <p className="ine-success" role="status" aria-live="polite">
                ✓ Archivo Excel descargado.
              </p>
            )}
            {xlsxError && (
              <p className="inline-error" role="alert">
                {xlsxError}
              </p>
            )}
            <button
              className="button button-senior button-senior-secondary"
              type="button"
              disabled={xlsxState === "loading"}
              onClick={() => void handleXlsx()}
            >
              {xlsxState === "loading" ? "Preparando Excel…" : "Descargar datos en Excel (.xlsx)"}
            </button>
          </div>

          {/* Tarjeta 3: Cómo actualizar */}
          <div className="ine-card ine-card-wide">
            <span className="ine-card-icon" aria-hidden="true">🔄</span>
            <h2>Cómo actualizar con datos completos</h2>
            <p>
              Cuando el INE publique nuevos datos oficiales o desgloses adicionales, basta con
              reemplazar los archivos CSV locales y validar:
            </p>
            <ol className="update-steps">
              <li>
                <strong>Coloque los CSV actualizados</strong> en la carpeta <code>data-source/</code> del
                proyecto, respetando exactamente los nombres de encabezados existentes.
              </li>
              <li>
                <strong>Ejecute la importación y validación</strong> en la terminal:
                <br />
                <code>pnpm run build:data</code> (convierte los CSV a JSON validados por Zod)
                <br />
                <code>pnpm run validate:data</code> (verifica sumas, coherencia y regla de lista nominal)
              </li>
              <li>
                <strong>Construya la aplicación</strong>:
                <br />
                <code>pnpm run build</code>
                <br />
                Los archivos listos para publicarse quedarán en la carpeta <code>dist/</code>.
              </li>
            </ol>
            <p className="ine-update-note">
              <strong>Nota sobre consistencia:</strong> El importador verifica que la suma de
              los 32 estados coincida exactamente con la cifra nacional y que la fórmula oficial
              se cumpla con tolerancia de 0.06 puntos.
            </p>
          </div>
        </div>

        {/* Gráfica técnica de cuartiles (solo en esta página) */}
        <QuartilesChart quartiles={data.quartiles} />

        {/* Verificación de totales */}
        <aside className="ine-totals" aria-label="Totales nacionales de verificación">
          <h2>Totales nacionales de verificación (2024)</h2>
          <dl className="ine-totals-grid">
            <div>
              <dt>Participación nacional</dt>
              <dd>{national2024?.value != null ? `${oneDecimal.format(national2024.value)} %` : "Dato pendiente"}</dd>
            </div>
            <div>
              <dt>Personas que sí votaron (suma 32 estados)</dt>
              <dd>{countFmt.format(totalVoters)}</dd>
            </div>
            <div>
              <dt>Personas que no votaron (suma 32 estados)</dt>
              <dd>{countFmt.format(totalNonVoters)}</dd>
            </div>
            <div>
              <dt>Fuente oficial</dt>
              <dd>Plataforma CCPC · INE</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  )
}
