<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, ChevronRight, ChevronLeft, Bookmark, BookmarkCheck, Trash2, Plus, Camera, UploadCloud, SlidersHorizontal, RotateCcw } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { PlantService, type Plant, type UserPlant } from '@/modules/plants/services/PlantService'
import { authStore } from '@/modules/auth/store/authStore'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import FpPullToRefresh from '@/design-system/components/FpPullToRefresh.vue'


const router = useRouter()
const search = ref('')
const activeCategory = ref('all')
const activeTab = ref<'catalog' | 'garden'>('catalog')
const plants = ref<Plant[]>([])
const userPlantsList = ref<UserPlant[]>([])
const loading = ref(true)

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

const categories = [
  { id: 'all', label: 'Все' },
  { id: 'vegetable', label: '🥦 Овощи' },
  { id: 'berry', label: '🍓 Ягоды' },
  { id: 'tree', label: '🍎 Деревья' },
  { id: 'shrub', label: '🫐 Кусты' },
  { id: 'herb', label: '🌿 Зелень' }
]

function getCatLabel(catId: string): string {
  const found = categories.find(c => c.id === catId)
  return found ? found.label.replace(/^[^\wА-Яа-я]+/, '').trim() : catId
}

const userPlantIds = computed(() => userPlantsList.value.map(u => u.plant_id))

const filteredCatalog = computed(() => {
  return plants.value.filter(p => {
    const matchCat = activeCategory.value === 'all' || p.category === activeCategory.value
    const matchDiff = activeDifficulty.value === 'all' || p.difficulty === activeDifficulty.value
    const matchSun = activeSun.value === 'all' || (p.sun && p.sun.includes(activeSun.value))
    const matchWater = activeWater.value === 'all' || (p.water && p.water.includes(activeWater.value))
    const matchSearch = !search.value || p.name.toLowerCase().includes(search.value.toLowerCase())
    return matchCat && matchDiff && matchSun && matchWater && matchSearch
  })
})

const groupedGarden = computed(() => {
  const groups = new Map<string, { plant: Plant; instances: UserPlant[] }>()
  for (const u of userPlantsList.value) {
    const p = u.plant || plants.value.find(item => item.id === u.plant_id)
    if (!p) continue

    const matchCat = activeCategory.value === 'all' || p.category === activeCategory.value
    const s = search.value.toLowerCase().trim()
    const matchSearch = !s ||
      p.name.toLowerCase().includes(s) ||
      (u.nickname && u.nickname.toLowerCase().includes(s)) ||
      (u.location_note && u.location_note.toLowerCase().includes(s))

    if (!matchCat || !matchSearch) continue

    if (!groups.has(p.id)) {
      groups.set(p.id, { plant: p, instances: [] })
    }
    groups.get(p.id)!.instances.push(u)
  }
  return Array.from(groups.values())
})

const editingPlant = ref<UserPlant | null>(null)
const editForm = ref({ nickname: '', location_note: '', planted_at: '', days_to_harvest: '' as string | number })
const savingModal = ref(false)
const uploadingPhoto = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const showTimelapseModal = ref(false)
const timelapsePhotos = ref<{url: string; createdAt: string}[]>([])
const loadingTimelapse = ref(false)

async function openTimelapse() {
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

function triggerPhotoSelect() {
  fileInputRef.value?.click()
}

async function onPhotoSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !editingPlant.value) return
  uploadingPhoto.value = true
  try {
    const url = await PlantService.uploadGardenPhoto(file, editingPlant.value.id)
    if (url) {
      editingPlant.value.photo_url = url
      const itemInList = userPlantsList.value.find(u => u.id === editingPlant.value?.id)
      if (itemInList) itemInList.photo_url = url
    }
  } catch (err) {
    console.error('Ошибка загрузки фото:', err)
  } finally {
    uploadingPhoto.value = false
  }
}

function openEditModal(u: UserPlant, event: Event) {
  event.stopPropagation()
  editingPlant.value = { ...u }
  editForm.value = {
    nickname: u.nickname || '',
    location_note: u.location_note || '',
    planted_at: u.planted_at ? u.planted_at.split('T')[0] : '',
    days_to_harvest: u.days_to_harvest || ''
  }
}

