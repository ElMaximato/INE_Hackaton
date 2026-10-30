# Revisión del proyecto (30-oct-2026)

## Corregido
- App.tsx: los datos se volvían a descargar en cada cambio de estado (el efecto dependía de `selectedCode`).
- El TopoJSON se descarga una vez por sesión; el mapa ya no se redibuja por un callback nuevo en cada render.
- Rutas `/data/...` absolutas → relativas a `BASE_URL` (+ `base: "./"` en Vite).
- Promedio nacional `59.7 %` escrito a mano en App y en la ficha PNG → se toma de los datos.
- Texto «¿Qué significa esto?» contradecía a la comparación con el país (estados 5–7 puntos bajo el promedio decían «rango promedio») y tenía una rama imposible (<5 de 10) con una afirmación sin sustento. Ahora depende del dato y de la comparación.
- Copy «de cada 100 con credencial» contradecía la metodología (la lista nominal no es denominador).
- Ranking con empates (Nayarit y Guanajuato, 55.8 %) ahora comparte lugar.
- `stat.voters ? … : "Dato pendiente"` trataba 0 como pendiente.
- «Solo N estados votaron más»: faltaba «Solo» en plural.
- e2e: la frase esperada para BCS no coincidía con la lógica real (la prueba fallaba); se agregó verificación de no re-descarga.
- InePage anunciaba «cuartiles» en el Excel pero no los incluía; ahora hay hoja de cuartiles.
- Suma de composición 99/101 % explicada en la gráfica.
- Gestor de paquetes unificado en pnpm (README, SEGURIDAD, CONTEXTO, Playwright, script audit). Se elimina `package-lock.json` (obsoleto: no aplicaba el override de uuid).
- Eliminados: IneTools.tsx, Tooltip.tsx, Timeline.tsx, SectionHeading.tsx (código muerto) y el zip anidado.
- `perTen` y `recordForYear` centralizados en `src/lib/electoral.ts` (con pruebas).
- `SITE_URL` ya no inventa el dominio `15anosdetuvoto.ine.mx`; usa `VITE_SITE_URL` o el origen actual.
- Textos que presentaban el sitio como publicación oficial del INE se ajustaron a «datos oficiales del INE».

## Pendiente (no verificado por no poder compilar en este entorno)
- Ejecutar `pnpm install && pnpm run check && pnpm run build && pnpm run test:e2e`.
- Mapa: las 32 etiquetas de 11 px se encimarán en estados pequeños (CDMX, Morelos, Tlaxcala); revisar visualmente.
- Revisar contraste AA de los cuatro tonos del mapa y de los textos sobre ellos.
- El «X de cada 10» redondea (54.5 → 5, 55.4 → 6); considerar mostrar «de cada 100».
- `.gitattributes` manda zip/pdf/png/fuentes a Git LFS; confirmar que el repositorio lo usa.
