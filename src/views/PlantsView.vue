<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, ChevronRight, Bookmark, BookmarkCheck, Trash2, Plus, Edit3 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { PlantService, type Plant, type UserPlant } from '@/modules/plants/services/PlantService'
import { authStore } from '@/modules/auth/store/authStore'

const router = useRouter()
const search = ref('')
const activeCategory = ref('all')
const activeTab = ref<'catalog' | 'garden'>('catalog')
const plants = ref<Plant[]>([])
const userPlantsList = ref<UserPlant[]>([])
const loading = ref(true)

const categories = [
  { id: 'all', label: 'Все' },
  { id: 'vegetable', label: '🥦 Овощи' },
  { id: 'berry', label: '🍓 Ягоды' },
  { id: 'tree', label: '🍎 Деревья' },
  { id: 'shrub', label: '🫐 Кусты' },
  { id: 'herb', label: '🌿 Зелень' }
]

const userPlantIds = computed(() => userPlantsList.value.map(u => u.plant_id))

const filteredCatalog = computed(() => {
  return plants.value.filter(p => {
    const matchCat = activeCategory.value === 'all' || p.category === activeCategory.value
    const matchSearch = !search.value || p.name.toLowerCase().includes(search.value.toLowerCase())
    return matchCat && matchSearch
  })
})

const filteredGarden = computed(() => {
  return userPlantsList.value.filter(u => {
    const p = u.plant || plants.value.find(item => item.id === u.plant_id)
    if (!p) return false
    const matchCat = activeCategory.value === 'all' || p.category === activeCategory.value
    const s = search.value.toLowerCase()
    const matchSearch = !s || 
      p.name.toLowerCase().includes(s) ||
      (u.nickname && u.nickname.toLowerCase().includes(s)) ||
      (u.location_note && u.location_note.toLowerCase().includes(s))
    return matchCat && matchSearch
  })
})

// Модалка настройки
const editingPlant = ref<UserPlant | null>(null)
const editForm = ref({ nickname: '', location_note: '', planted_at: '' })
const savingModal = ref(false)

