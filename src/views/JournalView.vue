<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Sprout, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { JournalService, type TreatmentEntry } from '@/modules/journal/services/JournalService'

const router = useRouter()
const entries = ref<TreatmentEntry[]>([])
const loading = ref(true)

const typeLabel: Record<string, string> = {
  spraying: 'Опрыскивание',
  fertilizing: 'Удобрение',
  watering: 'Полив',
  pruning: 'Обрезка',
  other: 'Другое'
}

async function load() {
  loading.value = true
  try {
    entries.value = await JournalService.getAll()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function remove(id: string) {
  await JournalService.remove(id)
  entries.value = entries.value.filter(e => e.id !== id)
}

onMounted(load)
</script>

<template>
  <div class="journal-view">
    <div class="page-header">
      <h1 class="header-title">Журнал</h1>
      <button class="add-btn" @click="router.push('/journal/add')">
        <Plus :size="18" /> Добавить
      </button>
    </div>

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

    <div v-else class="entries-list">
      <div v-for="entry in entries" :key="entry.id" class="entry-card">
        <div class="entry-header">
          <div class="entry-type-badge" :class="entry.care_type">
            {{ typeLabel[entry.care_type] || entry.care_type }}
          </div>
          <div class="entry-right">
            <div class="entry-date">{{ entry.treated_at }}</div>
            <button class="delete-btn" @click.stop="remove(entry.id)">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <div class="entry-plant">
          <span class="plant-emoji">{{ entry.plant?.emoji }}</span>
          <span class="plant-title">
            {{ entry.user_plant?.nickname || entry.plant?.name || '—' }}
            <span v-if="entry.user_plant?.location_note" class="plant-loc">({{ entry.user_plant.location_note }})</span>
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
  &.skeleton-card { height: 80px; background: var(--color-border); opacity: 0.4; }
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
.delete-btn {
  background: none; border: none; color: var(--color-text-disabled); cursor: pointer; padding: 2px;
  &:hover { color: var(--color-error); }
}
.entry-plant { font-size: 15px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.plant-loc { font-size: 13px; font-weight: 400; color: var(--color-text-tertiary); }
.entry-product { font-size: 13px; color: var(--color-primary); margin-bottom: 6px; }
.entry-dose { color: var(--color-text-secondary); }
.entry-meta { display: flex; gap: 12px; font-size: 12px; color: var(--color-text-secondary); }
.entry-note { font-style: italic; }
</style>
