import { ref } from 'vue'
import { TipsService } from '../services/TipsService'
import { TipsAdapter, type TipUiModel } from '../adapters/TipsAdapter'

const savedTipIds = ref<string[]>(JSON.parse(localStorage.getItem('rostok_saved_tips') || '[]'))

export function useTipsState() {
  const currentTip = ref<TipUiModel>(TipsAdapter.toUiModel(TipsService.getDailyTip()))

  function nextTip() {
    currentTip.value = TipsAdapter.toUiModel(TipsService.getRandomTip())
  }

  function toggleSaveTip(id: string) {
    const set = new Set(savedTipIds.value)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    savedTipIds.value = Array.from(set)
    localStorage.setItem('rostok_saved_tips', JSON.stringify(savedTipIds.value))
  }

  function isSaved(id: string): boolean {
    return savedTipIds.value.includes(id)
  }

  function getSavedTips(): TipUiModel[] {
    const all = TipsService.getAllTips()
    return all.filter(t => savedTipIds.value.includes(t.id)).map(t => TipsAdapter.toUiModel(t))
  }

  return {
    currentTip,
    savedTipIds,
    nextTip,
    toggleSaveTip,
    isSaved,
    getSavedTips
  }
}
