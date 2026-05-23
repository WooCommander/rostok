<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Search, ChevronRight, ChevronLeft, SlidersHorizontal } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { usePlantsState } from '@/modules/plants/state/usePlantsState'
import CatalogList from '@/modules/plants/ui/CatalogList.vue'
import GardenList from '@/modules/plants/ui/GardenList.vue'
import EditPlantModal from '@/modules/plants/ui/EditPlantModal.vue'
import { authStore } from '@/modules/auth/store/authStore'
import { type Plant, type UserPlant, PlantService } from '@/modules/plants/services/PlantService'
import FpPullToRefresh from '@/design-system/components/FpPullToRefresh.vue'
import FpPaywallModal from '@/design-system/components/FpPaywallModal.vue'

const router = useRouter()
const { plants, userPlantsList, userPlantIds, loading, loadData, toggleUserPlant, addAnotherInstance, updateInstance, removeInstance } = usePlantsState()

const search = ref('')
const activeCategory = ref('all')
const activeTab = ref<'catalog' | 'garden'>('catalog')

const showPaywall = ref(false)

const categories = [
  { id: 'all', label: 'Все' },
  { id: 'vegetable', label: '🥦 Овощи' },
  { id: 'berry', label: '🍓 Ягоды' },
  { id: 'tree', label: '🍎 Деревья' },
  { id: 'shrub', label: '🫐 Кусты' },
  { id: 'herb', label: '🌿 Зелень' }
]

// Modal state
const isEditModalOpen = ref(false)
const editingPlant = ref<UserPlant | null>(null)
const savingModal = ref(false)

const showTimelapseModal = ref(false)
const timelapsePhotos = ref<{url: string; createdAt: string}[]>([])
const loadingTimelapse = ref(false)

const catalogListRef = ref<InstanceType<typeof CatalogList> | null>(null)

const activeFilterCount = computed(() => {
  return catalogListRef.value?.activeFilterCount || 0
})

function toggleFilters() {
  if (catalogListRef.value) {
    catalogListRef.value.showFilters = !catalogListRef.value.showFilters
  }
}

async function handleToggleGarden(plant: Plant, event: Event) {
  event.stopPropagation()
  if (!authStore.user.value) {
    router.push('/login')
    return
  }
  try {
    await toggleUserPlant(plant.id)
  } catch (e: any) {
    if (e.message === 'PREMIUM_REQUIRED_PLANT') {
      showPaywall.value = true
    } else {
      console.error('Ошибка изменения списка сада:', e)
    }
  }
}

function openEditModal(uPlant: UserPlant, event?: Event) {
  if (event) event.stopPropagation()
  editingPlant.value = uPlant
  isEditModalOpen.value = true
}

async function handleSaveEdit(updates: Partial<UserPlant>) {
  if (!editingPlant.value) return
  savingModal.value = true
  try {
    await updateInstance(editingPlant.value.id, updates)
    isEditModalOpen.value = false
  } catch (e) {
    console.error(e)
  } finally {
    savingModal.value = false
  }
}

async function handleDeleteInstance(id: string) {
  savingModal.value = true
  try {
    await removeInstance(id)
    isEditModalOpen.value = false
  } catch (e) {
    console.error(e)
  } finally {
    savingModal.value = false
  }
}

async function handleAddInstance(plantId?: string) {
  if (!plantId) return
  savingModal.value = true
  try {
    const newInst = await addAnotherInstance(plantId)
    openEditModal(newInst)
  } catch (e: any) {
    if (e.message === 'PREMIUM_REQUIRED_PLANT') {
      showPaywall.value = true
    } else {
      console.error(e)
    }
  } finally {
    savingModal.value = false
  }
}

async function handleOpenTimelapse() {
  if (!editingPlant.value) return
  loadingTimelapse.value = true
  showTimelapseModal.value = true
  try {
    timelapsePhotos.value = await PlantService.getGardenPhotos(editingPlant.value.id)
  } catch (err) {
    console.error('Ошибка загрузки истории фото:', err)
  } finally {
    loadingTimelapse.value = false
  }
}

function handlePhotoUploaded(url: string) {
  if (editingPlant.value) {
    editingPlant.value.photo_url = url
    updateInstance(editingPlant.value.id, { photo_url: url })
  }
}

// Sticky header logic
const isScrolled = ref(false)
function onWindowScroll() {
  isScrolled.value = window.scrollY > 20
}

const categoriesScrollRef = ref<HTMLElement | null>(null)
const showCatLeft = ref(false)
const showCatRight = ref(false)

