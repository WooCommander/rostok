<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Plus, Camera, Droplets, Sprout,
  Scissors, FlaskConical, FileText, Loader2
} from 'lucide-vue-next'
import { PlantService, type UserPlant } from '@/modules/plants/services/PlantService'
import { JournalService, type TreatmentEntry } from '@/modules/journal/services/JournalService'

const route = useRoute()
const router = useRouter()
const userPlantId = route.params.userPlantId as string

const loading = ref(true)
const uPlant = ref<UserPlant | null>(null)
const entries = ref<TreatmentEntry[]>([])
const photos = ref<{ url: string; createdAt: string }[]>([])
const lightboxUrl = ref<string | null>(null)

// ── Unified timeline item ──────────────────────────────
type TimelineItem =
  | { kind: 'entry'; date: Date; data: TreatmentEntry }
  | { kind: 'photo'; date: Date; url: string }

const CARE_CONFIG: Record<string, { label: string; color: string; icon: unknown }> = {
  watering:    { label: 'Полив',           color: '#3b82f6', icon: Droplets },
  fertilizing: { label: 'Подкормка',       color: '#8B5E3C', icon: Sprout },
  spraying:    { label: 'Опрыскивание',    color: '#2D6A4F', icon: FlaskConical },
  pruning:     { label: 'Обрезка',         color: '#9333ea', icon: Scissors },
  other:       { label: 'Уход',            color: '#6b7280', icon: FileText },
}

function careIcon(type: string) {
  return CARE_CONFIG[type]?.icon ?? FileText
}
function careColor(type: string) {
  return CARE_CONFIG[type]?.color ?? '#6b7280'
}
function careLabel(type: string) {
  return CARE_CONFIG[type]?.label ?? type
}

onMounted(async () => {
  try {
    const [allUserPlants, allEntries, gardenPhotos] = await Promise.all([
      PlantService.getUserPlants(),
      JournalService.getAll(),
      PlantService.getGardenPhotos(userPlantId)
    ])

    uPlant.value = allUserPlants.find(u => u.id === userPlantId) ?? null

    entries.value = allEntries.filter(e => {
      if (e.user_plant_id === userPlantId) return true
      if (e.plants_data?.some(p => p.id === userPlantId)) return true
      return false
    })

    photos.value = gardenPhotos
  } finally {
    loading.value = false
  }
})

// ── Build unified sorted timeline ────────────────────
const timeline = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = []

  for (const e of entries.value) {
    items.push({ kind: 'entry', date: new Date(e.treated_at), data: e })
  }
  for (const p of photos.value) {
    items.push({ kind: 'photo', date: new Date(p.createdAt), url: p.url })
  }

  return items.sort((a, b) => b.date.getTime() - a.date.getTime())
})

// ── Group by month ────────────────────────────────────
interface MonthGroup {
  label: string
  key: string
  items: TimelineItem[]
}

const grouped = computed<MonthGroup[]>(() => {
  const map = new Map<string, TimelineItem[]>()
  for (const item of timeline.value) {
    const key = item.date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries()).map(([label, items]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    key: label,
    items
  }))
})

