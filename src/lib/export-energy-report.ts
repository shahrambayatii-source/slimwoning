'use client'

import jsPDF from 'jspdf'

type RGB = [number, number, number]

const PAGE_BG: RGB = [246, 248, 252]
const WHITE: RGB = [255, 255, 255]
const NAVY: RGB = [11, 31, 77]
const MUTED: RGB = [107, 114, 128]
const BORDER: RGB = [226, 232, 240]
const GREEN: RGB = [0, 122, 85]
const BLUE: RGB = [36, 83, 255]
const RED: RGB = [220, 38, 38]
const PURPLE: RGB = [124, 58, 237]
const SOFT_GREEN: RGB = [238, 249, 244]
const SOFT_BLUE: RGB = [245, 248, 255]
const SOFT_RED: RGB = [254, 242, 242]
const SOFT_PURPLE: RGB = [250, 245, 255]
const SOFT_ORANGE: RGB = [255, 247, 237]

const FORM_OR_UI_LINES = new Set([
  '×',
  'x',
  'ja',
  'nee',
  'kies type',
  'download pdf',
  'sluiten',
  'herbereken energiescan',
  'vul ontbrekende renovatiedata aan',
  'aanvullende informatie',
  'bouwjaar',
  'laatste renovatiejaar',
  'dak geïsoleerd?',
  'dak geisoleerd?',
  'isolatie aanwezig?',
  'hr-glas aanwezig?',
  'ramen vervangen?',
  'dak vernieuwd?',
  'type verwarming',
  'gas',
  'elektrisch',
  'warmtepomp',
  'mazout',
])

const SECTION_HEADINGS = new Set([
  'AI SAMENVATTING',
  'BESCHIKBARE ENERGIEDATA',
  'EPC-TRAJECT',
  'ENERGIE-INSCHATTING',
  'BELANGRIJKSTE AANDACHTSPUNT',
  'BETROUWBAARHEID',
  'TOEKOMSTBESTENDIGHEID',
  'ENERGIERISICO',
  'VERWACHTE ENERGIEBESPARING',
  'MOGELIJKE EPC-VERBETERING',
  'ADVIESNIVEAU',
  'VERWARMING',
  'WAARDEPOTENTIEEL',
  'MOGELIJKE PREMIES',
  'WAT MOET GECONTROLEERD WORDEN?',
  'WAAROM IS DIT GEEN DEFINITIEVE OFFERTE?',
])

function sanitizeFileName(fileName: string) {
  return (
    String(fileName || 'energie-report')
      .trim()
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'energie-report'
  )
}

