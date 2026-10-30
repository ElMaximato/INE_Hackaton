/**
 * Barra horizontal de rango entre estados para el Bloque 2 ("Así votó tu estado en 2024").
 *
 * Muestra de un vistazo la posición del estado entre el de menor participación
 * y el de mayor participación, junto con la marca del promedio del país.
 *
 * Mejoras aplicadas:
 * 1. Pista neutra continua sin relleno parcial hasta el promedio.
 * 2. Marcador "Tu estado" arriba, exactamente proporcional al valor real.
 * 3. Para evitar que la etiqueta se corte en los extremos (0 % o 100 %),
 *    se desplaza solo la etiqueta contenedora de texto, mientras el pin permanece
 *    apuntando al porcentaje exacto.
 * 4. Marcador "Promedio del país" abajo con etiqueta y valor.
 * 5. Frase dinámica calculada desde los datos.
 */
import { useMemo } from "react"
import type { EntityRecord } from "../data/types"
import { computeStateRange } from "../lib/stateRange"
import { formatPercent } from "./DataStatus"

interface StateRangeBarProps {
  entities: EntityRecord[]
  selectedEntity: EntityRecord | null
  nationalValue: number | null
}

export function StateRangeBar({
  entities,
  selectedEntity,
  nationalValue,
}: StateRangeBarProps) {
  const range = useMemo(
    () => computeStateRange(entities, selectedEntity, nationalValue),
    [entities, selectedEntity, nationalValue],
  )

  if (!range.hasData || !range.minEntity || !range.maxEntity || range.selectedValue === null) {
    return (
      <div className="state-range-pending-box" role="status">
        <p className="state-range-pending-text">
          <strong>Dato pendiente:</strong> El INE aún no publica la participación desglosada para esta entidad.
        </p>
      </div>
    )
  }

  const {
    minEntity,
    maxEntity,
    selectedValue,
    selectedPositionPercent,
    nationalPositionPercent,
    summaryPhrase,
    ariaLabel,
  } = range

  const statePos = selectedPositionPercent ?? 0
  const natPos = nationalPositionPercent ?? 50

  // Desplazamiento exclusivo de la tarjeta de texto para no cortarse en los bordes
  // mientras el pin indicador permanece centrado en el porcentaje exacto (left: statePos%)
  const stateCardShiftClass =
    statePos < 18 ? "card-shift-left" : statePos > 82 ? "card-shift-right" : "card-shift-center"

  const natCardShiftClass =
    natPos < 18 ? "card-shift-left" : natPos > 82 ? "card-shift-right" : "card-shift-center"

  return (
    <div
      className="state-range-component"
      role="img"
      aria-label={ariaLabel}
    >
      <div className="state-range-header">
        <h3 className="state-range-title">¿Dónde se ubica tu estado respecto a los demás?</h3>
      </div>

      <div className="range-visual-container">
        {/* ── MARCA ARRIBA: Tu estado ── */}
        <div className="marker-lane marker-lane--top">
          <div
            className="range-marker range-marker--state"
            style={{ left: `${statePos}%` }}
          >
            {/* Tarjeta de texto (con shift si está en los extremos para no salirse) */}
            <div className={`marker-card marker-card--state ${stateCardShiftClass}`}>
              <span className="marker-badge">Tu estado</span>
              <strong className="marker-value">{formatPercent(selectedValue)}</strong>
            </div>
            {/* Pin triangular apuntando exactamente a la barra */}
            <div className="marker-pin marker-pin--down" aria-hidden="true" />
          </div>
        </div>

        {/* ── BARRA HORIZONTAL PRINCIPAL (Pista neutra sin relleno parcial) ── */}
        <div className="range-track-wrapper">
          <div className="range-track" />
        </div>

        {/* ── MARCA ABAJO: Promedio del país ── */}
        <div className="marker-lane marker-lane--bottom">
          {nationalPositionPercent !== null && nationalValue !== null && (
            <div
              className="range-marker range-marker--national"
              style={{ left: `${natPos}%` }}
            >
              {/* Pin apuntando exactamente a la barra */}
              <div className="marker-pin marker-pin--up" aria-hidden="true" />
              {/* Tarjeta de texto */}
              <div className={`marker-card marker-card--national ${natCardShiftClass}`}>
                <span className="marker-badge-national">Promedio del país</span>
                <strong className="marker-value-national">{formatPercent(nationalValue)}</strong>
              </div>
            </div>
          )}
        </div>

        {/* ── EXTREMOS DE LA BARRA (Mínimo y Máximo) ── */}
        <div className="range-extremes" aria-hidden="true">
          <div className="extreme-box extreme-box--min">
            <span className="extreme-label">Menor votación</span>
            <strong className="extreme-pct">{formatPercent(minEntity.value)}</strong>
            <span className="extreme-name">{minEntity.name}</span>
          </div>

          <div className="extreme-box extreme-box--max">
            <span className="extreme-label">Mayor votación</span>
            <strong className="extreme-pct">{formatPercent(maxEntity.value)}</strong>
            <span className="extreme-name">{maxEntity.name}</span>
          </div>
        </div>
      </div>

      {/* Nota obligatoria de la escala */}
      <p className="range-scale-note">
        La barra muestra solo el rango entre los estados; no empieza en cero.
      </p>

      {/* Frase generada desde los datos en lenguaje cotidiano */}
      <div className="range-summary-banner">
        <span className="summary-icon" aria-hidden="true">📍</span>
        <p className="range-summary-text">{summaryPhrase}</p>
      </div>
    </div>
  )
}
