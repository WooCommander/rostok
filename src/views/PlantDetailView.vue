<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, Bookmark, BookmarkCheck, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Lightbulb, Ban } from 'lucide-vue-next'
import { PlantService, type Plant, type PlantCare, type PlantSecret } from '@/modules/plants/services/PlantService'
import { authStore } from '@/modules/auth/store/authStore'
import FpPaywallModal from '@/design-system/components/FpPaywallModal.vue'
import { helpArticles } from '@/modules/help/data/helpData'
import { TestTube, Sprout, ShieldAlert, RefreshCw, Leaf, Droplets, BookOpen } from 'lucide-vue-next'

const showPaywall = ref(false)

const route = useRoute()
const router = useRouter()

const plant = ref<Plant | null>(null)
const careList = ref<PlantCare[]>([])
const secretsList = ref<PlantSecret[]>([])
const activeTab = ref<'care' | 'secrets' | 'facts' | 'myths'>('care')

const filteredSecrets = computed(() => secretsList.value.filter(s => s.secret_type !== 'fact' && s.secret_type !== 'myth'))
const filteredFacts = computed(() => secretsList.value.filter(s => s.secret_type === 'fact'))
const filteredMyths = computed(() => secretsList.value.filter(s => s.secret_type === 'myth'))

const relatedArticles = computed(() => {
  if (!plant.value) return []
  return helpArticles.filter(a => a.relatedPlants?.includes(plant.value!.id))
})

const getIcon = (iconName?: string) => {
    if (!iconName) return BookOpen
    const icons: Record<string, any> = {
        TestTube, Sprout, ShieldAlert, RefreshCw, Leaf, Droplets, BookOpen
    }
    return icons[iconName] || BookOpen
}

const loading = ref(true)
const error = ref<string | null>(null)
const inGarden = ref(false)
const isScrolled = ref(false)

const allPlants = ref<Plant[]>([])

// Месяцы по-русски
const MONTHS = ['', 'янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function formatMonths(from: number, to: number): string {
  if (from === to) return MONTHS[from]
  return `${MONTHS[from]} — ${MONTHS[to]}`
}