function closeEditModal() {
  editingPlant.value = null
}

async function saveEditPlant() {
  if (!editingPlant.value) return
  savingModal.value = true
  try {
    const updated = await PlantService.updateUserPlant(editingPlant.value.id, {
      nickname: editForm.value.nickname || null,
      location_note: editForm.value.location_note || null,
      planted_at: editForm.value.planted_at || null,
      days_to_harvest: editForm.value.days_to_harvest ? Number(editForm.value.days_to_harvest) : null
    })
    const idx = userPlantsList.value.findIndex(u => u.id === updated.id)
    if (idx !== -1) userPlantsList.value[idx] = updated
    closeEditModal()
  } catch (e) {
    console.error(e)
  } finally {
    savingModal.value = false
  }
}

const showDeleteConfirm = ref(false)
const plantToDelete = ref<string | null>(null)

function confirmDelete(id: string) {
  plantToDelete.value = id
  showDeleteConfirm.value = true
}

async function onConfirmDelete() {
  if (!plantToDelete.value) return
  savingModal.value = true
  const id = plantToDelete.value
  showDeleteConfirm.value = false
  try {
    await PlantService.removeUserPlant(id)
    userPlantsList.value = userPlantsList.value.filter(u => u.id !== id)
    closeEditModal()
  } catch (e) {
    console.error(e)
  } finally {
    savingModal.value = false
    plantToDelete.value = null
  }
}