function cleanReportText(text: string) {
  return text
    .replace(/Download PDF/gi, '')
    .replace(/Sluiten/gi, '')
    .replace(/Herbereken energiescan/gi, '')
    .replace(/PDF CLICKED/gi, '')
    .replace(/[!’→]/g, '')
    .replace(/×/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function isUiOnlyLine(line: string) {
  const normalized = line.trim().toLowerCase()

  if (!normalized) return true
  if (FORM_OR_UI_LINES.has(normalized)) return true
  if (/^[0-9]{4}$/.test(normalized)) return true
  if (/^[a-g][+]{0,5}$/i.test(normalized)) return true
  if (/^\d+$/.test(normalized)) return true
  if (normalized === 'aanbevolen') return true

  return false
}

function getTextLines(element: HTMLElement) {
  return cleanReportText(element.innerText || element.textContent || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !isUiOnlyLine(line))
}

function extractSection(lines: string[], heading: string) {
  const start = lines.findIndex((line) => line.toLowerCase() === heading.toLowerCase())
  if (start === -1) return ''

  const content: string[] = []

  for (let index = start + 1; index < lines.length; index += 1) {
    const nextLine = lines[index]
    if (SECTION_HEADINGS.has(nextLine.toUpperCase())) break
    if (!isUiOnlyLine(nextLine)) content.push(nextLine)
  }

  return content.join(' ').replace(/\s+/g, ' ').trim()
}

function cleanSectionBody(title: string, body: string) {
  let cleanBody = body
    .replace(/\s+/g, ' ')
    .replace(/\b[A-G][+]{0,5}\b\s*mogelij?k richting/gi, 'Mogelijk richting')
    .replace(/\b[A-G][+]{0,5}\b\s*$/gi, '')
    .replace(/^\d+\s+/g, '')
    .replace(/\s+Aanbevolen$/gi, '')
    .trim()

  if (title.toLowerCase() === 'epc-traject') {
    cleanBody = cleanBody
      .replace(/\s*mogelij?k richting A$/i, '')
      .replace(/\s*mogelijk richting A$/i, '')
      .trim()
  }

  return cleanBody
}

function firstValue(value: string) {
  const cleanValue = value.replace(/\s+/g, ' ').trim()
  const knownValues = [
    'Interessant renovatiepotentieel',
    'Wettelijk relevant',
    'Gemiddeld',
    'Informatief',
    'Aanbevolen',
    'Belangrijk',
    'Beperkt',
    'Merkbaar',
    'Groot',
    'Hoog',
    'Laag',
  ]

  const match = knownValues.find((item) =>
    cleanValue.toLowerCase().startsWith(item.toLowerCase())
  )

  if (match) return match

  return cleanValue.split(/[.!?]/)[0]?.trim() || '-'
}

function extractEpcValue(lines: string[]) {
  const joined = lines.join(' ')
  const match = joined.match(/Huidige EPC:\s*([A-G][+]{0,5})/i)
  if (match?.[1]) return match[1].toUpperCase()

  const looseMatch = joined.match(/\bEPC\s*:?\s*([A-G][+]{0,5})\b/i)
  return looseMatch?.[1]?.toUpperCase() || ''
}

function getCleanTitle(lines: string[], fallback: string) {
  const title = lines.find((line) => {
    const normalized = line.toLowerCase()
    return (
      normalized !== 'energiescan' &&
      !SECTION_HEADINGS.has(line.toUpperCase()) &&
      !normalized.includes('dit is geen offerte') &&
      !normalized.includes('indicatieve scan')
    )
  })

  return (title || fallback).replace(/rapport|energiescan/gi, '').trim() || fallback
}

function addWrappedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const lines = pdf.splitTextToSize(text || '-', maxWidth)
  lines.forEach((line: string) => {
    pdf.text(line, x, y)
    y += lineHeight
  })
  return y
}

function ensurePage(
  pdf: jsPDF,
  y: number,
  requiredHeight: number,
  pageHeight: number,
  margin: number,
  drawPageBackground: () => void
) {
  if (y + requiredHeight <= pageHeight - margin) return y

  pdf.addPage()
  drawPageBackground()
  return margin
}

function addKpiCard(
  pdf: jsPDF,
  options: {
    x: number
    y: number
    width: number
    title: string
    value: string
    accent: RGB
    background: RGB
  }
) {
  const { x, y, width, title, value, accent, background } = options

  pdf.setFillColor(...background)
  pdf.setDrawColor(...accent)
  pdf.setLineWidth(0.35)
  pdf.roundedRect(x, y, width, 24, 4, 4, 'FD')

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...accent)
  pdf.setFontSize(7.4)
  pdf.text(title.toUpperCase(), x + 5, y + 8)

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...NAVY)
  pdf.setFontSize(13)
  pdf.text(String(value || '-').slice(0, 22), x + 5, y + 17)

  return y + 24
}

function addFullWidthCard(
  pdf: jsPDF,
  options: {
    x: number
    y: number
    width: number
    title: string
    body: string
    accent?: RGB
    background?: RGB
  }
) {
  const {
    x,
    y,
    width,
    title,
    body,
    accent = NAVY,
    background = WHITE,
  } = options
  const padding = 7
  const bodyLines = pdf.splitTextToSize(body || '-', width - padding * 2)
  const height = Math.max(28, 19 + bodyLines.length * 5.2 + padding)

  pdf.setFillColor(...background)
  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(0.35)
  pdf.roundedRect(x, y, width, height, 4, 4, 'FD')

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...accent)
  pdf.setFontSize(9)
  pdf.text(title, x + padding, y + 9)

  pdf.setDrawColor(...accent)
  pdf.setLineWidth(0.55)
  pdf.line(x + padding, y + 13, x + padding + 13, y + 13)

  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(55, 65, 81)
  pdf.setFontSize(8.8)

  let textY = y + 20
  bodyLines.forEach((line: string) => {
    pdf.text(line, x + padding, textY)
    textY += 5.2
  })

  return y + height
}