function openEditModal(uPlant: UserPlant, event: Event) {
  event.stopPropagation()
  editingPlant.value = uPlant
  editForm.value = {
    nickname: uPlant.nickname || '',
    location_note: uPlant.location_note || '',
    planted_at: uPlant.planted_at ? uPlant.planted_at.split('T')[0] : ''
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
      planted_at: editForm.value.planted_at || null
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

async function deleteUserPlant(id: string) {
  if (!confirm('Удалить эту грядку/культуру из вашего огорода?')) return
  savingModal.value = true
  try {
    await PlantService.removeUserPlant(id)
    userPlantsList.value = userPlantsList.value.filter(u => u.id !== id)
    closeEditModal()
  } catch (e) {
    console.error(e)
  } finally {
    savingModal.value = false
  }
}

async function addAnotherInstance(plantId?: string) {
  if (!plantId) return
  savingModal.value = true
  try {
    const newInst = await PlantService.addUserPlantInstance(plantId)
    userPlantsList.value.push(newInst)
    openEditModal(newInst, new Event('click'))
  } catch (e) {
    console.error(e)
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
      // Удаляем все экземпляры этого растения
      const toDel = userPlantsList.value.filter(u => u.plant_id === plant.id)
      for (const item of toDel) {
        await PlantService.removeUserPlant(item.id)
      }
      userPlantsList.value = userPlantsList.value.filter(u => u.plant_id !== plant.id)
    }
  } catch (e) {
    console.error('Ошибка изменения списка сада:', e)
  }
}

function getPlantObj(u: UserPlant) {
  return u.plant || plants.value.find(item => item.id === u.plant_id)
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

onMounted(loadData)
</script>

<template>
  <div class="plants-view">
    <div class="page-header">
      <h1 class="header-title">Растения</h1>
    </div>

    <!-- Tabs -->
    <div class="tabs-wrap">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'catalog' }"
        @click="activeTab = 'catalog'"
      >
        Каталог
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'garden' }"
        @click="activeTab = 'garden'"
      >
        Мой огород
        <span v-if="userPlantsList.length" class="badge">{{ userPlantsList.length }}</span>
      </button>
    </div>

    <div class="search-wrap">
      <Search :size="16" class="search-icon" />
      <input v-model="search" class="search-input" :placeholder="activeTab === 'garden' ? 'Поиск грядки, сорта, культуры...' : 'Поиск растения...'" />
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

    <!-- Вкладка Огород: Пусто -->
    <div v-else-if="activeTab === 'garden' && userPlantsList.length === 0" class="empty-garden">
      <div class="empty-emoji">🌱</div>
      <h3>В твоём саду пока пусто</h3>
      <p>Выбери культуры из общего каталога, чтобы настроить сорта, расположение грядок и вести по ним точный журнал!</p>
      <button class="catalog-btn" @click="activeTab = 'catalog'">Перейти в каталог</button>
    </div>

    <!-- Вкладка Огород: Список -->
    <template v-else-if="activeTab === 'garden'">
      <div class="garden-header-bar">
        <span class="count-label">{{ filteredGarden.length }} грядок (культур)</span>
        <button class="add-bed-btn" @click="activeTab = 'catalog'"><Plus :size="16" /> Из каталога</button>
      </div>
      <div class="plants-grid">
        <div
          v-for="uPlant in filteredGarden" :key="uPlant.id"
          class="plant-card garden-bed-card"
          @click="router.push(`/plants/${uPlant.plant_id}`)"
        >
          <div class="plant-emoji">{{ getPlantObj(uPlant)?.emoji }}</div>
          <div class="plant-info">
            <div class="plant-title-row">
              <span class="plant-name">{{ uPlant.nickname || getPlantObj(uPlant)?.name }}</span>
              <span v-if="uPlant.nickname" class="plant-sub">({{ getPlantObj(uPlant)?.name }})</span>
            </div>
            <div class="plant-meta-tags">
              <span v-if="uPlant.location_note" class="tag-loc">📍 {{ uPlant.location_note }}</span>
              <span v-if="uPlant.planted_at" class="tag-date">📅 {{ formatDateDisplay(uPlant.planted_at) }}</span>
              <span v-if="!uPlant.location_note && !uPlant.planted_at" class="tag-empty">✏️ Указать сорт и грядку</span>
            </div>
          </div>
          <button class="edit-bed-btn" @click="openEditModal(uPlant, $event)" title="Настроить грядку">
            <Edit3 :size="18" />
          </button>
        </div>
      </div>
    </template>

    <!-- Вкладка Каталог: Список -->
    <template v-else>
      <div class="count-label">{{ filteredCatalog.length }} культур</div>
      <div class="plants-grid">
        <div
          v-for="plant in filteredCatalog" :key="plant.id"
          class="plant-card"
          @click="router.push(`/plants/${plant.id}`)"
        >
          <div class="plant-emoji">{{ plant.emoji }}</div>
          <div class="plant-info">
            <div class="plant-name">{{ plant.name }}</div>
            <div class="plant-latin">{{ plant.latin_name }}</div>
          </div>
          <button
            class="garden-toggle-btn"
            :class="{ active: userPlantIds.includes(plant.id) }"
            title="В моём саду"
            @click="toggleGardenCatalog(plant, $event)"
          >
            <BookmarkCheck v-if="userPlantIds.includes(plant.id)" :size="20" />
            <Bookmark v-else :size="20" />
          </button>
          <ChevronRight :size="14" class="plant-arrow" />
        </div>
      </div>
    </template>

    <!-- Модальное окно редактирования UserPlant -->
    <div v-if="editingPlant" class="modal-backdrop" @click="closeEditModal">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>🌱 {{ getPlantObj(editingPlant)?.name }}</h3>
          <button class="close-btn" @click="closeEditModal">✕</button>
        </div>
        <div class="modal-body">
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

          <div class="modal-extra-actions">
            <button class="add-inst-btn" @click="addAnotherInstance(editingPlant?.plant_id)" :disabled="savingModal">
              <Plus :size="16" /> Добавить ещё одну грядку/сорт {{ getPlantObj(editingPlant)?.name.toLowerCase() }}
            </button>
          </div>

          <div class="modal-actions">
            <button class="delete-btn" @click="deleteUserPlant(editingPlant.id)" :disabled="savingModal">
              <Trash2 :size="18" /> Удалить
            </button>
            <button class="save-btn" @click="saveEditPlant" :disabled="savingModal">
              {{ savingModal ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.plants-view { padding: 16px 16px 24px; }
.page-header { margin-bottom: 16px; }
.header-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

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

.empty-garden {
  text-align: center;
  padding: 48px 20px;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  margin-top: 16px;

  .empty-emoji { font-size: 48px; margin-bottom: 12px; }
  h3 { font-size: 18px; margin: 0 0 8px; color: var(--color-text-primary); }
  p { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 20px; line-height: 1.5; }
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
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
}
.add-bed-btn {
  display: flex; align-items: center; gap: 6px; padding: 6px 12px;
  background: #E8F5EE; color: var(--color-primary);
  border: 1px solid var(--color-primary); border-radius: var(--radius-pill);
  font-size: 13px; font-weight: 600; cursor: pointer;
  &:hover { background: var(--color-primary); color: var(--color-on-primary); }
}

.plants-grid { display: flex; flex-direction: column; gap: 8px; }

.plant-card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 12px 14px;
  display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background 0.15s;
  &:active { background: var(--color-surface-hover); }
  &.skeleton-card { height: 64px; background: var(--color-border); opacity: 0.4; cursor: default; }
}
.plant-emoji { font-size: 26px; flex-shrink: 0; }
.plant-info { flex: 1; min-width: 0; }
.plant-name { font-size: 15px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 2px; }
.plant-latin { font-size: 12px; color: var(--color-text-tertiary); font-style: italic; }

.plant-title-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
.plant-sub { font-size: 13px; color: var(--color-text-tertiary); }
.plant-meta-tags {
  display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px;
}
.tag-loc, .tag-date {
  background: var(--color-surface-hover); color: var(--color-text-secondary);
  padding: 2px 8px; border-radius: 4px; font-weight: 500;
}
.tag-empty { color: var(--color-primary); font-style: italic; font-size: 12px; }

.edit-bed-btn {
  background: none; border: none; color: var(--color-text-tertiary); padding: 8px; cursor: pointer;
  border-radius: 50%;
  &:hover { color: var(--color-primary); background: var(--color-surface-hover); }
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

  &:hover { color: var(--color-primary); background: var(--color-surface-hover); }
  &.active { color: var(--color-primary); }
}
.plant-arrow { color: var(--color-text-disabled); flex-shrink: 0; }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
}
.modal-box {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); width: 100%; max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2); overflow: hidden;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid var(--color-border);
  h3 { margin: 0; font-size: 18px; color: var(--color-text-primary); }
  .close-btn { background: none; border: none; font-size: 18px; color: var(--color-text-tertiary); cursor: pointer; }
}
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.field {
  label { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px; }
  .modal-input {
    width: 100%; padding: 10px 12px; border: 1px solid var(--color-border);
    border-radius: var(--radius-md); background: var(--color-surface); font-size: 14px;
    color: var(--color-text-primary); outline: none; box-sizing: border-box;
    &:focus { border-color: var(--color-primary); }
  }
}
.modal-extra-actions {
  padding-top: 4px;
}
.add-inst-btn {
  width: 100%; padding: 10px; background: var(--color-surface-hover);
  color: var(--color-primary); border: 1px dashed var(--color-primary);
  border-radius: var(--radius-md); font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;
  &:hover { background: #E8F5EE; }
}
.modal-actions {
  display: flex; justify-content: space-between; gap: 12px; padding-top: 8px; border-top: 1px solid var(--color-border);
  .delete-btn {
    display: flex; align-items: center; gap: 6px; padding: 10px 16px;
    background: #FFF0ED; color: var(--color-error); border: none; border-radius: var(--radius-md); font-weight: 600; cursor: pointer;
    &:hover { background: #FFD8D0; }
  }
  .save-btn {
    flex: 1; padding: 10px 20px; background: var(--color-primary); color: var(--color-on-primary);
    border: none; border-radius: var(--radius-md); font-weight: 600; cursor: pointer;
  }
}
</style>
