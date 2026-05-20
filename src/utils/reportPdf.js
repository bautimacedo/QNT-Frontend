import jsPDF from 'jspdf'

const BRAND  = [17, 62, 76]
const GRAY   = [100, 116, 139]
const TEXT   = [30, 41, 59]
const BORDER = [226, 232, 240]
const BG     = [248, 250, 252]
const GREEN_BG = [220, 252, 231]; const GREEN_T = [22, 101, 52]
const RED_BG   = [254, 226, 226]; const RED_T   = [153, 27, 27]
const AMBER_BG = [254, 243, 199]; const AMBER_T = [146, 64, 14]

function fmt(val, d = 2) {
  if (val == null) return '—'
  return Number(val).toFixed(d)
}

function formatFecha(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fitDims(naturalW, naturalH, maxW, maxH) {
  const ratio = Math.min(maxW / naturalW, maxH / naturalH)
  return { w: naturalW * ratio, h: naturalH * ratio }
}

/** Fetch + recompresión JPEG. La URL del backend responde 302 a S3; fetch sigue el redirect. */
async function fetchCompressedJpeg(url, quality = 0.72) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(resp.status)
  const blob = await resp.blob()

  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale  = Math.min(1, 1400 / img.naturalWidth)
      canvas.width  = Math.round(img.naturalWidth  * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve({
        data: canvas.toDataURL('image/jpeg', quality),
        w: img.naturalWidth,
        h: img.naturalHeight,
      })
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Genera un PDF del reporte de inspección.
 * @param {Object} inspeccion - DTO de InspeccionAib con campos: tiemposCiclo, velocidad,
 *                              aceleracion, conversion, video, modelo, notas, archivos, estado, gpm, etc.
 * @param {Function} tipoUrlFn - fn(tipo) → URL absoluta al backend que devuelve el archivo (302 a S3).
 */
export async function generatePdfReport(inspeccion, tipoUrlFn) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = 210
  const H    = 297
  const ML   = 15
  const CW   = W - ML * 2
  let y      = 15

  // ── HEADER ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...BRAND)
  doc.text(inspeccion.aibId, ML, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...GRAY)
  doc.text(formatFecha(inspeccion.timestamp), ML, y + 6)

  let metaY = y + 11
  if (inspeccion.modelo) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...TEXT)
    doc.text(`Modelo: ${inspeccion.modelo}`, ML, metaY)
    metaY += 4
  }
  if (inspeccion.notas) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...GRAY)
    doc.text(`Notas: ${inspeccion.notas}`, ML, metaY)
    metaY += 4
  }

  // Estado badge — soporta ON / OFF / INDETERMINADO
  const estado = inspeccion.estado
  let bgCol = AMBER_BG, txtCol = AMBER_T
  if (estado === 'ON')  { bgCol = GREEN_BG; txtCol = GREEN_T }
  if (estado === 'OFF') { bgCol = RED_BG;   txtCol = RED_T }

  const badgeW = estado.length > 3 ? 26 : 14
  doc.setFillColor(...bgCol)
  doc.roundedRect(W - ML - badgeW - 16, y - 5, badgeW, 7, 2, 2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...txtCol)
  doc.text(estado, W - ML - badgeW / 2 - 16, y - 0.3, { align: 'center' })

  if (inspeccion.gpm != null) {
    doc.setFillColor(224, 242, 254)
    doc.roundedRect(W - ML - 14, y - 5, 14, 7, 2, 2, 'F')
    doc.setTextColor(...BRAND)
    doc.text(fmt(inspeccion.gpm, 1) + ' GPM', W - ML - 7, y - 0.3, { align: 'center' })
  }

  y = Math.max(metaY, y + 10)
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(ML, y, W - ML, y)
  y += 6

  // ── MÉTRICAS ─────────────────────────────────────────────────────────────
  const cards = []

  if (inspeccion.tiemposCiclo) {
    cards.push({
      title: 'Tiempos de ciclo',
      rows: [
        ['Subida',     fmt(inspeccion.tiemposCiclo.subidaS) + ' s'],
        ['Bajada',     fmt(inspeccion.tiemposCiclo.bajadaS) + ' s'],
        ['Vel. subida', fmt(inspeccion.tiemposCiclo.subidaInS) + ' in/s'],
        ['Vel. bajada', fmt(inspeccion.tiemposCiclo.bajadaInS) + ' in/s'],
        ['Ratio',       fmt(inspeccion.tiemposCiclo.ratio)],
        ['Confianza',   fmt((inspeccion.tiemposCiclo.confianza ?? 0) * 100, 1) + '%'],
      ],
    })
  }

  if (inspeccion.velocidad) {
    cards.push({
      title: 'Velocidad',
      rows: [
        ['Vel. máx.',  fmt(inspeccion.velocidad.velMaxInS) + ' in/s'],
        ['Vel. RMS',   fmt(inspeccion.velocidad.velRmsInS) + ' in/s'],
        ['Confianza',  fmt((inspeccion.velocidad.confianza ?? 0) * 100, 1) + '%'],
      ],
    })
  }

  if (inspeccion.aceleracion) {
    cards.push({
      title: 'Aceleración',
      rows: [
        ['Acel. máx.', fmt(inspeccion.aceleracion.acelMaxInS2) + ' in/s²'],
      ],
    })
  }

  if (inspeccion.conversion) {
    cards.push({
      title: 'Carrera',
      rows: [
        ['Carrera medida', fmt(inspeccion.conversion.carreraIn) + '"'],
        ['Carrera (px)',   fmt(inspeccion.conversion.carreraPx) + ' px'],
        ['Escala',         fmt(inspeccion.conversion.scaleInPerPx, 4) + ' in/px'],
        ['Confianza',      fmt((inspeccion.conversion.confianza ?? 0) * 100, 1) + '%'],
      ],
    })
  }

  if (cards.length) {
    const cols = Math.min(cards.length, 4)
    const GAP  = 3.5
    const cW   = (CW - GAP * (cols - 1)) / cols
    const ROW  = 5.2
    const PAD  = 3
    const TH   = 7.5
    const maxRows = Math.max(...cards.map(c => c.rows.length))
    const cardH   = TH + maxRows * ROW + PAD * 2

    cards.forEach((card, i) => {
      const cx = ML + i * (cW + GAP)
      doc.setFillColor(...BG)
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.2)
      doc.roundedRect(cx, y, cW, cardH, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...GRAY)
      doc.text(card.title.toUpperCase(), cx + PAD, y + 4.8)

      card.rows.forEach((row, ri) => {
        const ry = y + TH + ri * ROW
        if (ri > 0) {
          doc.setDrawColor(241, 245, 249); doc.setLineWidth(0.12)
          doc.line(cx + PAD, ry - 1, cx + cW - PAD, ry - 1)
        }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...GRAY)
        doc.text(row[0], cx + PAD, ry + 3)
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...TEXT)
        doc.text(row[1], cx + cW - PAD, ry + 3, { align: 'right' })
      })
    })

    y += cardH + 8
  }

  // ── GRÁFICOS ─────────────────────────────────────────────────────────────
  const archivos = inspeccion.archivos || {}

  const chartDefs = [
    { label: 'Posición (pulgadas)',    tipo: 'grafico_posicion_pulgadas',    main: true  },
    { label: 'Velocidad',              tipo: 'grafico_velocidad_pulgadas',   main: true  },
    { label: 'Aceleración (pulgadas)', tipo: 'grafico_aceleracion_pulgadas', main: false },
    { label: 'Tiempos de ciclo',       tipo: 'grafico_tiempos_ciclo',        main: false },
    { label: 'Señal procesada',        tipo: 'grafico_detecciones_raw',      main: false },
    { label: 'Captura anotada',        tipo: 'captura',                      main: false },
  ].filter(c => archivos[c.tipo])

  if (chartDefs.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...BRAND)
    doc.text('Gráficos', ML, y)
    y += 5

    const imgs = {}
    await Promise.allSettled(
      chartDefs.map(async c => {
        try {
          imgs[c.tipo] = await fetchCompressedJpeg(tipoUrlFn(c.tipo))
        } catch (_) { /* skip */ }
      })
    )

    const LABEL_H = 6

    // Fila 1: main charts a 2 columnas
    const mainCharts = chartDefs.filter(c => c.main && imgs[c.tipo])
    if (mainCharts.length) {
      const cols    = mainCharts.length
      const gapMain = cols > 1 ? 4 : 0
      const iW      = (CW - gapMain * (cols - 1)) / cols
      const maxH    = 58

      let rowH = 0
      for (let i = 0; i < mainCharts.length; i++) {
        const c   = mainCharts[i]
        const cx  = ML + i * (iW + gapMain)
        const img = imgs[c.tipo]
        if (!img) continue
        const { w, h } = fitDims(img.w, img.h, iW - 2, maxH - 2)
        rowH = Math.max(rowH, h + LABEL_H + 2)

        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
        doc.roundedRect(cx, y, iW, h + LABEL_H + 2, 2, 2, 'FD')

        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(71, 85, 105)
        doc.text(c.label, cx + 3, y + 4.5)

        doc.addImage(img.data, 'JPEG', cx + 1, y + LABEL_H, w, h)
      }
      y += rowH + 4
    }

    const secCharts = chartDefs.filter(c => !c.main && imgs[c.tipo])
    if (secCharts.length) {
      const cols   = 3
      const gapSec = 4
      const iW     = (CW - gapSec * (cols - 1)) / cols
      const maxH   = 46

      for (let row = 0; row < Math.ceil(secCharts.length / cols); row++) {
        const slice = secCharts.slice(row * cols, (row + 1) * cols)
        let rowH = 0

        for (let i = 0; i < slice.length; i++) {
          const c   = slice[i]
          const cx  = ML + i * (iW + gapSec)
          const img = imgs[c.tipo]
          if (!img) continue
          const { w, h } = fitDims(img.w, img.h, iW - 2, maxH - 2)
          rowH = Math.max(rowH, h + LABEL_H + 2)

          doc.setFillColor(255, 255, 255)
          doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
          doc.roundedRect(cx, y, iW, h + LABEL_H + 2, 2, 2, 'FD')

          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(71, 85, 105)
          doc.text(c.label, cx + 3, y + 4.5)

          doc.addImage(img.data, 'JPEG', cx + 1, y + LABEL_H, w, h)
        }
        y += rowH + 4
      }
    }
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.line(ML, H - 12, W - ML, H - 12)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...GRAY)
  doc.text('QNT Drones — Reporte de Inspección AIB', ML, H - 7)
  doc.text(new Date().toLocaleDateString('es-AR'), W - ML, H - 7, { align: 'right' })

  const filename = `inspeccion-${inspeccion.aibId}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