function addFullWidthCardFromLines(
  pdf: jsPDF,
  options: {
    x: number
    y: number
    width: number
    title: string
    lines: string[]
    accent?: RGB
    background?: RGB
  }
) {
  const {
    x,
    y,
    width,
    title,
    lines,
    accent = NAVY,
    background = WHITE,
  } = options
  const padding = 7
  const height = Math.max(28, 19 + lines.length * 5.2 + padding)

  pdf.setFillColor(...background)
  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(0.35)
  pdf.roundedRect(x, y, width, height, 4, 4, 'FD')

  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...accent)
  pdf.setFontSize(9)
  pdf.text(title, x + padding, y + 9)

  pdf.setDrawColor(...accent)
  pdf.setLineWidth(0.55)
  pdf.line(x + padding, y + 13, x + padding + 13, y + 13)

  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(55, 65, 81)
  pdf.setFontSize(8.8)

  let textY = y + 20
  lines.forEach((line: string) => {
    pdf.text(line, x + padding, textY)
    textY += 5.2
  })

  return y + height
}

function buildSections(lines: string[]) {
  const sections: Array<[string, string, RGB, RGB]> = [
    ['Beschikbare energiedata', cleanSectionBody('Beschikbare energiedata', extractSection(lines, 'Beschikbare energiedata')), NAVY, WHITE],
    ['EPC-traject', cleanSectionBody('EPC-traject', extractSection(lines, 'EPC-traject')), BLUE, SOFT_BLUE],
    ['Belangrijkste aandachtspunt', cleanSectionBody('Belangrijkste aandachtspunt', extractSection(lines, 'Belangrijkste aandachtspunt')), [180, 83, 9], SOFT_ORANGE],
    ['Betrouwbaarheid', cleanSectionBody('Betrouwbaarheid', extractSection(lines, 'Betrouwbaarheid')), BLUE, SOFT_BLUE],
    ['Verwachte energiebesparing', cleanSectionBody('Verwachte energiebesparing', extractSection(lines, 'Verwachte energiebesparing')), BLUE, SOFT_BLUE],
    ['Mogelijke EPC-verbetering', cleanSectionBody('Mogelijke EPC-verbetering', extractSection(lines, 'Mogelijke EPC-verbetering')), [180, 83, 9], SOFT_ORANGE],
    ['Verwarming', cleanSectionBody('Verwarming', extractSection(lines, 'Verwarming')), NAVY, WHITE],
    ['Waardepotentieel', cleanSectionBody('Waardepotentieel', extractSection(lines, 'Waardepotentieel')), PURPLE, SOFT_PURPLE],
    ['Wat moet gecontroleerd worden?', cleanSectionBody('Wat moet gecontroleerd worden?', extractSection(lines, 'Wat moet gecontroleerd worden?')), NAVY, WHITE],
    ['Mogelijke premies', cleanSectionBody('Mogelijke premies', extractSection(lines, 'Mogelijke premies')), GREEN, SOFT_GREEN],
    ['Waarom is dit geen definitieve offerte?', cleanSectionBody('Waarom is dit geen definitieve offerte?', extractSection(lines, 'Waarom is dit geen definitieve offerte?')), [194, 65, 12], SOFT_ORANGE],
  ]

  return sections.filter(([, body]) => Boolean(body))
}

