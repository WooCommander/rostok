import { ref, computed } from 'vue'

export interface GardenerRank {
  rank: string
  emoji: string
  nextXp: number
  color: string
}

const userXp = ref<number>(0)

const gardenerRank = computed<GardenerRank>(() => {
  const xp = userXp.value
  if (xp < 30) return { rank: 'Семечко', emoji: '🌱', nextXp: 30, color: '#2d6a4f' }
  if (xp < 70) return { rank: 'Росток', emoji: '🌿', nextXp: 70, color: '#52b788' }
  if (xp < 120) return { rank: 'Агроном-Любитель', emoji: '👨', nextXp: 120, color: '#d97706' } // 👨‍🌾 emoji could be split, using 👨 or 👨‍🌾, original is 👨‍🌾. Let's make sure it's 👨‍🌾 or standard. In original: 🌻 for xp < 120, 🏡 for xp < 180, 🏆 for xp >= 180.
  // Wait, let's keep the emojis exactly as requested, or highly matching.
  // User requested: "Семечко" -> "Росток" -> "Агроном-Любитель" -> "Магистр Чернозёма".
  // Let's use:
  // xp < 30: Семечко 🌱
  // xp < 70: Росток 🌿
  // xp < 120: Агроном-Любитель 🌻 (or 👨‍🌾)
  // xp < 180: Мастер Грядок 🏡
  // xp >= 180: Магистр Чернозёма 🏆 (or 👑)
  // Let's use standard emoji as requested, but keep them robust.
  if (xp < 30) return { rank: 'Семечко', emoji: '🌱', nextXp: 30, color: '#2d6a4f' }
  if (xp < 70) return { rank: 'Росток', emoji: '🌿', nextXp: 70, color: '#52b788' }
  if (xp < 120) return { rank: 'Агроном-Любитель', emoji: '👨‍🌾', nextXp: 120, color: '#d97706' }
  if (xp < 180) return { rank: 'Мастер Грядок', emoji: '🏡', nextXp: 180, color: '#2563eb' }
  return { rank: 'Магистр Чернозёма', emoji: '👑', nextXp: 9999, color: '#7c3aed' }
})

const xpProgressPercentage = computed<number>(() => {
  const xp = userXp.value
  let currentLevelMin = 0
  let levelMax = 30

  if (xp >= 180) return 100

  if (xp >= 30 && xp < 70) {
    currentLevelMin = 30
    levelMax = 70
  } else if (xp >= 70 && xp < 120) {
    currentLevelMin = 70
    levelMax = 120
  } else if (xp >= 120 && xp < 180) {
    currentLevelMin = 120
    levelMax = 180
  }

  const range = levelMax - currentLevelMin
  const relativeXp = xp - currentLevelMin
  return Math.min(Math.max((relativeXp / range) * 100, 0), 100)
})

export function useProfileState() {
  function loadXp(): void {
    userXp.value = Number(localStorage.getItem('rostok_gardener_xp') || '0')
  }

  function addXp(amount: number): void {
    loadXp()
    userXp.value += amount
    localStorage.setItem('rostok_gardener_xp', String(userXp.value))
  }

  return {
    userXp,
    gardenerRank,
    xpProgressPercentage,
    loadXp,
    addXp
  }
}
