<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Plus, Sprout, Trash2, ChevronLeft, ChevronRight, Search, SlidersHorizontal, RotateCcw, Download, FileText, Table2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { JournalService, type TreatmentEntry } from '@/modules/journal/services/JournalService'
import { exportCSV, exportPDF } from '@/modules/journal/services/JournalExportService'
import FpConfirmationModal from '@/design-system/components/FpConfirmationModal.vue'

const router = useRouter()
const entries = ref<TreatmentEntry[]>([])
const loading = ref(true)
const showExportMenu = ref(false)
const exporting = ref(false)

async function doExportCSV() {
  exporting.value = true
  showExportMenu.value = false
  try {
    await exportCSV(filteredEntries.value)
  } finally {
    exporting.value = false
  }
}

function doExportPDF() {
  showExportMenu.value = false
  exportPDF(filteredEntries.value)
}

const isConfirmVisible = ref(false)
const confirmEntryId = ref<string | null>(null)

interface FilterPlantItem {
  id: string
  name: string
  emoji: string
}

const searchQuery = ref('')
const showFilters = ref(false)

const selectedFilterPlantId = ref<string | null>(null)
const selectedFilterCareType = ref<string | null>(null)

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedFilterPlantId.value !== null) count++
  if (selectedFilterCareType.value !== null) count++
  if (searchQuery.value.trim() !== '') count++
  return count
})

function resetFilters() {
  selectedFilterPlantId.value = null
  selectedFilterCareType.value = null
  searchQuery.value = ''
}

const careTypes = [
  { value: 'spraying', label: 'Опрыскивание', emoji: '💧' },
  { value: 'fertilizing', label: 'Удобрение', emoji: '🌿' },
  { value: 'watering', label: 'Полив', emoji: '💦' },
  { value: 'pruning', label: 'Обрезка', emoji: '✂️' },
  { value: 'other', label: 'Другое', emoji: '📝' }
]

const availablePlantFilters = computed<FilterPlantItem[]>(() => {
  const map = new Map<string, FilterPlantItem>()
  for (const entry of entries.value) {
    const list = getTreatedPlants(entry)
    for (const p of list) {
      if (!map.has(p.id)) {
        map.set(p.id, { id: p.id, name: p.name, emoji: p.emoji })
      }
    }
  }
  return Array.from(map.values())
})

const availableCareTypeFilters = computed(() => {
  const presentTypes = new Set<string>()
  for (const entry of entries.value) {
    if (entry.care_type) presentTypes.add(entry.care_type)
  }
  return careTypes.filter(ct => presentTypes.has(ct.value))
})

const typeLabel: Record<string, string> = {
  spraying: 'Опрыскивание',
  fertilizing: 'Удобрение',
  watering: 'Полив',
  pruning: 'Обрезка',
  other: 'Другое'
}

const filteredEntries = computed<TreatmentEntry[]>(() => {
  return entries.value.filter(entry => {
    if (selectedFilterPlantId.value) {
      const list = getTreatedPlants(entry)
      if (!list.some(p => p.id === selectedFilterPlantId.value)) return false
    }
    if (selectedFilterCareType.value) {
      if (entry.care_type !== selectedFilterCareType.value) return false
    }
    const q = searchQuery.value.toLowerCase().trim()
    if (q) {
      const list = getTreatedPlants(entry)
      const plantNames = list.map(p => p.name.toLowerCase()).join(' ')
      const typeStr = (typeLabel[entry.care_type] || entry.care_type).toLowerCase()
      const productStr = (entry.product || '').toLowerCase()
      const notesStr = (entry.notes || '').toLowerCase()
      if (!plantNames.includes(q) && !typeStr.includes(q) && !productStr.includes(q) && !notesStr.includes(q)) {
        return false
      }
    }
    return true
  })
})

const plantsScrollRef = ref<HTMLElement | null>(null)
const careScrollRef = ref<HTMLElement | null>(null)

