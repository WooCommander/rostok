<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Bookmark, BookmarkCheck, ChevronRight, RotateCcw } from 'lucide-vue-next'
import { type Plant } from '../services/PlantService'
import FpSkeleton from '@/design-system/components/FpSkeleton.vue'

interface Props {
  plants: Plant[]
  userPlantIds: string[]
  search: string
  activeCategory: string
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle-garden', plant: Plant, event: Event): void
}>()

const router = useRouter()

// Filters
const activeDifficulty = ref('all')
const activeSun = ref('all')
const activeWater = ref('all')
const showFilters = ref(false)

const filterOptions = {
  difficulty: [
    { id: 'all', label: 'Любая сложность' },
    { id: 'easy', label: '🟢 Легко' },
    { id: 'medium', label: '🟡 Средне' },
    { id: 'hard', label: '🔴 Сложно' }
  ],
  sun: [
    { id: 'all', label: 'Любой свет' },
    { id: 'Солнце', label: '☀️ Солнце' },
    { id: 'Полутень', label: '⛅ Полутень' }
  ],
  water: [
    { id: 'all', label: 'Любой полив' },
    { id: 'Умеренный', label: '💧 Умеренный' },
    { id: 'Влаголюбивое', label: '💧 Влаголюбивое' },
    { id: 'Засухоустойчивое', label: '🌵 Засухоустойчивое' }
  ]
}

const activeFilterCount = computed(() => {
  let count = 0
  if (activeDifficulty.value !== 'all') count++
  if (activeSun.value !== 'all') count++
  if (activeWater.value !== 'all') count++
  return count
})

function resetFilters() {
  activeDifficulty.value = 'all'
  activeSun.value = 'all'
  activeWater.value = 'all'
}

const filteredCatalog = computed(() => {
  return props.plants.filter(p => {
    const matchCat = props.activeCategory === 'all' || p.category === props.activeCategory
    const matchDiff = activeDifficulty.value === 'all' || p.difficulty === activeDifficulty.value
    const matchSun = activeSun.value === 'all' || (p.sun && p.sun.includes(activeSun.value))
    const matchWater = activeWater.value === 'all' || (p.water && p.water.includes(activeWater.value))
    const matchSearch = !props.search || p.name.toLowerCase().includes(props.search.toLowerCase())
    return matchCat && matchDiff && matchSun && matchWater && matchSearch
  })
})

function getCatLabel(catId: string): string {
  const categories: Record<string, string> = {
    'all': 'Все',
    'vegetable': '🥦 Овощи',
    'berry': '🍓 Ягоды',
    'tree': '🍎 Деревья',
    'shrub': '🫐 Кусты',
    'herb': '🌿 Зелень'
  }
  return categories[catId]?.replace(/^[^\wА-Яа-я]+/, '').trim() || catId
}

defineExpose({
  showFilters,
  activeFilterCount
})
</script>

<template>
  <div class="catalog-list">
    <!-- Filters Header Extension (controlled by parent search wrap conceptually, but placed here) -->
    <Transition name="filters-slide">
      <div v-if="showFilters" class="advanced-filters-box">
        <div class="filter-header">
          <span class="filter-box-title">Условия выращивания</span>
          <button v-if="activeFilterCount > 0" class="reset-filters-btn" @click="resetFilters">
            <RotateCcw :size="14" /> Сбросить
          </button>
        </div>

        <div class="filter-rows">
          <div class="filter-row">
            <span class="filter-label">Сложность</span>
            <div class="filter-pills">
              <button v-for="opt in filterOptions.difficulty" :key="opt.id" class="filter-pill"
                :class="{ active: activeDifficulty === opt.id }" @click="activeDifficulty = opt.id">{{ opt.label }}</button>
            </div>
          </div>

          <div class="filter-row">
            <span class="filter-label">Освещение</span>
            <div class="filter-pills">
              <button v-for="opt in filterOptions.sun" :key="opt.id" class="filter-pill"
                :class="{ active: activeSun === opt.id }" @click="activeSun = opt.id">{{ opt.label }}</button>
            </div>
          </div>

          <div class="filter-row">
            <span class="filter-label">Полив</span>
            <div class="filter-pills">
              <button v-for="opt in filterOptions.water" :key="opt.id" class="filter-pill"
                :class="{ active: activeWater === opt.id }" @click="activeWater = opt.id">{{ opt.label }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div v-if="loading" class="plants-grid">
      <div v-for="i in 6" :key="i" class="plant-card">
        <div style="padding: 16px;">
           <FpSkeleton height="24px" width="60%" class="mb-2" />
           <FpSkeleton height="16px" width="40%" class="mb-4" />
           <FpSkeleton height="40px" width="100%" />
        </div>
      </div>
    </div>
    
    <template v-else>
      <div class="count-label">{{ filteredCatalog.length }} культур</div>
      <div class="plants-grid">
        <div v-for="plant in filteredCatalog" :key="plant.id" class="plant-card"
          @click="router.push(`/plants/${plant.id}`)">
          <div class="card-top-row">
            <div class="emoji-wrapper">
              <span class="plant-emoji">{{ plant.emoji }}</span>
            </div>
            <div class="top-badges">
              <span v-if="plant.difficulty" class="diff-badge" :class="plant.difficulty">
                {{ plant.difficulty === 'easy' ? '🟢 Легко' : plant.difficulty === 'medium' ? '🟡 Средне' : '🔴 Сложно' }}
              </span>
              <button class="garden-toggle-btn" :class="{ active: userPlantIds.includes(plant.id) }"
                title="В моём саду" @click="emit('toggle-garden', plant, $event)">
                <BookmarkCheck v-if="userPlantIds.includes(plant.id)" :size="22" />
                <Bookmark v-else :size="22" />
              </button>
            </div>
          </div>
          <div class="card-main">
            <div class="plant-name">{{ plant.name }}</div>
            <div class="plant-latin" v-if="plant.latin_name">{{ plant.latin_name }}</div>
            <div class="plant-requirements" v-if="plant.sun || plant.water">
              <span class="req-pill" v-if="plant.sun" :title="plant.sun">
                <span class="req-icon">{{ plant.sun.split(' ')[0] }}</span>
                <span class="req-label">{{ plant.sun.split(' ').slice(1).join(' ') }}</span>
              </span>
              <span class="req-pill" v-if="plant.water" :title="plant.water">
                <span class="req-icon">{{ plant.water.split(' ')[0] }}</span>
                <span class="req-label">{{ plant.water.split(' ').slice(1).join(' ') }}</span>
              </span>
            </div>
            <p class="plant-desc" v-if="plant.description">{{ plant.description }}</p>
          </div>
          <div class="card-footer">
            <span class="category-pill" :class="plant.category">{{ getCatLabel(plant.category) }}</span>
            <span class="more-link">Подробнее
              <ChevronRight :size="16" />
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }

