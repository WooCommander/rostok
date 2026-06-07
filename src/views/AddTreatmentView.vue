<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ArrowLeft, Check, ChevronDown, X, CheckCircle, AlertTriangle, XCircle } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import FpMobilePicker from '@/design-system/components/FpMobilePicker.vue'
import { PlantService, type Plant, type UserPlant } from '@/modules/plants/services/PlantService'
import { JournalService, type NewTreatmentEntry, type TreatedPlant } from '@/modules/journal/services/JournalService'
import { WeatherService, type DailyForecast } from '@/modules/weather/services/WeatherService'

import { ReminderService } from '@/modules/reminders'
import { ProductService, type ProductItem } from '@/modules/products/services/ProductService'
import { TankMixerService, type MixCheckResult } from '@/modules/tank-mixer'
import { PushNotificationService } from '@/modules/notifications'

const router = useRouter()
const route = useRoute()

const plants = ref<Plant[]>([])
const userPlantsList = ref<UserPlant[]>([])
const myGardenPlants = computed(() => userPlantsList.value)
const otherPlants = computed(() => {
  const myPlantIds = new Set(userPlantsList.value.map(u => u.plant_id))
  return plants.value.filter(p => !myPlantIds.has(p.id))
})
const saving = ref(false)

const isTankMix = ref(false)
const tankMixProducts = ref(['', '', ''])

const tankMixFullProducts = computed<ProductItem[]>(() => {
  return tankMixProducts.value
    .filter(name => name.trim())
    .map(name => allProducts.value.find(p => p.name === name) || null)
    .filter(Boolean) as ProductItem[]
})

const tankMixCompatibility = computed<MixCheckResult | null>(() => {
  if (tankMixFullProducts.value.length < 2) return null
  return TankMixerService.checkMultipleCompatibility(tankMixFullProducts.value)
})

function toggleTankMix() {
  isTankMix.value = !isTankMix.value
  if (isTankMix.value && form.value.product) {
    tankMixProducts.value[0] = form.value.product
    form.value.product = ''
  } else if (!isTankMix.value) {
    form.value.product = tankMixProducts.value[0] || ''
    tankMixProducts.value = ['', '', '']
  }
}

const isEditing = computed(() => !!route.params.id)
const allProducts = ref<ProductItem[]>([])
const productItems = computed(() => {
  let filtered = allProducts.value
  
  if (form.value.type === 'fertilizing') {
    filtered = filtered.filter(p => p.category === 'fertilizer' || p.category === 'bio')
  } else if (form.value.type === 'spraying') {
    filtered = filtered.filter(p => p.category !== 'fertilizer')
  }

  return filtered.map(p => {
    let typeName = ''
    if (p.category === 'fungicide') typeName = 'Фунгицид'
    else if (p.category === 'insecticide') typeName = 'Инсектицид'
    else if (p.category === 'fertilizer') typeName = 'Удобрение'
    else if (p.category === 'bio') typeName = 'Биопрепарат'

    return { 
      id: p.id, 
      name: p.name, 
      subtitle: typeName ? `${typeName} • ${p.active_ingredient}` : p.active_ingredient 
    }
  })
})

const showPlantsModal = ref(false)

const form = ref({
  selected_ids: [] as string[],
  type: 'spraying',
  product: '',
  dose: '',
  temp: '',
  note: '',
  date: new Date().toISOString().split('T')[0]
})

const enableReminder = ref(false)
const reminderDays = ref(14)

const types = [
  { value: 'spraying', label: '💧 Опрыскивание' },
  { value: 'fertilizing', label: '🌿 Удобрение' },
  { value: 'watering', label: '💦 Полив' },
  { value: 'pruning', label: '✂️ Обрезка' },
  { value: 'other', label: '📝 Другое' }
]

const selectedPlantsText = computed(() => {
  const count = form.value.selected_ids.length
  if (count === 0) return 'Выберите растения...'
  if (count === 1) {
     const sid = form.value.selected_ids[0]
     if (sid.startsWith('u_')) {
        const u = userPlantsList.value.find(x => String(x.id) === String(sid.slice(2)))
        return u ? `${u.plant?.emoji} ${u.nickname || u.plant?.name}` : '1 растение'
     } else {
        const p = plants.value.find(x => String(x.id) === String(sid.slice(2)))
        return p ? `${p.emoji} ${p.name}` : '1 растение'
     }
  }
  return `Выбрано: ${count}`
})

