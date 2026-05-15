<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { PlantService, type Plant } from '@/modules/plants/services/PlantService'

const router = useRouter()
const search = ref('')
const activeCategory = ref('all')
const plants = ref<Plant[]>([])
const loading = ref(true)

const categories = [
  { id: 'all', label: 'Все' },
  { id: 'vegetable', label: '🥦 Овощи' },
  { id: 'berry', label: '🍓 Ягоды' },
  { id: 'tree', label: '🍎 Деревья' },
  { id: 'shrub', label: '🫐 Кусты' },
  { id: 'herb', label: '🌿 Зелень' }
]

const filtered = computed(() => {
  return plants.value.filter(p => {
    const matchCat = activeCategory.value === 'all' || p.category === activeCategory.value
    const matchSearch = !search.value || p.name.toLowerCase().includes(search.value.toLowerCase())
    return matchCat && matchSearch
  })
})

onMounted(async () => {
  try {
    plants.value = await PlantService.getAll()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="plants-view">
    <div class="page-header">
      <h1 class="header-title">Растения</h1>
    </div>

    <div class="search-wrap">
      <Search :size="16" class="search-icon" />
      <input v-model="search" class="search-input" placeholder="Поиск растения..." />
    </div>

    <div class="categories-scroll">
      <button
        v-for="cat in categories" :key="cat.id"
        class="cat-btn" :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >{{ cat.label }}</button>
    </div>

    <div v-if="loading" class="plants-grid">
      <div v-for="i in 6" :key="i" class="plant-card skeleton-card"></div>
    </div>

    <template v-else>
      <div class="count-label">{{ filtered.length }} культур</div>
      <div class="plants-grid">
        <div
          v-for="plant in filtered" :key="plant.id"
          class="plant-card"
          @click="router.push(`/plants/${plant.id}`)"
        >
          <div class="plant-emoji">{{ plant.emoji }}</div>
          <div class="plant-name">{{ plant.name }}</div>
          <div class="plant-latin">{{ plant.latin_name }}</div>
          <ChevronRight :size="14" class="plant-arrow" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.plants-view { padding: 16px 16px 24px; }
.page-header { margin-bottom: 16px; }
.header-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

.search-wrap {
  position: relative; margin-bottom: 14px;
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); }
  .search-input {
    width: 100%; padding: 10px 12px 10px 36px;
    border: 1px solid var(--color-border); border-radius: var(--radius-md);
    background: var(--color-surface); font-size: 14px; color: var(--color-text-primary);
    outline: none; box-sizing: border-box;
    &:focus { border-color: var(--color-primary); }
  }
}

.categories-scroll {
  display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 14px;
  scrollbar-width: none; &::-webkit-scrollbar { display: none; }
}
.cat-btn {
  flex-shrink: 0; padding: 6px 14px; border-radius: var(--radius-pill);
  border: 1px solid var(--color-border); background: var(--color-surface);
  font-size: 13px; color: var(--color-text-secondary); cursor: pointer;
  &.active { background: var(--color-primary); color: var(--color-on-primary); border-color: var(--color-primary); }
}

.count-label { font-size: 12px; color: var(--color-text-tertiary); margin-bottom: 12px; }

.plants-grid { display: flex; flex-direction: column; gap: 8px; }

.plant-card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 12px 14px;
  display: grid; grid-template-columns: 36px 1fr auto; grid-template-rows: auto auto;
  column-gap: 10px; align-items: center; cursor: pointer; transition: background 0.15s;
  &:active { background: var(--color-surface-hover); }
  &.skeleton-card { height: 64px; background: var(--color-border); opacity: 0.4; cursor: default; }
}
.plant-emoji { font-size: 26px; grid-row: 1 / 3; }
.plant-name { font-size: 15px; font-weight: 600; color: var(--color-text-primary); }
.plant-latin { font-size: 12px; color: var(--color-text-tertiary); font-style: italic; }
.plant-arrow { grid-row: 1 / 3; color: var(--color-text-disabled); }
</style>