function formatTemp(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${min}°C … ${max}°C`
  if (min !== null) return `от ${min}°C`
  if (max !== null) return `до ${max}°C`
  return ''
}

const CATEGORY_LABELS: Record<string, string> = {
  vegetable: 'Овощ',
  berry: 'Ягода',
  tree: 'Дерево',
  shrub: 'Кустарник',
  herb: 'Зелень',
}

const CATEGORY_EMOJI: Record<string, string> = {
  vegetable: '🥦',
  berry: '🍓',
  tree: '🌳',
  shrub: '🍇',
  herb: '🌿',
}

const CARE_CONFIG: Record<string, { label: string; color: string }> = {
  watering: { label: 'Полив', color: '#3b82f6' },
  fertilizing: { label: 'Подкормка', color: '#8B5E3C' },
  spraying: { label: 'Опрыскивание', color: '#2D6A4F' },
  pruning: { label: 'Обрезка', color: '#9333ea' },
  pest: { label: 'От вредителей', color: '#E76F51' },
}

function onScroll() {
  isScrolled.value = window.scrollY > 30
}

async function loadPlantData(id: string, isRefresh = false) {
  if (!isRefresh) {
    loading.value = true
  }
  error.value = null
  try {
    const [plantData, careData, myPlants, allList] = await Promise.all([
      PlantService.getById(id),
      PlantService.getCareForPlant(id),
      PlantService.getUserPlants(),
      PlantService.getAll()
    ])
    plant.value = plantData
    careList.value = careData
    allPlants.value = allList
    if (plantData) {
      secretsList.value = await PlantService.getSecretsForPlant(plantData.id, plantData.name)
    }
    inGarden.value = myPlants.some(u => u.plant_id === id)
  } catch (e: any) {
    error.value = e.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
    if (isRefresh) {
      isRefreshing.value = false
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  const id = route.params.id as string
  loadPlantData(id)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    loadPlantData(newId as string)
  }
})

async function toggleGarden() {
  if (!authStore.user.value) {
    router.push('/login')
    return
  }
  const id = route.params.id as string
  try {
    inGarden.value = await PlantService.toggleUserPlant(id)
  } catch (e: any) {
    if (e.message === 'PREMIUM_REQUIRED_PLANT') {
      showPaywall.value = true
    } else {
      console.error(e)
    }
  }
}

function goToProduct(name: string) {
  router.push(`/products/${encodeURIComponent(name.toLowerCase())}`)
}

// ─── SWIPE & PULL-TO-REFRESH LOGIC ───
const touchStartX = ref(0)
const touchStartY = ref(0)
const isRefreshing = ref(false)
const pullDistance = ref(0)

const currentIndex = computed(() => {
  if (!allPlants.value.length || !plant.value) return -1
  return allPlants.value.findIndex(p => p.id === plant.value?.id || p.name === plant.value?.name)
})

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value !== -1 && currentIndex.value < allPlants.value.length - 1)

const slideDirection = ref('slide-left')

function goToNextPlant() {
  if (hasNext.value) {
    slideDirection.value = 'slide-left'
    router.push(`/plants/${allPlants.value[currentIndex.value + 1].id}`)
  }
}

function goToPrevPlant() {
  if (hasPrev.value) {
    slideDirection.value = 'slide-right'
    router.push(`/plants/${allPlants.value[currentIndex.value - 1].id}`)
  }
}

function triggerRefresh() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  const id = route.params.id as string
  loadPlantData(id, true)
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length !== 1 || loading.value || isRefreshing.value) return
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const deltaX = currentX - touchStartX.value
  const deltaY = currentY - touchStartY.value

  // Pull to refresh: если мы на самом верху страницы и тянем вниз
  if (window.scrollY <= 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
    if (e.cancelable) e.preventDefault()
    pullDistance.value = Math.min(deltaY * 0.4, 80)
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.changedTouches.length !== 1 || loading.value) return
  const endX = e.changedTouches[0].clientX
  const endY = e.changedTouches[0].clientY
  const deltaX = endX - touchStartX.value
  const deltaY = endY - touchStartY.value

  // Проверяем pull-to-refresh
  if (pullDistance.value >= 50) {
    pullDistance.value = 0
    triggerRefresh()
    return
  } else {
    pullDistance.value = 0
  }

  // Проверяем горизонтальный свайп
  if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
    if (deltaX < 0) {
      // Свайп влево -> следующее растение
      goToNextPlant()
    } else {
      // Свайп вправо -> предыдущее растение
      goToPrevPlant()
    }
  }
}

function getDiffLabel(diff?: string): string {
  if (diff === 'medium') return '🟡 Средне'
  if (diff === 'hard') return '🔴 Сложно'
  return '🟢 Легко'
}
</script>

<template>
  <div class="plant-detail" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <!-- PULL TO REFRESH BANNER -->
    <div v-if="pullDistance > 0 || isRefreshing" class="pull-refresh-banner"
      :style="{ transform: `translateY(${isRefreshing ? 0 : pullDistance - 48}px)` }">
      <RefreshCw :size="18" :class="{ 'spin-anim': isRefreshing }" />
      <span>{{ isRefreshing ? 'Обновление данных...' : 'Отпустите для обновления' }}</span>
    </div>

    <!-- LOADING -->
    <template v-if="loading">
      <div class="detail-header skeleton-header">
        <button class="icon-btn" @click="router.back()">
          <ArrowLeft :size="20" />
        </button>
        <div class="skel skel-circle"></div>
        <div class="skel-col">
          <div class="skel skel-title"></div>
          <div class="skel skel-sub"></div>
        </div>
      </div>
      <div class="detail-body">
        <div class="skel skel-text mb-8"></div>
        <div class="skel skel-text mb-4" style="width:70%"></div>
        <div v-for="i in 3" :key="i" class="skel skel-card mb-8"></div>
      </div>
    </template>

    <!-- ERROR -->
    <template v-else-if="error || !plant">
      <div class="detail-header" style="background: var(--color-error, #E76F51)">
        <button class="icon-btn" @click="router.back()">
          <ArrowLeft :size="20" />
        </button>
        <span style="color:white;font-size:15px">{{ error || 'Растение не найдено' }}</span>
      </div>
    </template>

    <!-- DATA -->
    <template v-else>
      <Transition :name="slideDirection" mode="out-in">
        <div :key="plant.id" class="transition-wrapper">
          <div class="sticky-top-container" :class="{ 'is-scrolled': isScrolled }">
            <div class="detail-header">
              <button class="icon-btn" @click="router.back()">
                <ArrowLeft :size="20" />
              </button>
              <div class="detail-emoji">
                {{ plant.emoji || CATEGORY_EMOJI[plant.category] || '🌱' }}
              </div>
              <div class="detail-names">
                <h1 class="detail-name">{{ plant.name }}</h1>
                <div class="detail-latin">{{ plant.latin_name }}</div>
              </div>
              <span class="detail-category">{{ CATEGORY_LABELS[plant.category] || plant.category }}</span>

              <div class="header-actions">
                <button class="header-garden-btn" :class="{ active: inGarden }"
                  :title="inGarden ? 'В моём саду' : 'Добавить в мой сад'" @click="toggleGarden">
                  <BookmarkCheck v-if="inGarden" :size="20" />
                  <Bookmark v-else :size="20" />
                  <span class="btn-text">{{ inGarden ? 'В саду' : 'В сад' }}</span>
                </button>

                <!-- Кнопки навигации по каталогу -->
                <div class="nav-buttons">
                  <button class="icon-btn nav-btn" :disabled="!hasPrev" @click="goToPrevPlant"
                    title="Предыдущее растение">
                    <ChevronLeft :size="20" />
                  </button>
                  <button class="icon-btn nav-btn" :disabled="!hasNext" @click="goToNextPlant"
                    title="Следующее растение">
                    <ChevronRight :size="20" />
                  </button>
                </div>
              </div>
            </div>

            <div class="detail-subhead">
              <div class="detail-requirements" v-if="plant.difficulty || plant.sun || plant.water">
                <span v-if="plant.difficulty" class="req-badge" :class="plant.difficulty">
                  {{ getDiffLabel(plant.difficulty) }}
                </span>
                <span class="req-pill" v-if="plant.sun" :title="plant.sun">
                  <span class="req-icon">{{ plant.sun.split(' ')[0] }}</span>
                  <span class="req-label">{{ plant.sun.split(' ').slice(1).join(' ') }}</span>
                </span>
                <span class="req-pill" v-if="plant.water" :title="plant.water">
                  <span class="req-icon">{{ plant.water.split(' ')[0] }}</span>
                  <span class="req-label">{{ plant.water.split(' ').slice(1).join(' ') }}</span>
                </span>
              </div>
              <p class="detail-desc">{{ plant.description }}</p>

              <!-- Tabs switcher -->
              <div class="tabs-wrap">
                <button class="tab-btn" :class="{ active: activeTab === 'care' }" @click="activeTab = 'care'">
                  <span>Уход</span>
                </button>
                <button class="tab-btn" :class="{ active: activeTab === 'secrets' }" @click="activeTab = 'secrets'">
                  <Sparkles :size="16" />
                  <span>Секреты</span>
                  <span v-if="filteredSecrets.length" class="badge">{{ filteredSecrets.length }}</span>
                </button>
                <button class="tab-btn" :class="{ active: activeTab === 'facts' }" @click="activeTab = 'facts'">
                  <Lightbulb :size="16" />
                  <span>Факты</span>
                  <span v-if="filteredFacts.length" class="badge">{{ filteredFacts.length }}</span>
                </button>
                <button class="tab-btn" :class="{ active: activeTab === 'myths' }" @click="activeTab = 'myths'">
                  <Ban :size="16" />
                  <span>Мифы</span>
                  <span v-if="filteredMyths.length" class="badge">{{ filteredMyths.length }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="detail-body">
            <div v-if="activeTab === 'care'" class="care-section">
              <div class="section-title">Уход и обработка</div>

              <div v-if="careList.length === 0" class="care-empty">
                Рекомендации по уходу пока не добавлены
              </div>

              <div v-for="item in careList" :key="item.id" class="care-card">
                <div class="care-dot" :style="{ background: CARE_CONFIG[item.care_type]?.color || '#2D6A4F' }"></div>
                <div class="care-content">
                  <div class="care-label">{{ CARE_CONFIG[item.care_type]?.label || item.care_type }}</div>
                  <div class="care-text">{{ item.description }}</div>

                  <div v-if="item.products && item.products.length" class="care-products">
                    <span v-for="p in item.products" :key="p" class="product-tag" @click="goToProduct(p)">{{ p }}</span>
                  </div>

                  <div class="care-meta">
                    <span class="care-months">📅 {{ formatMonths(item.month_from, item.month_to) }}</span>
                    <span v-if="item.frequency" class="care-freq">🔁 {{ item.frequency }}</span>
                    <span v-if="item.temp_min !== null || item.temp_max !== null" class="care-temp">
                      🌡 {{ formatTemp(item.temp_min, item.temp_max) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'secrets'" class="secrets-section">
              <div class="section-title">Принципы хорошего урожая</div>

              <div v-if="filteredSecrets.length === 0" class="care-empty">
                Секреты для этой культуры скоро появятся!
              </div>

              <div v-for="secret in filteredSecrets" :key="secret.id" class="secret-card">
                <div v-if="secret.emoji" class="secret-emoji">{{ secret.emoji }}</div>
                <div class="secret-content">
                  <div class="secret-title">{{ secret.title }}</div>
                  <div class="secret-desc">{{ secret.description }}</div>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'facts'" class="secrets-section">
              <div class="section-title">Интересная информация и биологические факты</div>

              <div v-if="filteredFacts.length === 0" class="care-empty">
                Факты для этой культуры скоро появятся!
              </div>

              <div v-for="secret in filteredFacts" :key="secret.id" class="secret-card fact-card">
                <div v-if="secret.emoji" class="secret-emoji">{{ secret.emoji }}</div>
                <div class="secret-content">
                  <div class="secret-title">{{ secret.title }}</div>
                  <div class="secret-desc">{{ secret.description }}</div>
                </div>
              </div>
            </div>

            <div v-else-if="activeTab === 'myths'" class="secrets-section">
              <div class="section-title">Популярные заблуждения и мифы</div>

              <div v-if="filteredMyths.length === 0" class="care-empty">
                Мифы для этой культуры скоро появятся!
              </div>

              <div v-for="secret in filteredMyths" :key="secret.id" class="secret-card myth-card">
                <div v-if="secret.emoji" class="secret-emoji">{{ secret.emoji }}</div>
                <div class="secret-content">
                  <div class="secret-title">{{ secret.title }}</div>
                  <div class="secret-desc">{{ secret.description }}</div>
                </div>
              </div>
            </div>

            <div v-if="relatedArticles.length > 0" class="related-articles-section">
              <div class="section-title">Полезные статьи</div>
              <div v-for="article in relatedArticles" :key="article.id" class="related-article-card" @click="router.push(`/help/${article.id}`)">
                <div class="article-icon">
                  <component :is="getIcon(article.icon)" :size="20" />
                </div>
                <div class="article-text">
                  <div class="article-title">{{ article.title }}</div>
                  <div class="article-category">{{ article.category }}</div>
                </div>
              </div>
            </div>

            <button class="add-log-btn" @click="router.push('/journal/add')">
              <Plus :size="18" />
              Добавить обработку в журнал
            </button>
          </div>
        </div>
      </Transition>
    </template>

    <FpPaywallModal
      v-if="showPaywall"
      @close="showPaywall = false"
      @subscribe="router.push('/profile')"
    />
  </div>
</template>

<style scoped lang="scss">
.plant-detail {
  padding-bottom: 32px;
  min-height: 100vh;
  background: var(--color-background);
  position: relative;
  overflow-x: hidden;
}

/* ── PULL TO REFRESH BANNER ── */
.pull-refresh-banner {
  position: fixed;
  // top: calc(56px + env(safe-area-inset-top, 0px));
  left: 0;
  right: 0;
  height: 48px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  z-index: 200;
  transition: transform 0.2s ease;

  .spin-anim {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* ── STICKY TOP CONTAINER ── */
.sticky-top-container {
  position: sticky;
  // top: calc(56px + env(safe-area-inset-top, 0px));
  z-index: 100;
  background: var(--color-background);
  border-bottom: 1px solid transparent;
  transition: all 0.25s ease;

  &.is-scrolled {
    border-bottom: 1px solid var(--color-border);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
    background: color-mix(in srgb, var(--color-background) 85%, transparent);
    backdrop-filter: blur(16px);
  }
}

/* ── HEADER ── */
.detail-header {
  background: var(--color-primary);
  padding: 16px 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 10px;
  color: white;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
}

.detail-emoji {
  font-size: 36px;
  flex-shrink: 0;
}

.detail-names {
  flex: 1;
  min-width: 0;
}

.detail-name {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 2px;
}

.detail-latin {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.detail-category {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
}

.nav-buttons {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.header-garden-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &.active {
    background: white;
    color: var(--color-primary);
  }
}

/* ── SUBHEAD & BODY ── */
.detail-subhead {
  padding: 16px 16px 12px;
  background: var(--color-background);
}

.detail-requirements {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .req-badge {
    font-size: 12px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: var(--radius-pill);

    &.easy {
      background: rgba(34, 197, 94, 0.15);
      color: #15803d;
      border: 1px solid rgba(34, 197, 94, 0.25);
    }

    &.medium {
      background: rgba(234, 179, 8, 0.15);
      color: #a16207;
      border: 1px solid rgba(234, 179, 8, 0.25);
    }

    &.hard {
      background: rgba(239, 68, 68, 0.15);
      color: #b91c1c;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }
  }

  .req-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 4px 10px;
    border-radius: var(--radius-md);

    .req-icon {
      font-size: 14px;
    }
  }
}

/* Slide transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.detail-body {
  padding: 16px;
}

.detail-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 16px;
}

/* ── TABS ── */
.tabs-wrap {
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 4px;
  margin-bottom: 0;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.tab-btn {
  flex: 1;
  min-width: 80px;
  padding: 12px 8px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s;
  white-space: nowrap;

  &.active {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }

  .badge {
    background: color-mix(in srgb, currentColor 20%, transparent);
    padding: 2px 6px;
    border-radius: 99px;
    font-size: 11px;
  }
}

/* ── SECRETS SECTION ── */
.secrets-section {
  margin-bottom: 20px;
}

.secret-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.secret-emoji {
  font-size: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: var(--color-surface-variant, rgba(0, 0, 0, 0.04));
  border-radius: var(--radius-md);
}

.secret-card.fact-card {
  border-left-color: #f59e0b;
}

.secret-card.myth-card {
  border-left-color: #ef4444;
}

.secret-content {
  min-width: 0;
  flex: 1;
}

.secret-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.secret-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  white-space: pre-line;
}

/* ── CARE SECTION ── */
.care-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
}

.care-empty {
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 16px 0;
  text-align: center;
}

.care-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 8px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.care-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.care-content {
  flex: 1;
}

.care-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.care-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 8px;
}

/* ── PRODUCTS ── */
.care-products {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.product-tag {
  font-size: 11px;
  background: var(--color-primary-subtle, rgba(45, 106, 79, 0.1));
  color: var(--color-primary);
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-primary);
    color: white;
    transform: translateY(-1px);
  }
}

/* ── META ROW ── */
.care-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.care-months,
.care-freq,
.care-temp {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.care-months {
  color: var(--color-primary);
}

/* ── ADD BUTTON ── */
.add-log-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.85;
  }
}

/* ── SKELETONS ── */
.skeleton-header {
  background: var(--color-primary);
}

.skel {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.12) 25%, rgba(255, 255, 255, 0.22) 50%, rgba(255, 255, 255, 0.12) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;

  .detail-body & {
    background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
    background-size: 200% 100%;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0
  }

  100% {
    background-position: -200% 0
  }
}

.skel-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skel-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skel-title {
  height: 20px;
  width: 60%;
}

.skel-sub {
  height: 13px;
  width: 40%;
}

.skel-text {
  height: 14px;
  width: 100%;
}

.skel-card {
  height: 80px;
}

.mb-4 {
  margin-bottom: 4px;
}

.mb-8 {
  margin-bottom: 8px;
}

/* ── RELATED ARTICLES ── */
.related-articles-section {
  margin-top: 24px;
  margin-bottom: 24px;
}

.related-article-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover, &:active {
    background: var(--color-surface-hover);
    transform: scale(0.98);
  }
}

.article-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.article-text {
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-category {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
