import { expect, test } from "@playwright/test"

test("recorrido ciudadano con barra horizontal de rango, cambio de estado y herramientas INE", async ({
  page,
  baseURL,
}) => {
  const externalRequests: string[] = []
  const consoleErrors: string[] = []

  await page.setViewportSize({ width: 1440, height: 1000 })
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL ?? "")) externalRequests.push(request.url())
  })
  page.on("pageerror", (error) => consoleErrors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })

  await page.goto("/")

  // ── 1. Bloque 1: ¿En qué estado vives? ─────────────────────────────────
  await expect(page.getByRole("heading", { level: 1 })).toContainText("¿En qué estado vives?")
  const select = page.locator("#entity-select")
  await expect(select).toBeVisible()
  const dashboardRequests: string[] = []
  page.on("request", (request) => {
    if (request.url().endsWith("/data/dashboard.json")) dashboardRequests.push(request.url())
  })

  // ── 2. Bloque 2 con Estado Intermedio (BCS - 53.1 %) ───────────────────
  await select.selectOption("BCS")
  await expect(page.locator(".state-result-card")).toContainText("votaron 5 de cada 10 personas")
  await expect(page.locator(".official-percent-note")).toContainText("53.1 %")

  // Barra de rango horizontal presente y con accesibilidad
  const rangeComponent = page.locator(".state-range-component")
  await expect(rangeComponent).toBeVisible()
  await expect(rangeComponent).toHaveAttribute("role", "img")
  await expect(rangeComponent).toHaveAttribute("aria-label", /Participación 2024/)

  // Marcas arriba (Tu estado) y abajo (Promedio país)
  await expect(rangeComponent.locator(".marker-card--state")).toContainText("53.1 %")
  await expect(rangeComponent.locator(".marker-card--national")).toContainText("59.7 %")

  // Extremos de la barra calculados dinámicamente desde los datos reales 2024
  await expect(rangeComponent.locator(".extreme-box--min")).toContainText("47 %")
  await expect(rangeComponent.locator(".extreme-box--min")).toContainText("Baja California")
  await expect(rangeComponent.locator(".extreme-box--max")).toContainText("71.4 %")
  await expect(rangeComponent.locator(".extreme-box--max")).toContainText("Yucatán")

  // Frase cuando está entre el mínimo y el máximo (BCS)
  await expect(rangeComponent.locator(".range-summary-text")).toHaveText(
    "Solo 3 estados votaron menos que el tuyo.",
  )
  await expect(rangeComponent).toContainText(
    "La barra muestra solo el rango entre los estados; no empieza en cero.",
  )

  // ── Prueba de cambio de estado a MÁXIMO (Yucatán) ──────────────────────
  await select.selectOption("YUC")
  await expect(page.locator(".state-result-card")).toContainText("votaron 7 de cada 10 personas")
  await expect(page.locator(".official-percent-note")).toContainText("71.4 %")
  await expect(rangeComponent.locator(".marker-card--state")).toContainText("71.4 %")
  // Frase generada para el estado máximo
  await expect(rangeComponent.locator(".range-summary-text")).toHaveText(
    "Es el estado con más participación.",
  )

  // ── Prueba de cambio de estado a MÍNIMO (Baja California) ──────────────
  await select.selectOption("BC")
  await expect(page.locator(".state-result-card")).toContainText("votaron 5 de cada 10 personas")
  await expect(page.locator(".official-percent-note")).toContainText("47 %")
  await expect(rangeComponent.locator(".marker-card--state")).toContainText("47 %")
  // Propósito: conteos de personas que votaron y no votaron (Baja California 2024)
  await expect(page.locator(".person-counts")).toContainText("1,396,335")
  await expect(page.locator(".person-counts")).toContainText("1,571,676")
  await expect(page.locator(".person-counts")).toContainText("Yucatán")
  // Frase generada para el estado mínimo
  await expect(rangeComponent.locator(".range-summary-text")).toHaveText(
    "Es el estado con menos participación.",
  )

  // Cambiar de estado no debe volver a descargar los datos
  expect(dashboardRequests).toHaveLength(0)

  // ── 3. Bloque 3: Comparte esto con tu familia ──────────────────────────
  await expect(page.getByRole("heading", { name: "Comparte esto con tu familia" })).toBeVisible()
  const shareBtn = page.getByRole("button", { name: /compartir por whatsapp/i })
  await expect(shareBtn).toBeVisible()
  await shareBtn.click()
  await expect(page.locator(".share-feedback-banner")).toBeVisible()

  // Descarga de imagen
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Descargar imagen" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/voto-2024-BC\.png/)

  // ── 4. Bloque 4: ¿Cómo ha votado el país? ──────────────────────────────
  await expect(
    page.getByRole("heading", { name: /¿Cómo ha votado el país en 15 años?/ }),
  ).toBeVisible()
  await expect(page.locator(".unified-bar-chart .bar-column")).toHaveCount(6)

  // ── 5. Bloque 5: Ver más información (cerrado por defecto) ────────────
  const detailsSummary = page.getByText(/Ver más información y datos técnicos/i)
  await expect(detailsSummary).toBeVisible()
  await detailsSummary.click()

  // Tabla simple de 6 filas (mínimo y máximo por elección, sin cuartiles ni medianas)
  await expect(page.locator(".minmax-table")).toBeVisible()
  await expect(page.locator(".minmax-table tbody tr")).toHaveCount(6)

  // ── 6. Vista para personal del INE (#/ine) ─────────────────────────────
  await page.getByRole("link", { name: /Herramientas para personal del INE/i }).click()
  await expect(page.getByRole("heading", { name: "Para el INE y las 32 Juntas Locales" })).toBeVisible()
  // La gráfica de cuartiles ahora está aquí en la página del INE
  await expect(page.locator(".quartile-section")).toBeVisible()
  await expect(page.locator(".quartile-axis-aligned")).toBeVisible()

  // Regresar
  await page.getByRole("button", { name: /Volver a la página principal/i }).click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText("¿En qué estado vives?")

  // ── 7. Responsive estricto en móvil de 360 px sin scroll horizontal ────
  await page.setViewportSize({ width: 360, height: 740 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)

  // ── 8. Integridad de seguridad y red ───────────────────────────────────
  const networkRequests = externalRequests.filter((url) => !url.startsWith("https://ine.mx"))
  expect(networkRequests).toEqual([])
  expect(consoleErrors).toEqual([])
})
