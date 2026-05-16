<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, Bookmark, BookmarkCheck, Sparkles } from 'lucide-vue-next'
import { PlantService, type Plant, type PlantCare, type PlantSecret } from '@/modules/plants/services/PlantService'
import { authStore } from '@/modules/auth/store/authStore'

const route = useRoute()
const router = useRouter()

const plant = ref<Plant | null>(null)
const careList = ref<PlantCare[]>([])
const secretsList = ref<PlantSecret[]>([])
const activeTab = ref<'care' | 'secrets'>('care')
const loading = ref(true)
const error = ref<string | null>(null)
const inGarden = ref(false)

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
  watering:   { label: 'Полив',      color: '#3b82f6' },
  fertilizing:{ label: 'Подкормка', color: '#8B5E3C' },
  spraying:   { label: 'Опрыскивание', color: '#2D6A4F' },
  pruning:    { label: 'Обрезка',   color: '#9333ea' },
  pest:       { label: 'От вредителей', color: '#E76F51' },
}

onMounted(async () => {
  const id = route.params.id as string
  try {
    const [plantData, careData, myPlants] = await Promise.all([
      PlantService.getById(id),
      PlantService.getCareForPlant(id),
      PlantService.getUserPlants()
    ])
    plant.value = plantData
    careList.value = careData
    if (plantData) {
      secretsList.value = await PlantService.getSecretsForPlant(plantData.id, plantData.name)
    }
    inGarden.value = myPlants.some(u => u.plant_id === id)
  } catch (e: any) {
    error.value = e.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
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
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div class="plant-detail">

    <!-- LOADING -->
    <template v-if="loading">
      <div class="detail-header skeleton-header">
        <button class="back-btn" @click="router.back()"><ArrowLeft :size="20" /></button>
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
        <button class="back-btn" @click="router.back()"><ArrowLeft :size="20" /></button>
        <span style="color:white;font-size:15px">{{ error || 'Растение не найдено' }}</span>
      </div>
    </template>

    <!-- DATA -->
    <template v-else>
      <div class="sticky-top-container">
        <div class="detail-header">
          <button class="back-btn" @click="router.back()"><ArrowLeft :size="20" /></button>
          <div class="detail-emoji">
            {{ plant.emoji || CATEGORY_EMOJI[plant.category] || '🌱' }}
          </div>
          <div class="detail-names">
            <h1 class="detail-name">{{ plant.name }}</h1>
            <div class="detail-latin">{{ plant.latin_name }}</div>
          </div>
          <span class="detail-category">{{ CATEGORY_LABELS[plant.category] || plant.category }}</span>
          <button
            class="header-garden-btn"
            :class="{ active: inGarden }"
            :title="inGarden ? 'В моём саду' : 'Добавить в мой сад'"
            @click="toggleGarden"
          >
            <BookmarkCheck v-if="inGarden" :size="20" />
            <Bookmark v-else :size="20" />
            <span class="btn-text">{{ inGarden ? 'В саду' : 'В сад' }}</span>
          </button>
        </div>

        <div class="detail-subhead">
          <p class="detail-desc">{{ plant.description }}</p>

          <!-- Tabs switcher -->
          <div class="tabs-wrap">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'care' }"
              @click="activeTab = 'care'"
            >
              Уход и календарь
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'secrets' }"
              @click="activeTab = 'secrets'"
            >
              <Sparkles :size="16" />
              Секреты урожая
              <span v-if="secretsList.length" class="badge">{{ secretsList.length }}</span>
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
            <div
              class="care-dot"
              :style="{ background: CARE_CONFIG[item.care_type]?.color || '#2D6A4F' }"
            ></div>
            <div class="care-content">
              <div class="care-label">{{ CARE_CONFIG[item.care_type]?.label || item.care_type }}</div>
              <div class="care-text">{{ item.description }}</div>

              <div v-if="item.products && item.products.length" class="care-products">
                <span v-for="p in item.products" :key="p" class="product-tag">{{ p }}</span>
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

          <div v-if="secretsList.length === 0" class="care-empty">
            Секреты для этой культуры скоро появятся!
          </div>

          <div v-for="secret in secretsList" :key="secret.id" class="secret-card">
            <div class="secret-content">
              <div class="secret-title">{{ secret.title }}</div>
              <div class="secret-desc">{{ secret.description }}</div>
            </div>
          </div>
        </div>

        <button class="add-log-btn" @click="router.push('/journal/add')">
          <Plus :size="18" />
          Добавить обработку в журнал
        </button>
      </div>
    </template>

  </div>
</template>

<style scoped lang="scss">
.plant-detail {
  padding-bottom: 32px;
  min-height: 100vh;
  background: var(--color-background);
}

/* ── STICKY TOP CONTAINER ── */
.sticky-top-container {
  position: sticky;
  top: calc(56px + env(safe-area-inset-top, 0px));
  z-index: 100;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
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

.back-btn {
  background: rgba(255,255,255,0.2);
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
}

.detail-emoji { font-size: 36px; flex-shrink: 0; }

.detail-names { flex: 1; min-width: 0; }

.detail-name {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 2px;
}

.detail-latin {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  font-style: italic;
}

.detail-category {
  font-size: 12px;
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
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

  &:hover { background: rgba(255, 255, 255, 0.3); }
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

.detail-body { padding: 16px; }

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
}
.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s;

  &.active {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }

  .badge {
    background: color-mix(in srgb, currentColor 20%, transparent);
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 11px;
  }
}

/* ── SECRETS SECTION ── */
.secrets-section { margin-bottom: 20px; }
.secret-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}
.secret-content { min-width: 0; }
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
.care-section { margin-bottom: 20px; }

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

.care-content { flex: 1; }

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
  background: var(--color-primary-subtle, rgba(45,106,79,0.1));
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
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

.care-months { color: var(--color-primary); }

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

  &:active { opacity: 0.85; }
}

/* ── SKELETONS ── */
.skeleton-header { background: var(--color-primary); }

.skel {
  background: linear-gradient(90deg, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.12) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 8px;

  .detail-body & {
    background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
    background-size: 200% 100%;
  }
}

@keyframes shimmer {
  0%   { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}

.skel-circle  { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; }
.skel-col     { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.skel-title   { height: 20px; width: 60%; }
.skel-sub     { height: 13px; width: 40%; }
.skel-text    { height: 14px; width: 100%; }
.skel-card    { height: 80px; }
.mb-4  { margin-bottom: 4px; }
.mb-8  { margin-bottom: 8px; }
</style>