async function addAnotherInstance(plantId?: string) {
  if (!plantId) return
  savingModal.value = true
  try {
    const newInst = await PlantService.addUserPlantInstance(plantId)
    userPlantsList.value.push(newInst)
    openEditModal(newInst, new Event('click'))
  } catch (e: any) {
    if (e.message === 'PREMIUM_REQUIRED_PLANT') {
      alert('В бесплатной версии можно добавить только 1 грядку. Оформите Premium-подписку в Профиле!')
    } else {
      console.error(e)
    }
  } finally {
    savingModal.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const [allPlants, myPlants] = await Promise.all([
      PlantService.getAll(),
      PlantService.getUserPlants()
    ])
    plants.value = allPlants
    userPlantsList.value = myPlants
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function toggleGardenCatalog(plant: Plant, event: Event) {
  event.stopPropagation()
  if (!authStore.user.value) {
    router.push('/login')
    return
  }
  try {
    const isNowInGarden = await PlantService.toggleUserPlant(plant.id)
    if (isNowInGarden) {
      if (!userPlantIds.value.includes(plant.id)) {
        const newInst = await PlantService.addUserPlantInstance(plant.id)
        userPlantsList.value.push(newInst)
      }
    } else {
      const toDel = userPlantsList.value.filter(u => u.plant_id === plant.id)
      for (const item of toDel) {
        await PlantService.removeUserPlant(item.id)
      }
      userPlantsList.value = userPlantsList.value.filter(u => u.plant_id !== plant.id)
    }
  } catch (e: any) {
    if (e.message === 'PREMIUM_REQUIRED_PLANT') {
      alert('В бесплатной версии можно добавить только 1 грядку. Оформите Premium-подписку в Профиле!')
    } else {
      console.error('Ошибка изменения списка сада:', e)
    }
  }
}

function getPlantObj(u: UserPlant) {
  return u.plant || plants.value.find(item => item.id === u.plant_id)
}

function getHarvestProgress(u: UserPlant) {
  if (!u.planted_at || !u.days_to_harvest) return null
  const planted = new Date(u.planted_at)
  const now = new Date()
  const diffTime = now.getTime() - planted.getTime()
  if (diffTime < 0) return null
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  const remaining = Math.max(0, u.days_to_harvest - diffDays)
  const percent = Math.min(100, Math.round((diffDays / u.days_to_harvest) * 100))

  let status = 'normal'
  if (remaining <= 14 && remaining > 0) status = 'warning'
  if (remaining === 0) status = 'ready'

  return { remaining, percent, status }
}

function formatDateDisplay(d?: string | null): string {
  if (!d) return ''
  try {
    const date = new Date(d)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

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
    await loadData()
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

        <!-- Tabs -->
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
            :class="{ active: showFilters || activeFilterCount > 0 }" @click="showFilters = !showFilters"
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

        <!-- Расширенные фильтры -->
        <Transition name="filters-slide">
          <div v-if="showFilters && activeTab === 'catalog'" class="advanced-filters-box">
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
                    :class="{ active: activeDifficulty === opt.id }" @click="activeDifficulty = opt.id">{{ opt.label
                    }}</button>
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
      </div>

      <div v-if="loading" class="plants-grid">
        <div v-for="i in 6" :key="i" class="plant-card skeleton-card"></div>
      </div>

      <!-- Вкладка Огород: Пусто -->
      <div v-else-if="activeTab === 'garden' && userPlantsList.length === 0" class="empty-garden">
        <div class="empty-emoji">🌱</div>
        <h3>В твоём саду пока пусто</h3>
        <p>Выбери культуры из общего каталога, чтобы настроить сорта, расположение грядок и вести по ним точный журнал!
        </p>
        <button class="catalog-btn" @click="activeTab = 'catalog'">Перейти в каталог</button>
      </div>

      <!-- Вкладка Огород: Список -->
      <template v-else-if="activeTab === 'garden'">
        <div class="garden-header-bar">
          <span class="count-label">{{ userPlantsList.length }} грядок (в {{ groupedGarden.length }} группах)</span>
          <button class="add-bed-btn" @click="activeTab = 'catalog'">
            <Plus :size="16" /> Из каталога
          </button>
        </div>

        <div class="grouped-garden-container">
          <div v-for="group in groupedGarden" :key="group.plant.id" class="garden-group-card">
            <div class="group-header" @click="router.push(`/plants/${group.plant.id}`)">
              <div class="group-title-left">
                <span class="group-emoji">{{ group.plant.emoji }}</span>
                <h2 class="group-name">{{ group.plant.name }}</h2>
                <span class="instance-count">{{ group.instances.length }} шт.</span>
              </div>
              <div class="group-actions">
                <button class="add-instance-btn" @click.stop="addAnotherInstance(group.plant.id)"
                  title="Добавить экземпляр">
                  <Plus :size="16" /> Добавить
                </button>
                <ChevronRight :size="20" class="arrow-icon" />
              </div>
            </div>

            <div class="group-instances-grid">
              <div v-for="(uPlant, idx) in group.instances" :key="uPlant.id" class="instance-card"
                @click="openEditModal(uPlant, $event)">
                <div v-if="uPlant.photo_url" class="inst-photo"
                  :style="{ backgroundImage: `url(${uPlant.photo_url})` }"></div>
                <div v-else class="inst-icon-placeholder">🌱</div>
                <div class="inst-info">
                  <div class="inst-head-row">
                    <h4 class="inst-nickname">{{ uPlant.nickname || `${group.plant.name} #${idx + 1}` }}</h4>
                  </div>
                  <div class="inst-tags">
                    <span v-if="uPlant.location_note" class="tag-loc">📍 {{ uPlant.location_note }}</span>
                    <span v-if="uPlant.planted_at" class="tag-date">📅 {{ formatDateDisplay(uPlant.planted_at) }}</span>
                    <span v-if="!uPlant.location_note && !uPlant.planted_at" class="tag-empty">✏️ Указать
                      сорт/грядку</span>
                  </div>

                  <div v-if="getHarvestProgress(uPlant)" class="harvest-progress-container">
                    <div class="harvest-bar-bg">
                      <div class="harvest-bar-fill" :class="getHarvestProgress(uPlant)!.status"
                        :style="{ width: getHarvestProgress(uPlant)!.percent + '%' }"></div>
                    </div>
                    <div class="harvest-info">
                      <span v-if="getHarvestProgress(uPlant)!.status === 'ready'" class="harvest-ready">🍅 Урожай
                        готов!</span>
                      <span v-else-if="getHarvestProgress(uPlant)!.status === 'warning'" class="harvest-warning">⚠️ {{
                        getHarvestProgress(uPlant)!.remaining }} дн. (переходите на био!)</span>
                      <span v-else>До сбора: {{ getHarvestProgress(uPlant)!.remaining }} дн.</span>
                    </div>
                  </div>
                </div>
                <button class="delete-inst-btn" @click.stop="confirmDelete(uPlant.id)" title="Удалить">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Вкладка Каталог: Список -->
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
                  title="В моём саду" @click="toggleGardenCatalog(plant, $event)">
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

      <!-- Модальное окно редактирования UserPlant -->
      <div v-if="editingPlant" class="modal-backdrop" @click="closeEditModal">
        <div class="modal-box" @click.stop>
          <div class="modal-header">
            <h3>Настройка грядки</h3>
            <button class="close-btn" @click="closeEditModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="photo-field">
              <label>Фотография грядки / растения</label>
              <div class="photo-preview-box"
                :style="{ backgroundImage: editingPlant.photo_url ? `url(${editingPlant.photo_url})` : 'none' }">
                <div v-if="!editingPlant.photo_url" class="no-photo-placeholder">
                  <Camera :size="28" />
                  <span>Фото не добавлено</span>
                </div>
                <button class="upload-photo-btn" @click="triggerPhotoSelect" :disabled="uploadingPhoto">
                  <UploadCloud :size="18" />
                  <span>{{ uploadingPhoto ? 'Загрузка...' : (editingPlant.photo_url ? 'Заменить фото' : 'Загрузить фото') }}</span>
                </button>
              </div>
              <button class="timelapse-btn" v-if="editingPlant.photo_url" @click="openTimelapse">
                📸 История роста (Таймлапс)
              </button>
              <input type="file" accept="image/*" ref="fileInputRef" style="display:none" @change="onPhotoSelected" />
            </div>

            <div class="field">
              <label>Сорт / Название грядки</label>
              <input v-model="editForm.nickname" class="modal-input" placeholder="Например: Бычье сердце, Черри..." />
            </div>
            <div class="field">
              <label>Где растёт</label>
              <input v-model="editForm.location_note" class="modal-input" placeholder="Теплица №1, Южная клумба..." />
            </div>
            <div class="field">
              <label>Дата посадки</label>
              <input type="date" v-model="editForm.planted_at" class="modal-input" />
            </div>
            <div class="field">
              <label>Дней до первого урожая (от посадки)</label>
              <input type="number" v-model="editForm.days_to_harvest" class="modal-input" placeholder="Например: 90" />
            </div>

            <div class="modal-extra-actions">
              <button class="add-inst-btn" @click="addAnotherInstance(editingPlant?.plant_id)" :disabled="savingModal">
                <Plus :size="16" /> Добавить ещё одну грядку/сорт {{ getPlantObj(editingPlant)?.name.toLowerCase() }}
              </button>
            </div>

            <div class="modal-actions">
              <button class="delete-btn" @click="confirmDelete(editingPlant.id)" :disabled="savingModal">
                <Trash2 :size="18" /> Удалить
              </button>
              <button class="save-btn" @click="saveEditPlant" :disabled="savingModal">
                {{ savingModal ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Модальное окно истории роста (Таймлапс) -->
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

      <!-- Подтверждение удаления -->
      <ConfirmDialog v-model="showDeleteConfirm" title="Удаление грядки"
        message="Вы уверены, что хотите удалить эту грядку/культуру из вашего огорода? Вся связанная с ней история и записи будут удалены."
        confirmText="Удалить" cancelText="Отмена" :isDanger="true" @confirm="onConfirmDelete" />
    </div>
  </FpPullToRefresh>
</template>


<style scoped lang="scss">
.plants-view {
  padding: 16px 16px 24px;
}

/* ── STICKY HEADER ── */
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

.page-header {
  margin-bottom: 16px;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.tabs-wrap {
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 4px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
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

.search-wrap {
  position: relative;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-tertiary);
    z-index: 2;
  }

  .search-input {
    flex: 1;
    padding: 10px 12px 10px 36px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: 14px;
    color: var(--color-text-primary);
    outline: none;
    box-sizing: border-box;
    width: 100%;

    &:focus {
      border-color: var(--color-primary);
    }
  }

  .filter-toggle-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-primary);
      border-color: var(--color-primary);
    }

    &.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }

    .filter-count-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #E76F51;
      color: white;
      font-size: 10px;
      font-weight: 800;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}

/* ── ADVANCED FILTERS BOX ── */
.advanced-filters-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-md);
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .filter-box-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
  }

  .reset-filters-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: none;
    color: var(--color-error);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;

    &:hover {
      background: color-mix(in srgb, var(--color-error) 10%, transparent);
    }
  }
}

