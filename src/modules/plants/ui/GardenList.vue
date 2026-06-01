<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, ChevronRight, Trash2, History } from 'lucide-vue-next'
import { type Plant, type UserPlant } from '../services/PlantService'
import FpEmptyState from '@/design-system/components/FpEmptyState.vue'

interface Props {
  plants: Plant[]
  userPlantsList: UserPlant[]
  search: string
  activeCategory: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'go-to-catalog'): void
  (e: 'add-instance', plantId: string): void
  (e: 'edit-instance', uPlant: UserPlant, event: Event): void
  (e: 'delete-instance', id: string): void
}>()

const router = useRouter()

const groupedGarden = computed(() => {
  const groups = new Map<string, { plant: Plant; instances: UserPlant[] }>()
  for (const u of props.userPlantsList) {
    const p = u.plant || props.plants.find(item => item.id === u.plant_id)
    if (!p) continue

    const matchCat = props.activeCategory === 'all' || p.category === props.activeCategory
    const s = props.search.toLowerCase().trim()
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
</script>

<template>
  <div class="garden-list">
    <div v-if="userPlantsList.length === 0" class="empty-garden-wrapper">
      <FpEmptyState 
        title="В твоём саду пока пусто" 
        description="Выбери культуры из общего каталога, чтобы настроить сорта, расположение грядок и вести по ним точный журнал!"
        actionLabel="Перейти в каталог"
        @action="emit('go-to-catalog')"
      />
    </div>

    <template v-else>
      <div class="garden-header-bar">
        <span class="count-label">{{ userPlantsList.length }} грядок (в {{ groupedGarden.length }} группах)</span>
        <button class="add-bed-btn" @click="emit('go-to-catalog')">
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
              <button class="add-instance-btn" @click.stop="emit('add-instance', group.plant.id)"
                title="Добавить экземпляр">
                <Plus :size="16" /> Добавить
              </button>
              <ChevronRight :size="20" class="arrow-icon" />
            </div>
          </div>

          <div class="group-instances-grid">
            <div v-for="(uPlant, idx) in group.instances" :key="uPlant.id" class="instance-card">
              <div class="inst-main" @click="emit('edit-instance', uPlant, $event)">
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
                    <span v-if="!uPlant.location_note && !uPlant.planted_at" class="tag-empty">✏️ Указать сорт/грядку</span>
                  </div>

                  <div v-if="getHarvestProgress(uPlant)" class="harvest-progress-container">
                    <div class="harvest-bar-bg">
                      <div class="harvest-bar-fill" :class="getHarvestProgress(uPlant)!.status"
                        :style="{ width: getHarvestProgress(uPlant)!.percent + '%' }"></div>
                    </div>
                    <div class="harvest-info">
                      <span v-if="getHarvestProgress(uPlant)!.status === 'ready'" class="harvest-ready">🍅 Урожай готов!</span>
                      <span v-else-if="getHarvestProgress(uPlant)!.status === 'warning'" class="harvest-warning">⚠️ {{ getHarvestProgress(uPlant)!.remaining }} дн. (переходите на био!)</span>
                      <span v-else>До сбора: {{ getHarvestProgress(uPlant)!.remaining }} дн.</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer row -->
              <div class="inst-footer">
                <button class="footer-btn history-btn" @click="router.push(`/garden/${uPlant.id}`)">
                  <History :size="13" />
                  История грядки
                </button>
                <button class="footer-btn delete-inst-btn" @click="emit('delete-instance', uPlant.id)">
                  <Trash2 :size="13" />
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.empty-garden-wrapper { padding: 40px 0; }

.garden-header-bar {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
}
.count-label {
  font-size: 13px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;
}
.add-bed-btn {
  background: rgba(45, 106, 79, 0.1); color: var(--color-primary); border: none; padding: 6px 12px;
  border-radius: var(--radius-pill); font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: background 0.15s;
  &:hover { background: rgba(45, 106, 79, 0.15); }
}

.grouped-garden-container { display: flex; flex-direction: column; gap: 24px; }
.garden-group-card {
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl);
  overflow: hidden; box-shadow: var(--shadow-sm);
}
.group-header {
  padding: 16px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;
  cursor: pointer; background: var(--color-background); transition: background 0.15s;
  &:hover { background: var(--color-surface-hover); }
}
.group-title-left { display: flex; align-items: center; gap: 12px; }
.group-emoji { font-size: 24px; background: var(--color-surface); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.group-name { font-size: 18px; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.instance-count { font-size: 13px; font-weight: 700; color: var(--color-text-secondary); background: var(--color-surface-hover); padding: 2px 8px; border-radius: var(--radius-pill); }
.group-actions { display: flex; align-items: center; gap: 12px; }
.add-instance-btn {
  background: transparent; border: 1px solid var(--color-border); color: var(--color-text-secondary);
  padding: 6px 10px; border-radius: var(--radius-md); font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px; cursor: pointer; transition: all 0.15s;
  &:hover { border-color: var(--color-primary); color: var(--color-primary); background: rgba(45, 106, 79, 0.05); }
}
.arrow-icon { color: var(--color-text-disabled); }

.group-instances-grid { display: flex; flex-direction: column; }
.instance-card {
  display: flex; flex-direction: column; border-bottom: 1px solid var(--color-border);
  &:last-child { border-bottom: none; }
}
.inst-main {
  display: flex; padding: 16px; gap: 16px; cursor: pointer; transition: background 0.15s;
  &:hover { background: var(--color-surface-hover); }
}
.inst-photo { width: 64px; height: 64px; border-radius: var(--radius-lg); background-size: cover; background-position: center; flex-shrink: 0; border: 1px solid var(--color-border); }
.inst-icon-placeholder { width: 64px; height: 64px; border-radius: var(--radius-lg); background: rgba(45, 106, 79, 0.08); display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; }
.inst-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.inst-head-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.inst-nickname { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.inst-footer {
  display: flex; border-top: 1px solid var(--color-border);
}
.footer-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 10px 8px; background: none; border: none; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
  &:not(:last-child) { border-right: 1px solid var(--color-border); }
}
.history-btn { color: var(--color-primary); &:hover { background: rgba(45,106,79,0.06); } }
.delete-inst-btn { color: var(--color-text-tertiary); &:hover { background: rgba(231,111,81,0.06); color: #E76F51; } }

.inst-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.tag-loc, .tag-date, .tag-empty { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
.tag-loc { background: rgba(38, 70, 83, 0.1); color: #264653; body.dark-theme & { color: #88C0D0; } }
.tag-date { background: rgba(233, 196, 106, 0.15); color: #B08B1C; body.dark-theme & { color: #E9C46A; } }
.tag-empty { background: rgba(231, 111, 81, 0.1); color: #C93F21; border: 1px dashed rgba(231, 111, 81, 0.3); body.dark-theme & { color: #E76F51; border-color: rgba(231, 111, 81, 0.5); } }

.harvest-progress-container { margin-top: 4px; display: flex; flex-direction: column; gap: 4px; }
.harvest-bar-bg { width: 100%; height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
.harvest-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; background: var(--color-primary); &.warning { background: #F4A261; } &.ready { background: #E76F51; } }
.harvest-info { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); text-align: right; }
.harvest-ready { color: #E76F51; font-weight: 800; }
.harvest-warning { color: #F4A261; }
</style>
