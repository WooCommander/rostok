import { agronomicTipsData, type AgronomicTip } from '../data/tipsData'

export const TipsService = {
  getDailyTip(): AgronomicTip {
    const dateStr = new Date().toISOString().split('T')[0]
    let hash = 0
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash << 5) - hash + dateStr.charCodeAt(i)
      hash |= 0
    }
    const index = Math.abs(hash) % agronomicTipsData.length
    return agronomicTipsData[index]
  },

  getRandomTip(): AgronomicTip {
    const randomIndex = Math.floor(Math.random() * agronomicTipsData.length)
    return agronomicTipsData[randomIndex]
  },

  getAllTips(): AgronomicTip[] {
    return agronomicTipsData
  }
}