function formatDay(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

const plantName = computed(() => {
  if (!uPlant.value) return 'Грядка'
  return uPlant.value.nickname || uPlant.value.plant?.name || 'Грядка'
})
const plantEmoji = computed(() => uPlant.value?.plant?.emoji ?? '🌱')

function goAddEntry() {
  const sel = `u_${userPlantId}`
  router.push(`/journal/add?selected_id=${sel}`)
}
</script>

<template>
  <div class="timeline-view">
    <!-- Header -->
    <div class="page-header">
      <button class="back-btn" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <div class="header-plant">
        <span class="header-emoji">{{ plantEmoji }}</span>
        <div>
          <div class="header-title">{{ plantName }}</div>
          <div class="header-sub" v-if="uPlant?.location_note">📍 {{ uPlant.location_note }}</div>
        </div>
      </div>
      <button class="add-btn" @click="goAddEntry" title="Добавить запись">
        <Plus :size="20" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="32" class="spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="timeline.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">История пока пуста</div>
      <div class="empty-desc">Добавьте первую запись об уходе или фотографию этой грядки.</div>
      <button class="empty-btn" @click="goAddEntry">
        <Plus :size="16" /> Добавить запись
      </button>
    </div>

    <!-- Timeline -->
    <div v-else class="timeline">
      <div v-for="group in grouped" :key="group.key" class="month-group">
        <div class="month-label">{{ group.label }}</div>

        <div class="month-items">
          <div
            v-for="(item, idx) in group.items"
            :key="idx"
            class="timeline-item"
          >
            <!-- Vertical line + dot -->
            <div class="tl-spine">
              <div
                class="tl-dot"
                :style="{ background: item.kind === 'photo' ? '#F4A261' : careColor(item.kind === 'entry' ? item.data.care_type : '') }"
              >
                <component
                  v-if="item.kind === 'entry'"
                  :is="careIcon(item.data.care_type)"
                  :size="12"
                  style="color:white"
                />
                <Camera v-else :size="12" style="color:white" />
              </div>
              <div class="tl-line" />
            </div>

            <!-- Content -->
            <div class="tl-content">
              <!-- Journal entry -->
              <template v-if="item.kind === 'entry'">
                <div class="entry-card" @click="router.push(`/journal/edit/${item.data.id}`)">
                  <div class="entry-head">
                    <span
                      class="entry-type-badge"
                      :style="{ background: careColor(item.data.care_type) + '20', color: careColor(item.data.care_type) }"
                    >
                      {{ careLabel(item.data.care_type) }}
                    </span>
                    <span class="entry-date">{{ formatDay(item.date) }}, {{ formatTime(item.date) }}</span>
                  </div>
                  <div v-if="item.data.product" class="entry-product">
                    💊 {{ item.data.product }}<span v-if="item.data.dose"> · {{ item.data.dose }}</span>
                  </div>
                  <div v-if="item.data.temperature !== null" class="entry-meta">
                    🌡 {{ item.data.temperature }}°C
                  </div>
                  <div v-if="item.data.notes" class="entry-notes">{{ item.data.notes }}</div>
                </div>
              </template>

              <!-- Photo -->
              <template v-else>
                <div class="photo-card">
                  <div class="photo-date">{{ formatDay(item.date) }}</div>
                  <img
                    :src="item.url"
                    class="photo-thumb"
                    loading="lazy"
                    @click="lightboxUrl = item.url"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Start dot -->
      <div class="timeline-start">
        <div class="start-dot">🌱</div>
        <span class="start-label">Начало</span>
      </div>
    </div>

    <!-- Lightbox -->
    <Transition name="fade">
      <div v-if="lightboxUrl" class="lightbox" @click="lightboxUrl = null">
        <img :src="lightboxUrl" class="lightbox-img" />
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.timeline-view {
  padding: 0 0 48px;
  min-height: 100vh;
  background: var(--color-background);
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
}

.header-plant {
  flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0;
}
.header-emoji { font-size: 28px; flex-shrink: 0; }
.header-title {
  font-size: 17px; font-weight: 700; color: var(--color-text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.header-sub { font-size: 12px; color: var(--color-text-tertiary); }

.add-btn {
  width: 36px; height: 36px;
  background: var(--color-primary);
  border: none; border-radius: 50%;
  color: white; display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 40%, transparent);
  transition: transform 0.15s;
  &:active { transform: scale(0.9); }
}

/* ── States ── */
.loading-state {
  display: flex; justify-content: center; padding: 60px 0;
  color: var(--color-text-tertiary);
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 60px 24px; gap: 12px;
}
.empty-icon { font-size: 48px; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
.empty-desc { font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; }
.empty-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 20px; background: var(--color-primary);
  color: white; border: none; border-radius: var(--radius-lg);
  font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 4px;
}

/* ── Timeline ── */
.timeline {
  padding: 20px 16px 0;
}

.month-group {
  margin-bottom: 8px;
}

.month-label {
  font-size: 12px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  padding: 0 0 12px 40px;
}

.month-items {
  display: flex; flex-direction: column;
}

.timeline-item {
  display: flex; gap: 0; align-items: flex-start; position: relative;
}

/* ── Spine ── */
.tl-spine {
  display: flex; flex-direction: column; align-items: center;
  width: 40px; flex-shrink: 0;
}

.tl-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; z-index: 1;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.tl-line {
  width: 2px;
  flex: 1;
  min-height: 12px;
  background: var(--color-border);
  margin: 2px 0;
}

/* ── Content cards ── */
.tl-content {
  flex: 1;
  padding-bottom: 16px;
  padding-left: 12px;
}

.entry-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  &:active { background: var(--color-surface-hover); transform: scale(0.99); }
}

.entry-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-bottom: 6px;
}

.entry-type-badge {
  font-size: 12px; font-weight: 700;
  padding: 3px 10px; border-radius: var(--radius-pill);
}

.entry-date {
  font-size: 11px; color: var(--color-text-disabled); white-space: nowrap;
}

.entry-product {
  font-size: 13px; color: var(--color-text-primary); font-weight: 500; margin-bottom: 4px;
}
.entry-meta {
  font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px;
}
.entry-notes {
  font-size: 13px; color: var(--color-text-secondary); line-height: 1.4;
  margin-top: 4px; padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

/* Photo */
.photo-card {
  display: flex; flex-direction: column; gap: 6px;
}
.photo-date {
  font-size: 11px; color: var(--color-text-disabled);
}
.photo-thumb {
  width: 100%; max-width: 280px;
  height: 180px; object-fit: cover;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  cursor: zoom-in;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover { transform: scale(1.01); box-shadow: var(--shadow-md); }
}

/* Start marker */
.timeline-start {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 0 24px;
}
.start-dot {
  width: 28px; height: 28px; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-surface); border: 2px dashed var(--color-border);
  border-radius: 50%; flex-shrink: 0;
}
.start-label {
  font-size: 12px; font-weight: 600; color: var(--color-text-disabled);
  padding-left: 12px;
}

/* ── Lightbox ── */
.lightbox {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.92);
  display: flex; align-items: center; justify-content: center;
  cursor: zoom-out;
  padding: 16px;
}
.lightbox-img {
  max-width: 100%; max-height: 100%;
  border-radius: var(--radius-lg);
  object-fit: contain;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