.filter-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .filter-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-tertiary);
  }

  .filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .filter-pill {
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-border);
    background: var(--color-background);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.15s;

    &:hover:not(.active) {
      background: var(--color-surface-hover);
      color: var(--color-text-primary);
      border-color: var(--color-primary-subtle, rgba(45, 106, 79, 0.4));
    }

    &.active {
      background: var(--color-primary);
      color: var(--color-on-primary);
      border-color: var(--color-primary);
    }
  }
}

.filters-slide-enter-active,
.filters-slide-leave-active {
  transition: all 0.25s ease-out;
}

.filters-slide-enter-from,
.filters-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.timelapse-btn {
  width: 100%;
  margin-top: 12px;
  background: rgba(45, 106, 79, 0.1);
  border: 1px solid rgba(45, 106, 79, 0.2);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  padding: 10px;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(45, 106, 79, 0.2);
  }
}

.timelapse-backdrop {
  z-index: 2500;
}

.timelapse-box {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.timelapse-body {
  overflow-y: auto;
  padding-bottom: 24px;
  background: var(--color-background);
}

.timelapse-loading, .timelapse-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.timelapse-feed {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 12px;
}

.timelapse-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timelapse-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.timelapse-step {
  font-size: 12px;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  background: rgba(45, 106, 79, 0.1);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.timelapse-date {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.timelapse-img-wrapper {
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  background: var(--color-surface);
}

.timelapse-img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ── HORIZONTAL CATEGORIES SCROLL ── */
.scroll-container-wrapper {
  position: relative;
  display: flex;
  align-items: center;
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

  &.left {
    left: -4px;
  }

  &.right {
    right: -4px;
  }
}

.categories-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 4px 0;
  width: 100%;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.cat-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;

  &.active {
    background: var(--color-primary);
    color: var(--color-on-primary);
    border-color: var(--color-primary);
    font-weight: 600;
  }

  &:hover:not(.active) {
    border-color: var(--color-primary-subtle, rgba(45, 106, 79, 0.4));
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }
}

.count-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: 12px;
}

.empty-garden {
  text-align: center;
  padding: 48px 20px;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  margin-top: 16px;

  .empty-emoji {
    font-size: 48px;
    margin-bottom: 12px;
  }

  h3 {
    font-size: 18px;
    margin: 0 0 8px;
    color: var(--color-text-primary);
  }

  p {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0 0 20px;
    line-height: 1.5;
  }
}

.catalog-btn {
  padding: 12px 24px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.garden-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.add-bed-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #E8F5EE;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
}

.plants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.plant-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary-subtle, rgba(45, 106, 79, 0.3));
  }

  &:active {
    transform: scale(0.98);
  }

  &.skeleton-card {
    min-height: 160px;
    background: var(--color-border);
    opacity: 0.4;
    cursor: default;
  }

  .card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .emoji-wrapper {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-lg);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .top-badges {
      display: flex;
      align-items: center;
      gap: 6px;

      .diff-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: var(--radius-pill);
        display: flex;
        align-items: center;
        gap: 4px;

        &.easy {
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        &.medium {
          background: rgba(234, 179, 8, 0.12);
          color: #a16207;
          border: 1px solid rgba(234, 179, 8, 0.2);
        }

        &.hard {
          background: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
      }
    }
  }

  .plant-requirements {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 6px 0 2px;

    .req-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-secondary);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      padding: 2px 8px;
      border-radius: var(--radius-sm);

      .req-icon {
        font-size: 12px;
      }
    }
  }

  .card-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;

    .plant-name {
      font-size: 18px;
      font-weight: 800;
      color: var(--color-text-primary);
    }

    .plant-latin {
      font-size: 12px;
      color: var(--color-text-tertiary);
      font-style: italic;
    }

    .plant-desc {
      margin: 6px 0 0;
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);

    .category-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 99px;
      background: var(--color-surface-hover);
      color: var(--color-text-secondary);

      &.vegetable {
        background: #E8F5EE;
        color: #1B4332;
      }

      &.berry {
        background: #FFECE8;
        color: #7A2010;
      }

      &.tree {
        background: #FFF8EC;
        color: #7A5010;
      }

      &.shrub {
        background: #E8F4FD;
        color: #0C447C;
      }

      &.herb {
        background: var(--color-soil-light);
        color: var(--color-soil);
      }
    }

    .more-link {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      gap: 2px;
    }
  }
}