const showPlantsLeft = ref(false)
const showPlantsRight = ref(false)
const showCareLeft = ref(false)
const showCareRight = ref(false)

function checkScrolls() {
  const pEl = plantsScrollRef.value
  if (pEl) {
    showPlantsLeft.value = pEl.scrollLeft > 10
    showPlantsRight.value = pEl.scrollLeft + pEl.clientWidth < pEl.scrollWidth - 10
  }
  const cEl = careScrollRef.value
  if (cEl) {
    showCareLeft.value = cEl.scrollLeft > 10
    showCareRight.value = cEl.scrollLeft + cEl.clientWidth < cEl.scrollWidth - 10
  }
}

function scrollBy(refEl: HTMLElement | null, amount: number) {
  if (!refEl) return
  refEl.scrollBy({ left: amount, behavior: 'smooth' })
}

async function load() {
  loading.value = true
  try {
    entries.value = await JournalService.getAll()
    setTimeout(checkScrolls, 100)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function promptDelete(id: string) {
  confirmEntryId.value = id
  isConfirmVisible.value = true
}

async function onConfirmDelete() {
  if (confirmEntryId.value) {
    await JournalService.remove(confirmEntryId.value)
    entries.value = entries.value.filter(e => e.id !== confirmEntryId.value)
  }
  isConfirmVisible.value = false
  confirmEntryId.value = null
}

function onCancelDelete() {
  isConfirmVisible.value = false
  confirmEntryId.value = null
}

function getTreatedPlants(entry: TreatmentEntry) {
  if (entry.plants_data && entry.plants_data.length > 0) {
    return entry.plants_data
  }
  if (entry.user_plant || entry.plant) {
    return [{
      id: entry.user_plant_id ? 'u_' + entry.user_plant_id : 'p_' + (entry.plant_id || ''),
      name: entry.user_plant?.nickname || entry.plant?.name || 'Растение',
      emoji: entry.plant?.emoji || '🌱',
      location_note: entry.user_plant?.location_note || undefined
    }]
  }
  return []
}

onMounted(() => {
  load()
  window.addEventListener('resize', checkScrolls, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScrolls)
})
</script>

<template>
  <div class="journal-view">
    <!-- Оверлей для закрытия меню экспорта -->
    <div v-if="showExportMenu" class="export-overlay" @click="showExportMenu = false" />

    <div class="page-header">
      <h1 class="header-title">Журнал</h1>
      <div class="header-actions">
        <!-- Экспорт -->
        <div v-if="!loading && filteredEntries.length > 0" class="export-wrap">
          <button class="export-btn" @click="showExportMenu = !showExportMenu" :disabled="exporting" title="Экспорт">
            <Download :size="16" />
          </button>
          <Transition name="dropdown">
            <div v-if="showExportMenu" class="export-menu">
              <div class="export-menu-title">Экспортировать {{ filteredEntries.length }} записей</div>
              <button class="export-option" @click="doExportCSV">
                <Table2 :size="16" class="opt-icon csv" />
                <div>
                  <div class="opt-label">CSV для Excel</div>
                  <div class="opt-desc">Открыть в таблицах</div>
                </div>
              </button>
              <button class="export-option" @click="doExportPDF">
                <FileText :size="16" class="opt-icon pdf" />
                <div>
                  <div class="opt-label">PDF / Печать</div>
                  <div class="opt-desc">Сохранить или распечатать</div>
                </div>
              </button>
            </div>
          </Transition>
        </div>
        <button class="add-btn" @click="router.push('/journal/add')">
          <Plus :size="18" /> Добавить
        </button>
      </div>
    </div>

    <!-- Строка поиска и кнопка фильтров -->
    <div v-if="!loading && entries.length > 0" class="search-wrap">
      <Search :size="16" class="search-icon" />
      <input v-model="searchQuery" class="search-input" placeholder="Поиск по культуре, операции, препарату..." />
      <button
        class="filter-toggle-btn"
        :class="{ active: showFilters || activeFilterCount > 0 }"
        @click="showFilters = !showFilters"
        title="Быстрые фильтры"
      >
        <SlidersHorizontal :size="16" />
        <span v-if="activeFilterCount > 0" class="filter-count-badge">{{ activeFilterCount }}</span>
      </button>
    </div>

    <!-- Быстрые фильтры культур (всегда на виду) -->
    <div v-if="!loading && availablePlantFilters.length > 1" class="filters-section">
      <div class="scroll-container-wrapper" @mouseenter="checkScrolls">
        <button v-show="showPlantsLeft" class="scroll-arrow left" @click="scrollBy(plantsScrollRef, -200)">
          <ChevronLeft :size="18" />
        </button>
        <div class="filter-bar" ref="plantsScrollRef" @scroll="checkScrolls">
          <button
            class="filter-pill"
            :class="{ active: selectedFilterPlantId === null }"
            @click="selectedFilterPlantId = null"
          >
            Все
          </button>
          <button
            v-for="fp in availablePlantFilters"
            :key="fp.id"
            class="filter-pill"
            :class="{ active: selectedFilterPlantId === fp.id }"
            @click="selectedFilterPlantId = selectedFilterPlantId === fp.id ? null : fp.id"
          >
            <span class="f-emoji">{{ fp.emoji }}</span>
            <span class="f-name">{{ fp.name }}</span>
          </button>
        </div>
        <button v-show="showPlantsRight" class="scroll-arrow right" @click="scrollBy(plantsScrollRef, 200)">
          <ChevronRight :size="18" />
        </button>
      </div>
    </div>

    <!-- Выдвижные дополнительные фильтры (по операциям ухода) -->
    <Transition name="filters-slide">
      <div v-if="showFilters && !loading && availableCareTypeFilters.length > 1" class="advanced-filters-box">
        <div class="filter-header">
          <span class="filter-box-title">Фильтр по операциям</span>
          <button v-if="activeFilterCount > 0" class="reset-filters-btn" @click="resetFilters">
            <RotateCcw :size="14" /> Сбросить всё
          </button>
        </div>

        <div class="scroll-container-wrapper" @mouseenter="checkScrolls">
          <button v-show="showCareLeft" class="scroll-arrow left" @click="scrollBy(careScrollRef, -200)">
            <ChevronLeft :size="18" />
          </button>
          <div class="filter-bar care-type-bar" ref="careScrollRef" @scroll="checkScrolls">
            <button
              class="filter-pill care-pill"
              :class="{ active: selectedFilterCareType === null }"
              @click="selectedFilterCareType = null"
            >
              Все
            </button>
            <button
              v-for="ct in availableCareTypeFilters"
              :key="ct.value"
              class="filter-pill care-pill"
              :class="{ active: selectedFilterCareType === ct.value }"
              @click="selectedFilterCareType = selectedFilterCareType === ct.value ? null : ct.value"
            >
              <span class="f-emoji">{{ ct.emoji }}</span>
              <span class="f-name">{{ ct.label }}</span>
            </button>
          </div>
          <button v-show="showCareRight" class="scroll-arrow right" @click="scrollBy(careScrollRef, 200)">
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="loading" class="entries-list">
      <div v-for="i in 4" :key="i" class="entry-card skeleton-card"></div>
    </div>

    <div v-else-if="entries.length === 0" class="empty-state">
      <Sprout :size="48" class="empty-icon" />
      <p>Ещё нет записей.<br>Добавь первую обработку!</p>
      <button class="add-btn-big" @click="router.push('/journal/add')">
        <Plus :size="18" /> Добавить запись
      </button>
    </div>

    <div v-else-if="filteredEntries.length === 0" class="empty-state">
      <p>Ничего не найдено по выбранным фильтрам.</p>
      <button class="add-btn" @click="selectedFilterPlantId = null; selectedFilterCareType = null">
        Сбросить фильтры
      </button>
    </div>

    <div v-else class="entries-list">
      <div v-for="entry in filteredEntries" :key="entry.id" class="entry-card" @click="router.push(`/journal/edit/${entry.id}`)">
        <div class="entry-header">
          <div class="entry-type-badge" :class="entry.care_type">
            {{ typeLabel[entry.care_type] || entry.care_type }}
          </div>
          <div class="entry-right">
            <div class="entry-date">{{ entry.treated_at }}</div>
            <button class="icon-btn" @click.stop="promptDelete(entry.id)">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <div class="entry-plants">
          <span v-for="p in getTreatedPlants(entry)" :key="p.id" class="plant-pill">
            <span class="p-emoji">{{ p.emoji }}</span>
            <span class="p-name">{{ p.name }}</span>
            <span v-if="p.location_note" class="p-loc">({{ p.location_note }})</span>
          </span>
        </div>
        <div v-if="entry.product" class="entry-product">
          {{ entry.product }}
          <span v-if="entry.dose" class="entry-dose">· {{ entry.dose }}</span>
        </div>
        <div class="entry-meta">
          <span v-if="entry.temperature">🌡 {{ entry.temperature }}°C</span>
          <span v-if="entry.notes" class="entry-note">{{ entry.notes }}</span>
        </div>
      </div>
    </div>

    <FpConfirmationModal
      v-model:visible="isConfirmVisible"
      title="Удалить запись?"
      message="Вы уверены, что хотите удалить эту запись из журнала? Отменить это действие будет невозможно."
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      @confirm="onConfirmDelete"
      @cancel="onCancelDelete"
    />
  </div>
</template>

<style scoped lang="scss">
.journal-view { padding: 16px 16px 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.header-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.add-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: var(--color-primary); color: var(--color-on-primary);
  border: none; border-radius: var(--radius-pill); font-size: 14px; font-weight: 600; cursor: pointer;
}
.empty-state {
  text-align: center; padding: 60px 0; color: var(--color-text-secondary);
  .empty-icon { color: var(--color-text-disabled); margin-bottom: 16px; }
  p { font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
}
.add-btn-big {
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;
  background: var(--color-primary); color: var(--color-on-primary);
  border: none; border-radius: var(--radius-pill); font-size: 15px; font-weight: 600; cursor: pointer;
}
.entries-list { display: flex; flex-direction: column; gap: 10px; }
.entry-card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 12px 14px;
  cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s;
  &:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }
  &.skeleton-card { height: 80px; background: var(--color-border); opacity: 0.4; cursor: default; }
}
.entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.entry-right { display: flex; align-items: center; gap: 8px; }
.entry-type-badge {
  font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: var(--radius-pill);
  &.spraying { background: #FFECE8; color: #7A2010; }
  &.fertilizing { background: var(--color-soil-light); color: var(--color-soil); }
  &.watering { background: #E8F4FD; color: #0C447C; }
  &.pruning { background: #E8F5EE; color: #1B4332; }
  &.other { background: var(--color-surface-hover); color: var(--color-text-secondary); }
}
.entry-date { font-size: 12px; color: var(--color-text-tertiary); }
.icon-btn {
  background: none; border: none; color: var(--color-text-disabled); cursor: pointer; padding: 4px;
  display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm);
  &:hover { color: var(--color-error); background: color-mix(in srgb, var(--color-error) 10%, transparent); }
}
.entry-plants { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.plant-pill {
  display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px;
  background: var(--color-surface-hover); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-size: 13px; color: var(--color-text-primary);
}
.p-emoji { font-size: 14px; }
.p-name { font-weight: 600; }
.p-loc { font-size: 12px; color: var(--color-text-tertiary); font-weight: 400; }
.entry-product { font-size: 13px; color: var(--color-primary); margin-bottom: 6px; }
.entry-dose { color: var(--color-text-secondary); }
.entry-meta { display: flex; gap: 12px; font-size: 12px; color: var(--color-text-secondary); }
.entry-note { font-style: italic; }
.filter-bar {
  display: flex; align-items: center; gap: 8px; overflow-x: auto;
  padding-bottom: 8px; margin-bottom: 16px; scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
.filter-pill {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-pill); font-size: 14px; font-weight: 600;
  color: var(--color-text-secondary); white-space: nowrap; cursor: pointer;
  transition: all 0.2s ease; flex-shrink: 0;
  &:hover { border-color: var(--color-primary); color: var(--color-text-primary); }
  &.active {
    background: var(--color-primary); border-color: var(--color-primary);
    color: var(--color-on-primary);
  }
  &.care-pill {
    font-size: 13px; padding: 5px 12px;
    &.active {
      background: var(--color-soil); border-color: var(--color-soil);
      color: #ffffff;
    }
  }
}
.f-emoji { font-size: 16px; }
.f-name { font-size: 13px; }

.scroll-container-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.scroll-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.15s;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  &.left { left: -4px; }
  &.right { right: -4px; }
}

/* ── SEARCH & FILTERS ── */
.search-wrap {
  position: relative;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); z-index: 2; }
  .search-input {
    flex: 1; padding: 10px 12px 10px 36px;
    border: 1px solid var(--color-border); border-radius: var(--radius-md);
    background: var(--color-surface); font-size: 14px; color: var(--color-text-primary);
    outline: none; box-sizing: border-box; width: 100%; transition: border-color 0.15s;
    &:focus { border-color: var(--color-primary); }
  }

  .filter-toggle-btn {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: var(--radius-md);
    border: 1px solid var(--color-border); background: var(--color-surface);
    color: var(--color-text-secondary); cursor: pointer; flex-shrink: 0;
    transition: all 0.15s;

    &:hover { background: var(--color-surface-hover); color: var(--color-primary); border-color: var(--color-primary); }
    &.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }

    .filter-count-badge {
      position: absolute; top: -4px; right: -4px; background: #E76F51; color: white;
      font-size: 10px; font-weight: 800; width: 16px; height: 16px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  }
}

.advanced-filters-box {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 16px; margin-bottom: 16px;
  display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow-md);
}
.filter-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;
  .filter-box-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-secondary); }
  .reset-filters-btn {
    display: flex; align-items: center; gap: 4px; background: transparent; border: none;
    color: var(--color-error); font-size: 12px; font-weight: 600; cursor: pointer; padding: 2px 6px; border-radius: 4px;
    &:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); }
  }
}

.filters-slide-enter-active, .filters-slide-leave-active { transition: all 0.25s ease-out; }
.filters-slide-enter-from, .filters-slide-leave-to { opacity: 0; transform: translateY(-10px); }

/* ── EXPORT ── */
.export-overlay {
  position: fixed; inset: 0; z-index: 99;
}
.header-actions {
  display: flex; align-items: center; gap: 8px;
}
.export-wrap {
  position: relative;
}
.export-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.15s;
  &:hover { border-color: var(--color-primary); color: var(--color-primary); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.export-menu {
  position: absolute; top: calc(100% + 6px); right: 0;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-md);
  min-width: 220px; z-index: 100; overflow: hidden;
}
.export-menu-title {
  padding: 10px 14px 8px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--color-text-tertiary);
  border-bottom: 1px solid var(--color-border);
}
.export-option {
  width: 100%; display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; background: none; border: none;
  cursor: pointer; transition: background 0.15s; text-align: left;
  &:hover { background: var(--color-surface-hover); }
}
.opt-icon {
  flex-shrink: 0;
  &.csv { color: #16a34a; }
  &.pdf { color: #dc2626; }
}
.opt-label { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.opt-desc  { font-size: 11px; color: var(--color-text-tertiary); margin-top: 1px; }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
