<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sun, Droplets, ChevronRight, RefreshCw, Calculator, ShieldAlert, Sparkles } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { WeatherService, type WeatherData } from '@/modules/weather/services/WeatherService'
import { PlantService, type PlantCare, type Plant } from '@/modules/plants/services/PlantService'
import { useReminderState, ReminderNotificationCard } from '@/modules/reminders'
import { useTipsState, TipOfTheDayCard } from '@/modules/tips'

const router = useRouter()

const weather = ref<WeatherData | null>(null)
const weatherLoading = ref(true)
const weatherError = ref('')

const recommendations = ref<(PlantCare & { plant: Plant })[]>([])
const recsLoading = ref(true)

const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })
const currentMonth = new Date().getMonth() + 1

const careTypeLabel: Record<string, string> = {
  watering: 'Полив',
  fertilizing: 'Подкормка',
  spraying: 'Опрыскивание',
  pruning: 'Обрезка'
}

const careTypeDot: Record<string, string> = {
  watering: '#3b82f6',
  fertilizing: '#8B5E3C',
  spraying: '#E76F51',
  pruning: '#52B788'
}

async function loadWeather() {
  weatherLoading.value = true
  weatherError.value = ''
  try {
    weather.value = await WeatherService.getWithCache()
    await loadRecommendations()
  } catch (e: any) {
    weatherError.value = e.message || 'Не удалось загрузить погоду'
  } finally {
    weatherLoading.value = false
  }
}

const userPlants = ref<string[]>([])

async function loadRecommendations() {
  recsLoading.value = true
  try {
    const temp = weather.value?.temp ?? 20
    const [allRecs, myPlants] = await Promise.all([
      PlantService.getRecommendations(currentMonth, temp),
      PlantService.getUserPlants()
    ])
    userPlants.value = myPlants.map(u => u.plant_id)
    if (userPlants.value.length > 0) {
      const myRecs = allRecs.filter(r => userPlants.value.includes(r.plant_id))
      const otherRecs = allRecs.filter(r => !userPlants.value.includes(r.plant_id))
      recommendations.value = [...myRecs, ...otherRecs]
    } else {
      recommendations.value = allRecs
    }
  } catch (e) {
    console.error(e)
  } finally {
    recsLoading.value = false
  }
}

const { activeReminders, loadForToday, completeReminder, dismissReminder } = useReminderState()
const { currentTip, nextTip } = useTipsState()

function onCompleteReminder(id: string, raw: any) {
  completeReminder(id)
  const p = encodeURIComponent(raw.product || '')
  const d = encodeURIComponent(raw.dose || '')
  const sel = encodeURIComponent(raw.userPlantId ? 'u_' + raw.userPlantId : 'p_' + raw.plantId)
  router.push(`/journal/add?care_type=${raw.careType}&product=${p}&dose=${d}&selected_id=${sel}`)
}

onMounted(() => {
  loadWeather()
  loadForToday()
})
</script>

<template>
  <div class="today-view">
    <div class="page-header">
      <div class="header-meta">{{ today }}</div>
      <h1 class="header-title">Что нужно сделать</h1>
    </div>

    <!-- Weather -->
    <div v-if="weatherLoading" class="weather-card skeleton">
      <div class="skeleton-line" style="width:60%; height:18px;"></div>
    </div>
    <div v-else-if="weatherError" class="weather-card error-card">
      <span>{{ weatherError }}</span>
      <button class="retry-btn" @click="loadWeather"><RefreshCw :size="14" /> Повтор</button>
    </div>
    <div v-else-if="weather" class="weather-card">
      <div class="weather-left">
        <Sun class="weather-icon" :size="28" />
        <div>
          <div class="weather-temp">{{ weather.temp }}°C · {{ weather.city }}</div>
          <div class="weather-condition">{{ weather.condition }}</div>
        </div>
      </div>
      <button class="weather-change" @click="router.push('/profile')">
        Изменить <ChevronRight :size="14" />
      </button>
    </div>

    <!-- Active Reminders -->
    <div v-if="activeReminders.length > 0" class="reminders-container">
      <ReminderNotificationCard
        v-for="rem in activeReminders"
        :key="rem.id"
        :reminder="rem"
        @complete="onCompleteReminder"
        @dismiss="dismissReminder"
      />
    </div>

    <!-- Fungus risk alert -->
    <div v-if="weather && weather.temp >= 15 && weather.temp <= 25" class="alert-card">
      <div class="alert-plant">Томаты, огурцы, виноград</div>
      <div class="alert-title">⚠ Условия для грибка</div>
      <div class="alert-text">
        При t° {{ weather.temp }}°C и влажности — повышенный риск мучнистой росы и фитофтороза.
        Проведи профилактическое опрыскивание.
      </div>
    </div>

    <!-- Быстрый доступ -->
    <div class="quick-banners-grid">
      <div class="banner-card calc-banner" @click="router.push('/calculator')">
        <div class="banner-icon"><Calculator :size="24" /></div>
        <div class="banner-info">
          <h3>Агрокалькулятор</h3>
          <p>Расчет дозировок удобрений и полива</p>
        </div>
        <ChevronRight :size="18" class="banner-arrow" />
      </div>

      <div class="banner-card prod-banner" @click="router.push('/products')">
        <div class="banner-icon"><ShieldAlert :size="24" /></div>
        <div class="banner-info">
          <h3>Справочник препаратов</h3>
          <p>Составы, сроки ожидания и аналоги</p>
        </div>
        <ChevronRight :size="18" class="banner-arrow" />
      </div>
    </div>

    <!-- Агрономический совет дня -->
    <section class="section tip-section">
      <div class="section-title">
        <Sparkles :size="16" />
        Совет дня от агронома
      </div>
      <TipOfTheDayCard :tip="currentTip" @next="nextTip" />
    </section>

    <!-- Recommendations -->
    <section class="section">
      <div class="section-title">
        <Droplets :size="16" />
        Рекомендации на {{ currentMonth }} месяц
      </div>

      <div v-if="recsLoading" class="recs-skeleton">
        <div v-for="i in 3" :key="i" class="skeleton-card"></div>
      </div>

      <div v-else-if="recommendations.length === 0" class="empty-recs">
        На текущий период активных рекомендаций нет.
      </div>

      <div
        v-else
        v-for="rec in recommendations.slice(0, 6)"
        :key="rec.id"
        class="rec-card"
        @click="router.push('/journal/add')"
      >
        <div class="rec-dot" :style="{ background: careTypeDot[rec.care_type] || '#2D6A4F' }"></div>
        <div class="rec-content">
          <div class="rec-text">
            {{ careTypeLabel[rec.care_type] || rec.care_type }}
            <span class="rec-plant">
              — <span v-if="userPlants.includes(rec.plant_id)" class="garden-star" title="Мой огород">⭐</span> {{ rec.plant?.name }}
            </span>
          </div>
          <div class="rec-note">{{ rec.products?.slice(0, 2).join(', ') || rec.description }}</div>
        </div>
        <ChevronRight :size="16" class="rec-arrow" />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.today-view { padding: 16px 16px 24px; }