.plant-emoji {
  font-size: 26px;
  flex-shrink: 0;
}

.plant-photo-thumb {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.plant-title-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
}

.plant-sub {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.plant-meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
}

.tag-loc,
.tag-date {
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.tag-empty {
  color: var(--color-primary);
  font-style: italic;
  font-size: 12px;
}

.edit-bed-btn {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;

  &:hover {
    color: var(--color-primary);
    background: var(--color-surface-hover);
  }
}

.garden-toggle-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  color: var(--color-text-disabled);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    color: var(--color-primary);
    background: var(--color-surface-hover);
  }

  &.active {
    color: var(--color-primary);
  }
}

.plant-arrow {
  color: var(--color-text-disabled);
  flex-shrink: 0;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-box {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);

  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--color-text-primary);
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: var(--color-text-tertiary);
    cursor: pointer;
  }
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.photo-field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 2px;
  }

  .photo-preview-box {
    width: 100%;
    height: 160px;
    border-radius: var(--radius-md);
    border: 2px dashed var(--color-primary);
    background-color: var(--color-background);
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .no-photo-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: var(--color-text-tertiary);
    font-size: 13px;
    margin-bottom: 12px;
  }

  .upload-photo-btn {
    background: rgba(45, 106, 79, 0.9);
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    backdrop-filter: blur(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: transform 0.15s;

    &:hover {
      transform: scale(1.03);
      background: var(--color-primary);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

.field {
  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 6px;
  }

  .modal-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    font-size: 14px;
    color: var(--color-text-primary);
    outline: none;
    box-sizing: border-box;

    &:focus {
      border-color: var(--color-primary);
    }
  }
}

.modal-extra-actions {
  padding-top: 4px;
}

.add-inst-btn {
  width: 100%;
  padding: 10px;
  background: var(--color-surface-hover);
  color: var(--color-primary);
  border: 1px dashed var(--color-primary);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    background: #E8F5EE;
  }
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);

  .delete-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: #FFF0ED;
    color: var(--color-error);
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: #FFD8D0;
    }
  }

  .save-btn {
    flex: 1;
    padding: 10px 20px;
    background: var(--color-primary);
    color: var(--color-on-primary);
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
  }
}