export async function exportEnergyReport(
  elementId: string,
  fileName: string
) {
  try {
    const element = document.getElementById(elementId)

    if (!element) {
      console.error('PDF element not found:', elementId)
      alert('PDF content niet gevonden')
      return
    }

    const lines = getTextLines(element)

    if (lines.length === 0) {
      alert('PDF content is leeg')
      return
    }

    const safeFileName = sanitizeFileName(fileName)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 14
    const contentWidth = pageWidth - margin * 2
    const cleanTitle = getCleanTitle(lines, safeFileName)
    const epcValue = extractEpcValue(lines)

    function drawPageBackground() {
      pdf.setFillColor(...PAGE_BG)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')
    }

    function drawHeader() {
      drawPageBackground()

      pdf.setFillColor(...WHITE)
      pdf.roundedRect(margin, 12, contentWidth, 22, 5, 5, 'F')

      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...NAVY)
      pdf.setFontSize(14)
      pdf.text('SlimWoning', margin + 6, 25)

      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(204, 102, 0)
      pdf.setFontSize(9)
      pdf.text('ENERGIESCAN RAPPORT', pageWidth - margin - 54, 21)

      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...MUTED)
      pdf.setFontSize(8)
      pdf.text(new Date().toLocaleDateString('nl-BE'), pageWidth - margin - 54, 27)
    }

    drawHeader()

    let y = 46

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(24)
    pdf.setTextColor(...NAVY)
    const titleLines = pdf.splitTextToSize(cleanTitle, contentWidth)
    titleLines.slice(0, 2).forEach((line: string) => {
      pdf.text(line, margin, y)
      y += 10
    })

    y += 2

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(...MUTED)

    y = addWrappedText(
      pdf,
      'Dit is geen offerte. Dit is een indicatieve scan op basis van de beschikbare woningdata en is niet definitief.',
      margin,
      y,
      contentWidth,
      6
    )

    y += 18

    const summary = extractSection(lines, 'AI Samenvatting') || 'Onvoldoende gegevens beschikbaar voor een betrouwbare inschatting.'
    y = ensurePage(pdf, y, 34, pageHeight, margin, drawPageBackground)
    y = addFullWidthCard(pdf, {
      x: margin,
      y,
      width: contentWidth,
      title: 'AI Samenvatting',
      body: summary,
      accent: NAVY,
      background: WHITE,
    })

    y += 10

    const cardGap = 5
    const cardWidth = (contentWidth - cardGap * 3) / 4

    addKpiCard(pdf, {
      x: margin,
      y,
      width: cardWidth,
      title: 'EPC',
      value: epcValue || '-',
      accent: GREEN,
      background: SOFT_GREEN,
    })

    addKpiCard(pdf, {
      x: margin + cardWidth + cardGap,
      y,
      width: cardWidth,
      title: 'Risico',
      value: firstValue(extractSection(lines, 'Energierisico')),
      accent: RED,
      background: SOFT_RED,
    })

    addKpiCard(pdf, {
      x: margin + (cardWidth + cardGap) * 2,
      y,
      width: cardWidth,
      title: 'Toekomst',
      value: firstValue(extractSection(lines, 'Toekomstbestendigheid')),
      accent: BLUE,
      background: SOFT_BLUE,
    })

    addKpiCard(pdf, {
      x: margin + (cardWidth + cardGap) * 3,
      y,
      width: cardWidth,
      title: 'Advies',
      value: firstValue(extractSection(lines, 'Adviesniveau')),
      accent: PURPLE,
      background: SOFT_PURPLE,
    })

    y += 36

    for (const [sectionTitle, sectionBody, accent, background] of buildSections(lines)) {
      const bodyLines = pdf.splitTextToSize(sectionBody || '-', contentWidth - 14) as string[]
      let remainingLines = bodyLines.length ? bodyLines : ['-']
      let isContinuation = false

      while (remainingLines.length > 0) {
        const availableHeight = pageHeight - margin - y
        const maxLines = Math.max(4, Math.floor((availableHeight - 30) / 5.2))

        if (availableHeight < 48) {
          pdf.addPage()
          drawPageBackground()
          y = margin
          continue
        }

        const chunk = remainingLines.slice(0, maxLines)
        remainingLines = remainingLines.slice(maxLines)

        const estimatedHeight = Math.max(28, 26 + chunk.length * 5.2)
        y = ensurePage(pdf, y, estimatedHeight + 6, pageHeight, margin, drawPageBackground)
        y = addFullWidthCardFromLines(pdf, {
          x: margin,
          y,
          width: contentWidth,
          title: isContinuation ? `${sectionTitle} (vervolg)` : sectionTitle,
          lines: chunk,
          accent,
          background,
        })
        y += 7
        isContinuation = true
      }
    }

    y = ensurePage(pdf, y, 48, pageHeight, margin, drawPageBackground)

    pdf.setFillColor(...NAVY)
    pdf.roundedRect(margin, y, contentWidth, 18, 4, 4, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(10)
    pdf.text('Professionele energiescan beschikbaar via SlimWoning.be', margin + 6, y + 11)

    y += 24

    pdf.setFillColor(...SOFT_ORANGE)
    pdf.setDrawColor(251, 191, 36)
    pdf.roundedRect(margin, y, contentWidth, 24, 4, 4, 'FD')
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(124, 45, 18)
    pdf.setFontSize(8.8)
    addWrappedText(
      pdf,
      'Voor een echte offerte zijn exacte renovatiegegevens, plaatsbezoek en metingen nodig. Premies, regelgeving en voorwaarden moeten altijd apart gecontroleerd worden.',
      margin + 6,
      y + 9,
      contentWidth - 12,
      5
    )

    const totalPages = pdf.getNumberOfPages()
    for (let index = 1; index <= totalPages; index += 1) {
      pdf.setPage(index)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(120, 130, 145)
      pdf.text(`SlimWoning EnergieScan · pagina ${index} van ${totalPages}`, margin, pageHeight - 8)
      pdf.text('SlimWoning.be', pageWidth - margin - 26, pageHeight - 8)
    }

    pdf.save(`${safeFileName}-energiescan.pdf`)
  } catch (error) {
    console.error('PDF export failed:', error)
    alert('PDF export mislukt')
  }
}