function checkCatScroll() {
  const el = categoriesScrollRef.value
  if (!el) return
  showCatLeft.value = el.scrollLeft > 10
  showCatRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10
}

function scrollCategoriesBy(amount: number) {
  const el = categoriesScrollRef.value
  if (!el) return
  el.scrollBy({ left: amount, behavior: 'smooth' })
}

async function onRefresh(done: () => void) {
  try {
    await loadData(true)
  } catch (err) {
    console.error('Ошибка Pull-to-refresh на экране Растения:', err)
  } finally {
    done()
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  setTimeout(checkCatScroll, 100)
  window.addEventListener('resize', checkCatScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
  window.removeEventListener('resize', checkCatScroll)
})
</script>

<template>
  <FpPullToRefresh @refresh="onRefresh">
    <div class="plants-view">

      <div class="sticky-header-container" :class="{ 'is-scrolled': isScrolled }">
        <div class="page-header">
          <h1 class="header-title">Растения</h1>
        </div>

        <div class="tabs-wrap">
          <button class="tab-btn" :class="{ active: activeTab === 'catalog' }" @click="activeTab = 'catalog'">
            Каталог
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'garden' }" @click="activeTab = 'garden'">
            Мой огород
            <span v-if="userPlantsList.length" class="badge">{{ userPlantsList.length }}</span>
          </button>
        </div>

        <div class="search-wrap">
          <Search :size="16" class="search-icon" />
          <input v-model="search" class="search-input"
            :placeholder="activeTab === 'garden' ? 'Поиск грядки, сорта, культуры...' : 'Поиск растения...'" />
          <button v-if="activeTab === 'catalog'" class="filter-toggle-btn"
            :class="{ active: catalogListRef?.showFilters || activeFilterCount > 0 }" @click="toggleFilters"
            title="Фильтры по условиям">
            <SlidersHorizontal :size="16" />
            <span v-if="activeFilterCount > 0" class="filter-count-badge">{{ activeFilterCount }}</span>
          </button>
        </div>

        <div class="scroll-container-wrapper" @mouseenter="checkCatScroll">
          <button v-show="showCatLeft" class="scroll-arrow left" @click="scrollCategoriesBy(-200)"
            title="Прокрутить влево">
            <ChevronLeft :size="18" />
          </button>

          <div class="categories-scroll" ref="categoriesScrollRef" @scroll="checkCatScroll">
            <button v-for="cat in categories" :key="cat.id" class="cat-btn"
              :class="{ active: activeCategory === cat.id }" @click="activeCategory = cat.id">{{ cat.label }}</button>
          </div>

          <button v-show="showCatRight" class="scroll-arrow right" @click="scrollCategoriesBy(200)"
            title="Прокрутить вправо">
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'catalog'">
        <CatalogList 
          ref="catalogListRef"
          :plants="plants" 
          :user-plant-ids="userPlantIds" 
          :search="search" 
          :active-category="activeCategory"
          :loading="loading"
          @toggle-garden="handleToggleGarden"
        />
      </div>
      <div v-else>
        <GardenList 
          :plants="plants" 
          :user-plants-list="userPlantsList" 
          :search="search" 
          :active-category="activeCategory"
          @go-to-catalog="activeTab = 'catalog'"
          @add-instance="handleAddInstance"
          @edit-instance="openEditModal"
          @delete-instance="handleDeleteInstance"
        />
      </div>

      <!-- Модалки -->
      <EditPlantModal 
        v-model="isEditModalOpen"
        :plant-data="editingPlant"
        :saving="savingModal"
        @save="handleSaveEdit"
        @delete="handleDeleteInstance"
        @add-instance="handleAddInstance"
        @open-timelapse="handleOpenTimelapse"
        @photo-uploaded="handlePhotoUploaded"
      />

      <div v-if="showTimelapseModal" class="modal-backdrop timelapse-backdrop" @click="showTimelapseModal = false">
        <div class="modal-box timelapse-box" @click.stop>
          <div class="modal-header">
            <h3>История роста</h3>
            <button class="close-btn" @click="showTimelapseModal = false">✕</button>
          </div>
          <div class="modal-body timelapse-body">
            <div v-if="loadingTimelapse" class="timelapse-loading">
              <span>Загрузка архива...</span>
            </div>
            <div v-else-if="timelapsePhotos.length === 0" class="timelapse-empty">
              Нет предыдущих фотографий. Загружайте новые фото, чтобы увидеть историю!
            </div>
            <div v-else class="timelapse-feed">
              <div v-for="(photo, idx) in timelapsePhotos" :key="photo.url" class="timelapse-item">
                <div class="timelapse-meta">
                  <span class="timelapse-step">Этап {{ idx + 1 }}</span>
                  <span class="timelapse-date">{{ new Date(photo.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
                </div>
                <div class="timelapse-img-wrapper">
                  <img :src="photo.url" class="timelapse-img" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FpPaywallModal
        v-if="showPaywall"
        @close="showPaywall = false"
        @subscribe="router.push('/profile')"
      />

    </div>
  </FpPullToRefresh>
</template>

<style scoped lang="scss">
.plants-view {
  padding: 16px 16px 24px;
}

.sticky-header-container {
  position: sticky;
  top: 56px;
  z-index: 20;
  background: var(--color-background);
  padding: 16px 16px 12px;
  margin: -16px -16px 16px;
  transition: box-shadow 0.3s, background 0.3s, backdrop-filter 0.3s;

  &.is-scrolled {
    background: rgba(18, 26, 22, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.page-header { margin-bottom: 16px; }
.header-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

.tabs-wrap {
  display: flex; background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 4px; margin-bottom: 16px;
}
.tab-btn {
  flex: 1; padding: 10px; border: none; background: transparent; border-radius: var(--radius-md);
  font-size: 14px; font-weight: 600; color: var(--color-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s;
  &.active { background: var(--color-primary); color: var(--color-on-primary); }
  .badge { background: color-mix(in srgb, currentColor 20%, transparent); padding: 2px 8px; border-radius: 99px; font-size: 11px; }
}

.search-wrap {
  position: relative; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); z-index: 2; }
  .search-input {
    flex: 1; padding: 10px 12px 10px 36px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
    background: var(--color-surface); font-size: 14px; color: var(--color-text-primary); outline: none; width: 100%;
    &:focus { border-color: var(--color-primary); }
  }
  .filter-toggle-btn {
    position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
    border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface);
    color: var(--color-text-secondary); cursor: pointer; flex-shrink: 0; transition: all 0.15s;
    &:hover { border-color: var(--color-primary); color: var(--color-primary); }
    &.active { background: rgba(45, 106, 79, 0.1); border-color: var(--color-primary); color: var(--color-primary); }
    .filter-count-badge { position: absolute; top: -6px; right: -6px; background: var(--color-primary); color: white; font-size: 10px; font-weight: 800; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--color-background); }
  }
}

.scroll-container-wrapper { position: relative; display: flex; align-items: center; }
.categories-scroll {
  display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; scroll-behavior: smooth; flex: 1;
  &::-webkit-scrollbar { display: none; }
}
.cat-btn {
  background: var(--color-surface); border: 1px solid var(--color-border); padding: 8px 16px; border-radius: var(--radius-pill);
  font-size: 14px; font-weight: 600; color: var(--color-text-secondary); cursor: pointer; white-space: nowrap; transition: all 0.15s;
  &:hover { background: var(--color-surface-hover); }
  &.active { background: var(--color-primary); border-color: var(--color-primary); color: white; }
}
.scroll-arrow {
  position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 32px; height: 32px; border-radius: 50%;
  background: var(--color-surface); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary); cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  &.left { left: -8px; } &.right { right: -8px; }
  &:hover { background: var(--color-surface-hover); color: var(--color-primary); }
}

/* Timelapse Modal styles retained from original */
.modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; backdrop-filter: blur(4px); }
.modal-box { background: var(--color-background); border-radius: var(--radius-xl); width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
.modal-header { padding: 16px 20px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; h3 { margin: 0; font-size: 18px; font-weight: 700; } .close-btn { background: none; border: none; font-size: 20px; color: var(--color-text-tertiary); cursor: pointer; } }
.modal-body { padding: 20px; overflow-y: auto; }
.timelapse-loading, .timelapse-empty { text-align: center; padding: 40px 20px; color: var(--color-text-secondary); }
.timelapse-feed { display: flex; flex-direction: column; gap: 24px; padding: 8px 0; }
.timelapse-item { display: flex; flex-direction: column; gap: 8px; }
.timelapse-meta { display: flex; justify-content: space-between; align-items: baseline; }
.timelapse-step { font-weight: 700; color: var(--color-text-primary); font-size: 15px; }
.timelapse-date { font-size: 12px; color: var(--color-text-tertiary); font-weight: 500; }
.timelapse-img-wrapper { width: 100%; border-radius: var(--radius-lg); overflow: hidden; background: var(--color-surface); border: 1px solid var(--color-border); }
.timelapse-img { width: 100%; display: block; object-fit: cover; }
</style>