const futureDateText = computed(() => {
  if (!enableReminder.value || !reminderDays.value || !form.value.date) return ''
  const baseDate = new Date(form.value.date)
  const futureDate = new Date(baseDate.getTime())
  futureDate.setDate(futureDate.getDate() + Number(reminderDays.value))
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ]
  const weekdays = [
    'воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'
  ]
  return `${futureDate.getDate()} ${months[futureDate.getMonth()]} (${weekdays[futureDate.getDay()]})`
})

const weeklyForecast = ref<DailyForecast[]>([])

const weatherAlert = computed(() => {
  if (!enableReminder.value || !reminderDays.value || !form.value.date) return null
  if (weeklyForecast.value.length === 0) return null

  const baseDate = new Date(form.value.date)
  const futureDate = new Date(baseDate.getTime())
  futureDate.setDate(futureDate.getDate() + Number(reminderDays.value))
  const targetDateStr = futureDate.toISOString().split('T')[0]

  const dayForecast = weeklyForecast.value.find(f => f.date === targetDateStr)
  if (!dayForecast) return null

  const code = dayForecast.weatherCode
  if (code >= 61 && code <= 67) {
    return {
      type: 'rain',
      message: `⚠️ Внимание: в этот день ожидается дождь (${dayForecast.tempMax}°C). Вода смоет препараты. Рассмотрите перенос.`
    }
  }
  if (code >= 80 && code <= 99) {
    return {
      type: 'rain',
      message: `⚠️ Внимание: ожидается ливень или гроза. Риск полного вымывания удобрений. Перенесите дату.`
    }
  }
  if (dayForecast.tempMin <= 4) {
    return {
      type: 'cold',
      message: `❄️ Внимание: ожидаются заморозки (до ${dayForecast.tempMin}°C). В холод растения не усваивают питание.`
    }
  }
  if (dayForecast.tempMax <= 10) {
    return {
      type: 'cold',
      message: `🥶 Внимание: сильное похолодание (днем до ${dayForecast.tempMax}°C). Эффективность подкормки будет низкой.`
    }
  }
  if (dayForecast.windSpeedMax >= 18 && form.value.type === 'spraying') {
    return {
      type: 'wind',
      message: `💨 Внимание: сильный ветер (до ${Math.round(dayForecast.windSpeedMax)} км/ч). Опрыскивание неэффективно.`
    }
  }

  return null
})

onMounted(async () => {
  if (route.query.care_type) {
    form.value.type = String(route.query.care_type)
    if (form.value.type === 'fertilizing' || form.value.type === 'spraying') {
      if (route.query.reminder !== undefined) {
        enableReminder.value = route.query.reminder === 'true'
      } else {
        enableReminder.value = form.value.type === 'fertilizing'
      }
      reminderDays.value = route.query.reminder_days ? Number(route.query.reminder_days) : 14
    }
  }
  if (route.query.product) form.value.product = String(route.query.product)
  if (route.query.dose) form.value.dose = String(route.query.dose)
  if (route.query.note) form.value.note = String(route.query.note)
  if (route.query.selected_id) form.value.selected_ids = [String(route.query.selected_id)]
  if (route.query.tank_products) {
    const parts = String(route.query.tank_products).split('|').filter(Boolean)
    if (parts.length > 0) {
      isTankMix.value = true
      tankMixProducts.value = [parts[0] || '', parts[1] || '', parts[2] || '']
    }
  }


  try {
    const [fetchedPlants, myPlants, products] = await Promise.all([
      PlantService.getAll(),
      PlantService.getUserPlants(),
      ProductService.getAllProducts()
    ])
    plants.value = fetchedPlants
    userPlantsList.value = myPlants
    allProducts.value = products

    if (isEditing.value) {
      const entry = await JournalService.getById(route.params.id as string)
      if (entry) {
        form.value.type = entry.care_type
        form.value.product = entry.product || ''
        form.value.dose = entry.dose || ''
        form.value.temp = entry.temperature ? String(entry.temperature) : ''
        form.value.note = entry.notes || ''
        form.value.date = entry.treated_at
        
        if (entry.plants_data && entry.plants_data.length > 0) {
          form.value.selected_ids = entry.plants_data.map(p => p.id)
        } else if (entry.user_plant_id) {
          form.value.selected_ids = ['u_' + entry.user_plant_id]
        } else if (entry.plant_id) {
          form.value.selected_ids = ['p_' + entry.plant_id]
        }
      }
    } else {
      if (route.query.selected_id) {
        form.value.selected_ids = [String(route.query.selected_id)]
      } else if (myPlants.length > 0 && form.value.selected_ids.length === 0) {
        form.value.selected_ids = ['u_' + myPlants[0].id]
      }
    }
  } catch (e) {
    console.error(e)
  }
  try {
    const w = await WeatherService.getWithCache()
    form.value.temp = String(w.temp)
  } catch {}
  try {
    weeklyForecast.value = await WeatherService.getWeeklyForecast()
  } catch (err) {
    console.error('Не удалось загрузить недельный прогноз:', err)
  }
})

