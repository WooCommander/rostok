import type { TreatmentEntry } from './JournalService'

const CARE_LABELS: Record<string, string> = {
  watering: 'Полив',
  fertilizing: 'Удобрение',
  spraying: 'Опрыскивание',
  pruning: 'Обрезка',
  other: 'Другое'
}

function getPlantNames(entry: TreatmentEntry): string {
  if (entry.plants_data && entry.plants_data.length > 0) {
    return entry.plants_data
      .map(p => p.location_note ? `${p.name} (${p.location_note})` : p.name)
      .join(', ')
  }
  const name = entry.user_plant?.nickname || entry.plant?.name || '—'
  const loc = entry.user_plant?.location_note
  return loc ? `${name} (${loc})` : name
}

function escapeCSV(val: string | null | undefined): string {
  if (val == null || val === '') return ''
  const s = String(val)
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

// ── CSV ──────────────────────────────────────────────
export function generateCSV(entries: TreatmentEntry[]): string {
  const header = ['Дата', 'Тип ухода', 'Растения', 'Препарат', 'Доза', 'Температура (°C)', 'Заметки']
  const rows = entries.map(e => [
    e.treated_at,
    CARE_LABELS[e.care_type] || e.care_type,
    getPlantNames(e),
    e.product || '',
    e.dose || '',
    e.temperature != null ? String(e.temperature) : '',
    e.notes || ''
  ].map(escapeCSV).join(';'))

  return [header.join(';'), ...rows].join('\n')
}

export async function exportCSV(entries: TreatmentEntry[], filename = 'journal_rostok.csv'): Promise<void> {
  const csv = generateCSV(entries)
  const bom = '﻿' // UTF-8 BOM для Excel
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })

  // Web Share API (Android / iOS Safari)
  if (navigator.canShare) {
    const file = new File([blob], filename, { type: 'text/csv' })
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Журнал ухода Rostok' })
      return
    }
  }

  // Fallback — обычное скачивание
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF (через print) ─────────────────────────────────
export function exportPDF(entries: TreatmentEntry[]): void {
  const rows = entries.map(e => {
    const plants = escapeHtml(getPlantNames(e))
    const type = CARE_LABELS[e.care_type] || e.care_type
    const product = e.product ? `<span class="product">${escapeHtml(e.product)}${e.dose ? ` · ${escapeHtml(e.dose)}` : ''}</span>` : ''
    const meta: string[] = []
    if (e.temperature != null) meta.push(`🌡 ${e.temperature}°C`)
    if (e.notes) meta.push(escapeHtml(e.notes))

    return `
      <tr>
        <td class="date">${escapeHtml(e.treated_at)}</td>
        <td><span class="badge badge-${e.care_type}">${type}</span></td>
        <td>${plants}</td>
        <td>${product}</td>
        <td class="meta">${meta.join('<br>')}</td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <title>Журнал ухода — Rostok</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 20mm 15mm; }
    h1 { font-size: 20px; font-weight: 700; color: #2D6A4F; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #2D6A4F; color: white; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    .date { white-space: nowrap; color: #555; font-size: 11px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; }
    .badge-watering    { background: #dbeafe; color: #1e40af; }
    .badge-fertilizing { background: #fef3c7; color: #92400e; }
    .badge-spraying    { background: #fee2e2; color: #991b1b; }
    .badge-pruning     { background: #d1fae5; color: #065f46; }
    .badge-other       { background: #f3f4f6; color: #374151; }
    .product { color: #2D6A4F; font-weight: 600; }
    .meta { font-size: 11px; color: #666; }
    @media print {
      body { padding: 0; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <h1>🌱 Журнал ухода</h1>
  <div class="subtitle">Экспортировано из приложения Rostok · ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} · ${entries.length} записей</div>
  <table>
    <thead>
      <tr>
        <th>Дата</th>
        <th>Тип</th>
        <th>Растения</th>
        <th>Препарат / Доза</th>
        <th>Заметки</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  // Небольшая задержка чтобы шрифты и стили успели применится
  setTimeout(() => { win.print() }, 300)
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
