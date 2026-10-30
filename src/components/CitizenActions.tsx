/**
 * Bloque 3: "Comparte esto con tu familia".
 * Diseñado con botones grandes (≥56 px) y un solo mensaje claro.
 * Mensaje: "En [Estado] votaron X de cada 10 personas." (sin enlace)
 */
import { useState } from "react"
import type { EntityRecord, ElectionRecord } from "../data/types"
import { perTen } from "../lib/electoral"

function buildSingleMessage(
  entity: EntityRecord | null,
  statistic: ElectionRecord | undefined,
): string {
  if (!entity || !statistic || statistic.value === null) {
    return "En México votaron cerca de 6 de cada 10 personas en 2024."
  }
  const n = perTen(statistic.value)
  return `En ${entity.name} votaron ${n} de cada 10 personas.`
}

interface CitizenActionsProps {
  entity: EntityRecord | null
  statistic: ElectionRecord | undefined
  onDownloadPng: () => void
  downloadError: string | null
}

export function CitizenActions({
  entity,
  statistic,
  onDownloadPng,
  downloadError,
}: CitizenActionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const singleMessage = buildSingleMessage(entity, statistic)

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: entity
            ? `Participación electoral en ${entity.name} · 2024`
            : "Participación electoral en México · 2024",
          text: singleMessage,
        })
        setFeedback("¡Gracias por compartir esta información!")
        setTimeout(() => setFeedback(null), 4000)
        return
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(singleMessage)
      } else {
        const textarea = document.createElement("textarea")
        textarea.value = singleMessage
        textarea.style.position = "fixed"
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }
      setFeedback("Mensaje copiado. Ya puede pegarlo donde quiera (por ejemplo en WhatsApp).")
      setTimeout(() => setFeedback(null), 5000)
    } catch {
      setFeedback("No se pudo copiar automáticamente. Puede seleccionar el texto con el dedo y copiarlo.")
    }
  }

  return (
    <section className="share-section" aria-labelledby="share-title">
      <div className="share-header">
        <h3 id="share-title">Comparte esto con tu familia</h3>
        <p className="share-subtitle">
          Son datos oficiales del INE, explicados de forma sencilla.
        </p>
      </div>

      {/* Mensaje único que se compartirá */}
      <div className="share-message-box">
        <p className="share-message-label">Mensaje que se enviará:</p>
        <blockquote className="share-message-quote">
          {singleMessage}
        </blockquote>
      </div>

      {/* Botones de acción grandes (≥56 px) */}
      <div className="share-buttons-grid">
        <button
          className="button button-senior button-senior-primary"
          type="button"
          onClick={() => void handleShare()}
        >
          <span className="button-icon" aria-hidden="true">💬</span>
          <span>Compartir por WhatsApp o redes</span>
        </button>

        <button
          className="button button-senior button-senior-secondary"
          type="button"
          onClick={onDownloadPng}
        >
          <span className="button-icon" aria-hidden="true">🖼️</span>
          <span>Descargar imagen</span>
        </button>
      </div>

      {/* Pregunta abierta para conversar (no explica causas) */}
      <div className="family-question">
        <p className="family-question-label">Para platicar en familia</p>
        <p className="family-question-text">
          ¿Qué crees que ayudaría a que más personas voten en tu comunidad?
        </p>
      </div>

      {/* Retroalimentación grande tras la acción */}
      {feedback && (
        <div className="share-feedback-banner" role="status" aria-live="polite">
          <p className="feedback-text">{feedback}</p>
        </div>
      )}

      {downloadError && (
        <p className="inline-error" role="alert">
          {downloadError}
        </p>
      )}
    </section>
  )
}