/* ── GROUPED GARDEN ── */
.grouped-garden-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 16px;
}

.garden-group-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;

  &:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary-subtle, rgba(45, 106, 79, 0.3));
  }
}

.group-header {
  padding: 16px 20px;
  background: var(--color-surface-hover);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--color-primary-subtle, rgba(45, 106, 79, 0.1));
  }
}

.group-title-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-emoji {
  font-size: 26px;
}

.group-name {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.instance-count {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  background: var(--color-primary);
  color: white;
  border-radius: 20px;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-instance-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--color-background);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 99px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-primary);
    color: white;
    transform: translateY(-1px);
  }
}

.group-instances-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.instance-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }
}

.inst-photo {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.inst-icon-placeholder {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.inst-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inst-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.inst-nickname {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inst-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
}

.delete-inst-btn {
  background: none;
  border: none;
  color: var(--color-text-disabled);
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--color-error, #E76F51);
    background: rgba(231, 111, 81, 0.15);
  }
}

/* ── HARVEST PROGRESS ── */
.harvest-progress-container {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.harvest-bar-bg {
  width: 100%;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.harvest-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--color-primary);
  transition: width 0.3s ease;

  &.warning {
    background: #f39c12;
  }

  &.ready {
    background: #e74c3c;
  }
}

.harvest-info {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.harvest-warning {
  color: #d35400;
}

.harvest-ready {
  color: #c0392b;
  font-weight: 700;
}
</style>