async function save() {
  if (form.value.selected_ids.length === 0) return
  saving.value = true

  const treatedPlants: TreatedPlant[] = form.value.selected_ids.map(sid => {
    const isU = sid.startsWith('u_')
    const idVal = sid.slice(2)
    if (isU) {
      const u = userPlantsList.value.find(x => String(x.id) === String(idVal))
      return {
        id: sid,
        name: u?.nickname || u?.plant?.name || 'Растение',
        emoji: u?.plant?.emoji || '🌱',
        location_note: u?.location_note || undefined
      }
    } else {
      const p = plants.value.find(x => String(x.id) === String(idVal))
      return {
        id: sid,
        name: p?.name || 'Растение',
        emoji: p?.emoji || '🌱'
      }
    }
  })

  const finalProduct = isTankMix.value
    ? tankMixProducts.value.filter(p => p.trim()).join(' + ') || undefined
    : form.value.product || undefined

  const newEntry: NewTreatmentEntry = {
    plant_id: treatedPlants[0]?.id.startsWith('p_') ? treatedPlants[0].id.slice(2) : null,
    user_plant_id: treatedPlants[0]?.id.startsWith('u_') ? treatedPlants[0].id.slice(2) : null,
    plants_data: treatedPlants,
    treated_at: form.value.date,
    care_type: form.value.type,
    product: finalProduct,
    dose: form.value.dose || undefined,
    temperature: form.value.temp ? parseFloat(form.value.temp) : null,
    notes: form.value.note || undefined
  }

  try {
    if (isEditing.value) {
      await JournalService.update(route.params.id as string, newEntry)
    } else {
      await JournalService.add(newEntry)
    }

    if (enableReminder.value && reminderDays.value > 0) {
      const targetDate = new Date(form.value.date)
      targetDate.setDate(targetDate.getDate() + reminderDays.value)
      const remindAtDate = targetDate.toISOString().split('T')[0]

      for (const tp of treatedPlants) {
        const isU = tp.id.startsWith('u_')
        const rawId = tp.id.slice(2)
        let plantIdForRem = rawId
        if (isU) {
          const u = userPlantsList.value.find(x => String(x.id) === String(rawId))
          if (u && u.plant_id) plantIdForRem = u.plant_id
        }
        await ReminderService.addReminder({
          plantId: plantIdForRem,
          userPlantId: isU ? rawId : null,
          careType: form.value.type,
          product: form.value.product || undefined,
          dose: form.value.dose || undefined,
          remindAtDate
        })
      }
      await PushNotificationService.scheduleActiveReminders()
    }

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
      <h1 class="header-title">{{ isEditing ? 'Редактировать запись' : 'Новая запись' }}</h1>
    </div>

    <div class="form-body">
      <div class="field">
        <label class="field-label">Дата</label>
        <input v-model="form.date" type="date" class="field-input" />
      </div>

      <div class="field">
        <label class="field-label">Растения</label>
        <div class="plants-selector-trigger" @click="showPlantsModal = true">
          <div class="trigger-value">{{ selectedPlantsText }}</div>
          <ChevronDown :size="20" class="chevron" />
        </div>
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
        <div class="field-label-row">
          <label class="field-label">Препарат / удобрение</label>
          <button class="tank-mix-toggle" :class="{ active: isTankMix }" @click="toggleTankMix">
            🧪 Баковая смесь
          </button>
        </div>

        <FpMobilePicker
          v-if="!isTankMix"
          v-model="form.product"
          :items="productItems"
          placeholder="Поиск или ввод нового..."
          allow-create
          create-label="Добавить новый:"
          title="Выбор препарата"
          variant="bordered"
          @create="form.product = $event"
        />

        <template v-else>
          <div class="tank-mix-fields">
            <FpMobilePicker
              v-model="tankMixProducts[0]"
              :items="productItems"
              placeholder="Препарат 1..."
              allow-create
              create-label="Добавить новый:"
              title="Препарат 1"
              variant="bordered"
              @create="v => tankMixProducts[0] = v"
            />
            <FpMobilePicker
              v-model="tankMixProducts[1]"
              :items="productItems"
              placeholder="Препарат 2..."
              allow-create
              create-label="Добавить новый:"
              title="Препарат 2"
              variant="bordered"
              @create="v => tankMixProducts[1] = v"
            />
            <FpMobilePicker
              v-model="tankMixProducts[2]"
              :items="productItems"
              placeholder="Препарат 3 (необязательно)..."
              allow-create
              create-label="Добавить новый:"
              title="Препарат 3"
              variant="bordered"
              @create="v => tankMixProducts[2] = v"
            />
          </div>

          <Transition name="fade">
            <div v-if="tankMixCompatibility" class="mix-compat-badge" :class="tankMixCompatibility.result.toLowerCase()">
              <span class="mix-compat-icon">
                <CheckCircle v-if="tankMixCompatibility.result === 'COMPATIBLE'" :size="15" />
                <AlertTriangle v-else-if="tankMixCompatibility.result === 'CAUTION'" :size="15" />
                <XCircle v-else :size="15" />
              </span>
              <span class="mix-compat-text">{{ tankMixCompatibility.message }}</span>
            </div>
          </Transition>
        </template>
      </div>

      <div class="field" v-if="isTankMix ? tankMixProducts.some(p => p.trim()) : form.product">
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

      <div class="field reminder-field" v-if="form.type === 'fertilizing' || form.type === 'spraying'">
        <label class="field-label">⏰ Напоминание о повторной обработке</label>
        <div class="reminder-options">
          <button class="rem-btn" :class="{ active: !enableReminder }" @click="enableReminder = false">Нет</button>
          <button class="rem-btn" :class="{ active: enableReminder && reminderDays === 7 }" @click="enableReminder = true; reminderDays = 7">7 дн</button>
          <button class="rem-btn" :class="{ active: enableReminder && reminderDays === 14 }" @click="enableReminder = true; reminderDays = 14">14 дн</button>
          <button class="rem-btn" :class="{ active: enableReminder && reminderDays === 21 }" @click="enableReminder = true; reminderDays = 21">21 дн</button>
        </div>
        <div v-if="enableReminder" class="reminder-custom-input-row">
          <span class="custom-label">Через:</span>
          <input type="number" v-model="reminderDays" class="field-input custom-days-input" min="1" max="365" />
          <span class="custom-label">дней</span>
        </div>

        <transition name="fade">
          <div v-if="enableReminder && futureDateText" class="future-date-badge-wrapper">
            <div class="future-date-badge">
              📅 Следующий уход: <strong>{{ futureDateText }}</strong>
            </div>

            <div v-if="weatherAlert" class="weather-warning-badge" :class="weatherAlert.type">
              <span class="warning-text">{{ weatherAlert.message }}</span>
            </div>
          </div>
        </transition>
      </div>

      <button class="save-btn" :disabled="form.selected_ids.length === 0 || saving" @click="save">
        <Check :size="18" />
        {{ saving ? 'Сохраняю...' : 'Сохранить' }}
      </button>
    </div>

    <Teleport to="body">
      <Transition name="picker-fade">
        <div v-if="showPlantsModal" class="picker-overlay">
          <div class="picker-header">
            <button class="close-btn" @click="showPlantsModal = false"><X :size="24" /></button>
            <h2 class="picker-title">Выбор растений</h2>
            <button class="done-btn" @click="showPlantsModal = false">Готово</button>
          </div>
          <div class="picker-content">
            <div class="plants-group-title" v-if="myGardenPlants.length">⭐ Мой огород</div>
            <label v-for="u in myGardenPlants" :key="u.id" class="plant-row">
              <div class="plant-info">
                <span class="emoji">{{ u.plant?.emoji }}</span>
                <div class="details">
                  <span class="name">{{ u.nickname || u.plant?.name }}</span>
                  <span class="loc" v-if="u.location_note">{{ u.location_note }}</span>
                </div>
              </div>
              <input type="checkbox" :value="'u_' + u.id" v-model="form.selected_ids" class="fp-checkbox" />
            </label>
            
            <div class="plants-group-title" v-if="otherPlants.length">Все культуры</div>
            <label v-for="p in otherPlants" :key="p.id" class="plant-row">
              <div class="plant-info">
                <span class="emoji">{{ p.emoji }}</span>
                <span class="name">{{ p.name }}</span>
              </div>
              <input type="checkbox" :value="'p_' + p.id" v-model="form.selected_ids" class="fp-checkbox" />
            </label>
          </div>
        </div>
      </Transition>
    </Teleport>
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
.plants-selector-trigger {
  width: 100%; border: 1.5px solid var(--color-border); border-radius: 12px;
  background: var(--color-surface); height: 48px; padding: 0 12px 0 14px;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  cursor: pointer; transition: border-color 0.2s;
  &:active { border-color: var(--color-primary); }
  .trigger-value { flex: 1; font-size: 15px; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .chevron { color: var(--color-text-secondary); flex-shrink: 0; }
}
.type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.type-btn {
  padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
  background: var(--color-surface); font-size: 13px; color: var(--color-text-secondary);
  cursor: pointer; text-align: center;
  &.active { background: var(--color-surface-hover); border-color: var(--color-primary); color: var(--color-primary); font-weight: 600; }
}
.reminder-field { background: var(--color-surface-hover); padding: 14px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
.reminder-options { display: flex; gap: 8px; margin-top: 8px; }
.rem-btn {
  flex: 1; padding: 10px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary);
  border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  &:hover { color: var(--color-text-primary); }
  &.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
}

.reminder-custom-input-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.custom-days-input {
  width: 80px !important;
  padding: 8px !important;
  text-align: center;
  height: 38px;
}

.future-date-badge-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.future-date-badge {
  background: var(--color-primary-subtle, rgba(45, 106, 79, 0.12));
  color: var(--color-primary);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid var(--color-primary);
  display: flex;
  align-items: center;
  gap: 6px;

  strong {
    color: var(--color-text-primary);
    font-weight: 700;
  }
}

.weather-warning-badge {
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 6px;

  &.rain {
    background: rgba(217, 119, 6, 0.1);
    color: #d97706;
    border-left: 3px solid #d97706;
  }

  &.cold {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
    border-left: 3px solid #2563eb;
  }

  &.wind {
    background: rgba(107, 114, 128, 0.1);
    color: #4b5563;
    border-left: 3px solid #4b5563;
  }
}
.save-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px;
  background: var(--color-primary); color: var(--color-on-primary); border: none; border-radius: var(--radius-lg);
  font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

/* Modal styles */
.picker-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--color-background); z-index: 2000; display: flex; flex-direction: column; }
.picker-header { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid var(--color-border); background: var(--color-surface); }
.picker-title { font-size: 1.125rem; font-weight: 600; margin: 0; }
.close-btn { background: none; border: none; padding: 4px; color: var(--color-text-primary); cursor: pointer; }
.done-btn { background: none; border: none; padding: 4px 8px; color: var(--color-primary); font-weight: 600; font-size: 15px; cursor: pointer; }
.picker-content { flex: 1; overflow-y: auto; padding-bottom: 40px; }
.plants-group-title { font-size: 12px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; padding: 16px 16px 8px; }
.plant-row {
  display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--color-border);
  cursor: pointer; background: var(--color-surface);
  &:active { background: var(--color-surface-hover); }
}
.plant-info { display: flex; align-items: center; gap: 12px; }
.plant-info .emoji { font-size: 24px; line-height: 1; }
.plant-info .details { display: flex; flex-direction: column; gap: 2px; }
.plant-info .name { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.plant-info .loc { font-size: 13px; color: var(--color-text-secondary); }
.fp-checkbox { width: 22px; height: 22px; accent-color: var(--color-primary); cursor: pointer; }

.picker-fade-enter-active, .picker-fade-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.picker-fade-enter-from, .picker-fade-leave-to { transform: translateY(100%); opacity: 0; }

.field-label-row {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;
  .field-label { margin-bottom: 0; }
}

.tank-mix-toggle {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; padding: 4px 10px;
  border: 1px solid var(--color-border); border-radius: var(--radius-pill);
  background: var(--color-surface); color: var(--color-text-secondary);
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
  &:hover { border-color: var(--color-primary); color: var(--color-primary); }
  &.active { background: var(--color-primary); border-color: var(--color-primary); color: white; }
}

.tank-mix-fields {
  display: flex; flex-direction: column; gap: 8px;
}

.mix-compat-badge {
  margin-top: 8px; padding: 10px 12px; border-radius: var(--radius-md);
  display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; line-height: 1.45;
  &.compatible { background: rgba(46,204,113,0.1); border-left: 3px solid #2ecc71; color: #27ae60; }
  &.incompatible { background: rgba(231,76,60,0.1); border-left: 3px solid #e74c3c; color: #c0392b; }
  &.caution { background: rgba(241,196,15,0.1); border-left: 3px solid #f1c40f; color: #d35400; }
  .mix-compat-icon { flex-shrink: 0; margin-top: 1px; }
  .mix-compat-text { flex: 1; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