.count-label {
  font-size: 13px; font-weight: 700; color: var(--color-text-tertiary);
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; display: block;
}

.plants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.plant-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  display: flex; flex-direction: column; cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);
  &:hover {
    transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
  }
}

.card-top-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 16px 16px 0; margin-bottom: 12px;
}
.emoji-wrapper {
  width: 48px; height: 48px; border-radius: var(--radius-lg); background: rgba(45, 106, 79, 0.08);
  display: flex; align-items: center; justify-content: center;
  .plant-emoji { font-size: 24px; line-height: 1; }
  body.dark-theme & { background: rgba(45, 106, 79, 0.2); }
}

.top-badges { display: flex; align-items: center; gap: 8px; }

.diff-badge {
  font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: var(--radius-pill);
  background: var(--color-surface-hover); color: var(--color-text-secondary);
  &.easy { background: rgba(82, 183, 136, 0.15); color: #2D6A4F; body.dark-theme & { color: #52B788; } }
  &.medium { background: rgba(244, 162, 97, 0.15); color: #B05D1C; body.dark-theme & { color: #F4A261; } }
  &.hard { background: rgba(231, 111, 81, 0.15); color: #C93F21; body.dark-theme & { color: #E76F51; } }
}

.garden-toggle-btn {
  background: transparent; border: none; padding: 4px; color: var(--color-text-tertiary);
  cursor: pointer; transition: color 0.2s; display: flex; align-items: center; justify-content: center;
  &:hover { color: var(--color-text-secondary); }
  &.active { color: var(--color-primary); }
}

.card-main { padding: 0 16px 16px; flex: 1; display: flex; flex-direction: column; }
.plant-name { font-size: 18px; font-weight: 800; color: var(--color-text-primary); margin-bottom: 2px; }
.plant-latin { font-size: 12px; font-style: italic; color: var(--color-text-tertiary); margin-bottom: 10px; }

.plant-requirements {
  display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;
}
.req-pill {
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--color-background); border: 1px solid var(--color-border);
  padding: 4px 8px; border-radius: var(--radius-sm); font-size: 11px; font-weight: 600; color: var(--color-text-secondary);
}

.plant-desc {
  font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; margin: 0;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}

.card-footer {
  padding: 12px 16px; border-top: 1px solid var(--color-border); background: rgba(0,0,0,0.01);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl); display: flex; justify-content: space-between; align-items: center;
}
.category-pill {
  font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--color-text-secondary);
}
.more-link {
  font-size: 13px; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 2px;
}

/* Расширенные фильтры */
.advanced-filters-box {
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl);
  padding: 16px; margin-bottom: 16px; box-shadow: var(--shadow-sm); overflow: hidden;
}
.filters-slide-enter-active, .filters-slide-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); max-height: 500px; opacity: 1; }
.filters-slide-enter-from, .filters-slide-leave-to { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; margin-bottom: 0; border-width: 0; }
.filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filter-box-title { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }
.reset-filters-btn {
  background: none; border: none; font-size: 12px; font-weight: 600; color: var(--color-text-tertiary);
  display: flex; align-items: center; gap: 4px; cursor: pointer; transition: color 0.15s;
  &:hover { color: var(--color-text-primary); }
}
.filter-rows { display: flex; flex-direction: column; gap: 16px; }
.filter-row { display: flex; flex-direction: column; gap: 8px; }
.filter-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.filter-pills { display: flex; flex-wrap: wrap; gap: 8px; }
.filter-pill {
  background: var(--color-background); border: 1px solid var(--color-border); color: var(--color-text-secondary);
  padding: 6px 12px; border-radius: var(--radius-pill); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
  &:hover { background: var(--color-surface-hover); }
  &.active { background: var(--color-primary); border-color: var(--color-primary); color: white; font-weight: 600; }
}
</style>
