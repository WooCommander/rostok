import { ref } from 'vue'
import { TipsService } from '../services/TipsService'
import { TipsAdapter, type TipUiModel } from '../adapters/TipsAdapter'

export function useTipsState() {
  const currentTip = ref<TipUiModel>(TipsAdapter.toUiModel(TipsService.getDailyTip()))

  function nextTip() {
    currentTip.value = TipsAdapter.toUiModel(TipsService.getRandomTip())
  }

  return {
    currentTip,
    nextTip
  }
}