.reminders-container { margin-bottom: 16px; }

.page-header { margin-bottom: 16px; }
.header-meta { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 4px; text-transform: capitalize; }
.header-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

.weather-card {
  background: var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  color: var(--color-on-primary);
  min-height: 64px;
  &.skeleton { background: var(--color-surface); border: 1px solid var(--color-border); }
  &.error-card { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-secondary); font-size: 13px; gap: 12px; }
}
.weather-left { display: flex; align-items: center; gap: 12px; }
.weather-temp { font-size: 16px; font-weight: 700; }
.weather-condition { font-size: 12px; opacity: 0.75; margin-top: 2px; }
.weather-change {
  background: rgba(255,255,255,0.2); border: none; border-radius: var(--radius-sm);
  color: white; font-size: 12px; padding: 6px 10px; cursor: pointer;
  display: flex; align-items: center; gap: 2px;
}
.retry-btn {
  display: flex; align-items: center; gap: 4px; padding: 6px 10px;
  background: var(--color-surface-hover); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; color: var(--color-text-secondary);
}

.alert-card {
  background: #FFF8EC; border: 1px solid #F0C060; border-radius: var(--radius-md);
  padding: 12px 14px; margin-bottom: 16px;
  body.dark-theme & { background: #2A1F0A; border-color: #7A5010; }
}
.alert-plant { font-size: 11px; color: var(--color-warning); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.alert-title { font-size: 14px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; }
.alert-text { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }

.section { margin-bottom: 20px; }
.section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--color-text-secondary); margin-bottom: 10px;
}

.skeleton-line { background: var(--color-border); border-radius: 4px; }
.recs-skeleton { display: flex; flex-direction: column; gap: 8px; }
.skeleton-card { height: 60px; background: var(--color-border); border-radius: var(--radius-md); opacity: 0.5; }

.empty-recs { font-size: 14px; color: var(--color-text-secondary); text-align: center; padding: 24px 0; }

.rec-card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 8px;
  display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background 0.15s;
  &:active { background: var(--color-surface-hover); }
}
.rec-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.rec-content { flex: 1; min-width: 0; }
.rec-text { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.rec-plant { font-weight: 400; color: var(--color-text-secondary); }
.rec-note { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.garden-star { font-size: 12px; margin-right: 2px; }
.rec-arrow { color: var(--color-text-disabled); flex-shrink: 0; }

/* ── QUICK BANNERS ── */
.quick-banners-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 24px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.banner-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-sm);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.calc-banner {
    border-color: rgba(45,106,79,0.3);
    .banner-icon { background: rgba(45,106,79,0.15); color: var(--color-primary); }
    &:hover { border-color: var(--color-primary); }
  }

  &.prod-banner {
    border-color: rgba(244,162,97,0.3);
    .banner-icon { background: rgba(244,162,97,0.15); color: #F4A261; }
    &:hover { border-color: #F4A261; }
  }
}

.banner-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.banner-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  h3 { margin: 0; font-size: 16px; font-weight: 800; color: var(--color-text-primary); }
  p { margin: 0; font-size: 12px; color: var(--color-text-secondary); line-height: 1.3; }
}

.banner-arrow {
  color: var(--color-text-disabled);
  flex-shrink: 0;
  transition: transform 0.15s;
}

.banner-card:hover .banner-arrow {
  transform: translateX(2px);
  color: var(--color-text-primary);
}
</style>
