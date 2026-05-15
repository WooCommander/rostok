<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check } from 'lucide-vue-next'
import { PlantService, type Plant } from '@/modules/plants/services/PlantService'
import { JournalService } from '@/modules/journal/services/JournalService'
import { WeatherService } from '@/modules/weather/services/WeatherService'

const router = useRouter()

const plants = ref<Plant[]>([])
const saving = ref(false)

const form = ref({
  plant_id: '',
  type: 'spraying',
  product: '',
  dose: '',
  temp: '',
  note: '',
  date: new Date().toISOString().split('T')[0]
})

const types = [
  { value: 'spraying', label: '💧 Опрыскивание' },
  { value: 'fertilizing', label: '🌿 Удобрение' },
  { value: 'watering', label: '💦 Полив' },
  { value: 'pruning', label: '✂️ Обрезка' },
  { value: 'other', label: '📝 Другое' }
]

onMounted(async () => {
  plants.value = await PlantService.getAll()
  // Автоподставить температуру
  try {
    const w = await WeatherService.getWithCache()
    form.value.temp = String(w.temp)
  } catch {}
})

async function save() {
  if (!form.value.plant_id) return
  saving.value = true
  try {
    await JournalService.add({
      plant_id: form.value.plant_id || null,
      treated_at: form.value.date,
      care_type: form.value.type,
      product: form.value.product || undefined,
      dose: form.value.dose || undefined,
      temperature: form.value.temp ? parseFloat(form.value.temp) : null,
      notes: form.value.note || undefined
    })
    router.push('/journal')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="add-treatment">
    <div class="page-header">
      <button class="back-btn" @click="router.back()"><ArrowLeft :size="20" /></button>
      <h1 class="header-title">Новая запись</h1>
    </div>

    <div class="form-body">
      <div class="field">
        <label class="field-label">Дата</label>
        <input v-model="form.date" type="date" class="field-input" />
      </div>

      <div class="field">
        <label class="field-label">Растение</label>
        <select v-model="form.plant_id" class="field-input">
          <option value="" disabled>Выбери растение...</option>
          <option v-for="p in plants" :key="p.id" :value="p.id">
            {{ p.emoji }} {{ p.name }}
          </option>
        </select>
      </div>

      <div class="field">
        <label class="field-label">Тип обработки</label>
        <div class="type-grid">
          <button
            v-for="t in types" :key="t.value"
            class="type-btn" :class="{ active: form.type === t.value }"
            @click="form.type = t.value"
          >{{ t.label }}</button>
        </div>
      </div>

      <div class="field" v-if="form.type !== 'watering' && form.type !== 'pruning'">
        <label class="field-label">Препарат / удобрение</label>
        <input v-model="form.product" type="text" class="field-input" placeholder="Фитоспорин-М, Кемира..." />
      </div>

      <div class="field" v-if="form.product">
        <label class="field-label">Доза</label>
        <input v-model="form.dose" type="text" class="field-input" placeholder="10 мл на 10 л воды..." />
      </div>

      <div class="field">
        <label class="field-label">Температура °C <span class="field-hint">(автоопределение)</span></label>
        <input v-model="form.temp" type="number" class="field-input" placeholder="22" />
      </div>

      <div class="field">
        <label class="field-label">Заметка</label>
        <textarea v-model="form.note" class="field-input field-textarea" placeholder="Наблюдения..." rows="3"></textarea>
      </div>

      <button class="save-btn" :disabled="!form.plant_id || saving" @click="save">
        <Check :size="18" />
        {{ saving ? 'Сохраняю...' : 'Сохранить' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.add-treatment { padding-bottom: 32px; }
.page-header { display: flex; align-items: center; gap: 12px; padding: 16px; margin-bottom: 4px; }
.back-btn {
  background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px;
  color: var(--color-text-primary); width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
}
.header-title { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.form-body { padding: 0 16px; display: flex; flex-direction: column; gap: 16px; }
.field {}
.field-label { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px; }
.field-hint { font-weight: 400; color: var(--color-text-disabled); }
.field-input {
  width: 100%; padding: 11px 14px; border: 1px solid var(--color-border);
  border-radius: var(--radius-md); background: var(--color-surface);
  font-size: 14px; color: var(--color-text-primary); font-family: var(--font-family);
  outline: none; box-sizing: border-box;
  &:focus { border-color: var(--color-primary); }
}
.field-textarea { resize: vertical; min-height: 80px; }
.type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.type-btn {
  padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
  background: var(--color-surface); font-size: 13px; color: var(--color-text-secondary);
  cursor: pointer; text-align: center;
  &.active { background: var(--color-surface-hover); border-color: var(--color-primary); color: var(--color-primary); font-weight: 600; }
}
.save-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 14px; background: var(--color-primary); color: var(--color-on-primary);
  border: none; border-radius: var(--radius-lg); font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
</style>
