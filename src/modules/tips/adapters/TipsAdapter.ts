import type { AgronomicTip } from '../data/tipsData'

export interface TipUiModel {
  id: string
  title: string
  content: string
  bullets?: string[]
  categoryBadge: string
  emoji: string
  author: string
}

export const TipsAdapter = {
  toUiModel(item: AgronomicTip): TipUiModel {
    const catLabels: Record<string, string> = {
      soil: 'Почва и питание',
      water: 'Правила полива',
      protect: 'Биозащита',
      harvest: 'Формирование урожая',
      general: 'Агрономия'
    }

    return {
      id: item.id,
      title: item.title,
      content: item.content,
      bullets: item.bullets,
      categoryBadge: catLabels[item.category] || 'Совет агронома',
      emoji: item.emoji,
      author: item.author || 'Агроном Rostok'
    }
  }
}
