import type { EnrichedReminder } from '../services/ReminderService'

export interface ReminderUiModel {
  id: string
  careType: string
  title: string
  emoji: string
  productAndDose: string
  remindAtDisplay: string
  raw: EnrichedReminder
}

export const RemindersAdapter = {
  toUiModel(item: EnrichedReminder): ReminderUiModel {
    const typeLabels: Record<string, string> = {
      fertilizing: 'Повторная подкормка',
      spraying: 'Повторное опрыскивание',
      watering: 'Очередной полив',
      pruning: 'Обрезка',
      other: 'Обработка'
    }

    const careLabel = typeLabels[item.careType] || 'Обработка'
    const plantName = item.userPlant?.nickname || item.plant?.name || 'Растение'
    const locNote = item.userPlant?.location_note ? ` (${item.userPlant.location_note})` : ''
    const emoji = item.plant?.emoji || '🌱'

    const parts: string[] = []
    if (item.product) parts.push(item.product)
    if (item.dose) parts.push(item.dose)
    const productAndDose = parts.join(' · ') || 'Без указания препарата'

    let remindDisplay = item.remindAtDate
    try {
      const d = new Date(item.remindAtDate)
      remindDisplay = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    } catch {}

    return {
      id: item.id,
      careType: item.careType,
      title: `${careLabel}: ${plantName}${locNote}`,
      emoji,
      productAndDose,
      remindAtDisplay: `Запланировано на ${remindDisplay}`,
      raw: item
    }
  }
}
