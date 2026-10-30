/**
 * Generador de imagen PNG cuadrada (1200 x 1200 px) para compartir.
 * Diseñada para personas mayores y divulgación clara:
 * - Estado en letras muy grandes
 * - Frase destacada: "Votaron X de cada 10 personas"
 * - Pictograma de 10 personas dibujado directamente en canvas
 * - Cifra oficial del INE y promedio nacional
 * - Fuente y fecha oficial
 */
import type { EntityRecord, ElectionRecord } from "../data/types"
import { perTen } from "./electoral"

const countFmt = new Intl.NumberFormat("es-MX")
const oneDecimal = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatPercentCard(value: number | null): string {
  return value === null ? "Dato pendiente" : `${oneDecimal.format(value)} %`
}

/** Dibuja una silueta de persona en el canvas en (cx, cy) con ancho w y alto h */
function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  filled: boolean,
  fillColor: string,
  emptyColor: string,
  strokeColor: string,
) {
  const headRadius = w * 0.22
  const headCx = x + w / 2
  const headCy = y + headRadius + 2

  ctx.save()
  if (filled) {
    ctx.fillStyle = fillColor
    // Cabeza
    ctx.beginPath()
    ctx.arc(headCx, headCy, headRadius, 0, Math.PI * 2)
    ctx.fill()
    // Cuerpo
    ctx.beginPath()
    const bodyTop = y + headRadius * 2 + 8
    ctx.moveTo(x + w * 0.15, y + h)
    ctx.bezierCurveTo(x + w * 0.15, bodyTop, x + w * 0.35, bodyTop, headCx, bodyTop)
    ctx.bezierCurveTo(x + w * 0.65, bodyTop, x + w * 0.85, bodyTop, x + w * 0.85, y + h)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillStyle = emptyColor
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 3
    // Cabeza
    ctx.beginPath()
    ctx.arc(headCx, headCy, headRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // Cuerpo
    ctx.beginPath()
    const bodyTop = y + headRadius * 2 + 8
    ctx.moveTo(x + w * 0.15, y + h)
    ctx.bezierCurveTo(x + w * 0.15, bodyTop, x + w * 0.35, bodyTop, headCx, bodyTop)
    ctx.bezierCurveTo(x + w * 0.65, bodyTop, x + w * 0.85, bodyTop, x + w * 0.85, y + h)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

export async function drawCardToCanvas(
  entity: EntityRecord,
  statistic: ElectionRecord | undefined,
  position: number | null,
  comparison: number | null,
  nationalValue: number | null = null,
): Promise<HTMLCanvasElement> {
  await document.fonts.ready
  const canvas = document.createElement("canvas")
  canvas.width = 1200
  canvas.height = 1200
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo preparar la imagen en su navegador.")

  const value = statistic?.value ?? null
  const activeCount = value !== null ? perTen(value) : 0

  // 1. Fondo limpio de alto contraste
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, 1200, 1200)

  // 2. Banda superior color vino institucional
  ctx.fillStyle = "#611232"
  ctx.fillRect(0, 0, 1200, 36)

  // 3. Encabezado institucional
  ctx.fillStyle = "#202024"
  ctx.font = "700 36px Montserrat, sans-serif"
  ctx.fillText("15 AÑOS DE TU VOTO · ELECCIONES 2024", 80, 110)

  // 4. Nombre de la entidad (muy grande y legible)
  ctx.fillStyle = "#611232"
  ctx.font = "700 72px Montserrat, sans-serif"
  let stateFontSize = 72
  while (ctx.measureText(entity.name).width > 1040 && stateFontSize > 40) {
    stateFontSize -= 2
    ctx.font = `700 ${stateFontSize}px Montserrat, sans-serif`
  }
  ctx.fillText(entity.name, 80, 215)

  // 5. Frase enorme: "Votaron X de cada 10 personas"
  ctx.fillStyle = "#202024"
  ctx.font = "700 52px Montserrat, sans-serif"
  if (value !== null) {
    ctx.fillText("En esta entidad votaron", 80, 310)
    ctx.fillStyle = "#b00059"
    ctx.font = "800 76px Montserrat, sans-serif"
    ctx.fillText(`${activeCount} de cada 10 personas`, 80, 400)
  } else {
    ctx.fillStyle = "#56545a"
    ctx.font = "700 52px Montserrat, sans-serif"
    ctx.fillText("Dato de participación pendiente", 80, 340)
  }

  // 6. Pictograma de 10 figuras en dos filas de 5 o una fila de 10
  // Ancho disponible: 1040 px (80 a 1120)
  const iconW = 84
  const iconH = 140
  const iconGap = 20
  const totalIconsW = 10 * iconW + 9 * iconGap // 840 + 180 = 1020
  const startX = 80 + (1040 - totalIconsW) / 2
  const startY = 470

  // Fondo sutil para el área del pictograma
  ctx.fillStyle = "#f7f4f1"
  ctx.beginPath()
  ctx.roundRect(80, startY - 25, 1040, 220, 20)
  ctx.fill()

  for (let i = 0; i < 10; i++) {
    const isVoted = i < activeCount
    const px = startX + i * (iconW + iconGap)
    drawPerson(
      ctx,
      px,
      startY + 15,
      iconW,
      iconH,
      isVoted,
      "#b00059", // Vino / magenta para quienes sí votaron
      "#e5e2df", // Gris claro para no votantes
      "#b0adb3", // Borde visible
    )
  }

  // Leyenda del pictograma
  ctx.fillStyle = "#56545a"
  ctx.font = "600 24px 'Noto Sans', sans-serif"
  ctx.fillText(
    `● ${activeCount} votaron    ○ ${10 - activeCount} no votaron`,
    80,
    730,
  )

  // 7. Cifra oficial y comparativo
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.roundRect(80, 770, 1040, 250, 16)
  ctx.fill()
  ctx.strokeStyle = "#dedcdf"
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = "#202024"
  ctx.font = "700 36px Montserrat, sans-serif"
  const officialText = value !== null ? `${oneDecimal.format(value)} %` : "Dato pendiente"
  ctx.fillText(`Participación oficial: ${officialText}`, 120, 822)

  ctx.fillStyle = "#56545a"
  ctx.font = "500 28px 'Noto Sans', sans-serif"
  const nationalText = nationalValue === null ? "" : ` (${oneDecimal.format(nationalValue)} %)`
  const diffWord =
    comparison === null
      ? ""
      : comparison > 1
        ? `Por encima del promedio del país${nationalText}`
        : comparison < -1
          ? `Por debajo del promedio del país${nationalText}`
          : `Similar al promedio del país${nationalText}`
  if (diffWord) {
    ctx.fillText(diffWord, 120, 872)
  }

  const posWord = position !== null ? `Lugar ${position} de los 32 estados de México` : ""
  if (posWord) {
    ctx.fillText(posWord, 120, 922)
  }

  // Propósito: personas que votaron y que no votaron en la entidad
  if (statistic?.voters != null && statistic?.nonVoters != null) {
    ctx.fillStyle = "#202024"
    ctx.font = "700 26px 'Noto Sans', sans-serif"
    ctx.fillText(
      `${countFmt.format(statistic.voters)} sí votaron · ${countFmt.format(statistic.nonVoters)} no votaron`,
      120,
      975,
    )
  }

  // 8. Banda inferior de cierre con fuentes oficiales
  ctx.fillStyle = "#420820"
  ctx.fillRect(0, 1070, 1200, 130)

  ctx.fillStyle = "#ffffff"
  ctx.font = "700 30px Montserrat, sans-serif"
  ctx.fillText("Datos oficiales del Instituto Nacional Electoral (INE)", 80, 1130)
  ctx.font = "500 22px 'Noto Sans', sans-serif"
  ctx.fillText("Cada elección la deciden quienes llegan a votar · Plataforma CCPC 2009–2024 · ine.mx", 80, 1170)

  return canvas
}

export async function downloadCard(
  entity: EntityRecord,
  statistic: ElectionRecord | undefined,
  position: number | null,
  comparison: number | null,
  nationalValue: number | null = null,
): Promise<void> {
  const canvas = await drawCardToCanvas(entity, statistic, position, comparison, nationalValue)
  const link = document.createElement("a")
  link.download = `voto-2024-${entity.code}.png`
  link.href = canvas.toDataURL("image/png")
  link.click()
}
