<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sun, Droplets, ChevronRight, RefreshCw, Calculator, ShieldAlert, Sparkles, MapPin, Wind, CloudRain, Cloud, Snowflake, CloudLightning } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { WeatherService, type WeatherData, type DailyForecast } from '@/modules/weather/services/WeatherService'
import { PlantService, type PlantCare, type Plant } from '@/modules/plants/services/PlantService'
import { useReminderState, ReminderNotificationCard, type EnrichedReminder } from '@/modules/reminders'
import { useTipsState, TipOfTheDayModal } from '@/modules/tips'
import { AgroQuizWidget } from '@/modules/quiz'
import FpPullToRefresh from '@/design-system/components/FpPullToRefresh.vue'

const router = useRouter()

const weather = ref<WeatherData | null>(null)
const forecast = ref<DailyForecast[]>([])
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
    const data = await WeatherService.getWithCache()
    weather.value = data
    forecast.value = await WeatherService.getWeeklyForecast(data.lat, data.lon)
    await loadRecommendations()
  } catch (e: unknown) {
    weatherError.value = e instanceof Error ? e.message : 'Не удалось загрузить погоду'
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

const showTipModal = ref(false)

function onTipModalClose(val: boolean) {
  showTipModal.value = val
  if (!val) {
    const todayStr = new Date().toISOString().split('T')[0]
    localStorage.setItem('rostok_daily_tip_date', todayStr)
  }
}

function onCompleteReminder(id: string, raw: EnrichedReminder) {
  completeReminder(id)
  const p = encodeURIComponent(raw.product || '')
  const d = encodeURIComponent(raw.dose || '')
  const sel = encodeURIComponent(raw.userPlantId ? 'u_' + raw.userPlantId : 'p_' + raw.plantId)
  router.push(`/journal/add?care_type=${raw.careType || ''}&product=${p}&dose=${d}&selected_id=${sel}`)
}

async function onRefresh(done: () => void) {
  try {
    await Promise.all([
      loadWeather(),
      loadForToday()
    ])
  } catch (err) {
    console.error('Ошибка Pull-to-refresh на экране Сегодня:', err)
  } finally {
    done()
  }
}

function getShortDayName(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { weekday: 'short' })
}

function getWeatherIcon(code: number) {
  if (code === 0) return Sun
  if (code <= 3) return Cloud
  if (code <= 49) return Cloud
  if (code <= 69) return CloudRain
  if (code <= 79) return Snowflake
  if (code <= 82) return CloudRain
  if (code <= 99) return CloudLightning
  return Sun
}

// Викторина импортирована из модуля quiz

onMounted(() => {
  loadWeather()
  loadForToday()

  const todayStr = new Date().toISOString().split('T')[0]
  if (localStorage.getItem('rostok_daily_tip_date') !== todayStr) {
    showTipModal.value = true
  }
})

</script>

<template>
  <FpPullToRefresh @refresh="onRefresh">
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
    <div v-else-if="weather" class="weather-widget">
      <div class="weather-main-row">
        <div class="weather-left">
          <component :is="getWeatherIcon(forecast[0]?.weatherCode || 0)" class="weather-main-icon" :size="36" />
          <div class="weather-main-info">
            <div class="weather-temp-large">{{ weather.temp }}°C</div>
            <div class="weather-condition-text">{{ weather.condition }} · г. {{ weather.city }}</div>
          </div>
        </div>
        <button class="weather-gps-btn" @click="loadWeather" title="Обновить по GPS">
          <MapPin :size="16" />
        </button>
      </div>

      <div class="weather-details-row">
        <div class="weather-detail-item">
          <Droplets :size="14" /> {{ weather.humidity || 0 }}%
        </div>
        <div class="weather-detail-item">
          <Wind :size="14" /> {{ weather.windSpeed || 0 }} км/ч
        </div>
      </div>

      <div class="weather-forecast-row" v-if="forecast.length > 0">
        <div v-for="day in forecast.slice(1, 5)" :key="day.date" class="forecast-item">
          <div class="forecast-day">{{ getShortDayName(day.date) }}</div>
          <component :is="getWeatherIcon(day.weatherCode)" class="forecast-icon" :size="18" />
          <div class="forecast-temp">{{ day.tempMax }}°</div>
        </div>
      </div>
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
      <div class="alert-header">
        <div class="alert-badge">
          <ShieldAlert :size="14" class="alert-icon-warn" />
          <span>Высокий риск фитофторы и росы</span>
        </div>
        <span class="alert-target-plants">Томаты, огурцы, виноград</span>
      </div>
      <h3 class="alert-title">⚠ Идеальные условия для грибка ({{ weather.temp }}°C)</h3>
      <p class="alert-text">
        При текущей температуре и влажности многократно возрастает риск развития мучнистой росы и фитофтороза. Проведи срочную профилактическую обработку.
      </p>
      <div class="alert-fungicides">
        <span class="fungicides-label">Рекомендуемые препараты:</span>
        <div class="fungicides-list">
          <button class="fungicide-btn" @click="router.push('/products/fitosporin')" title="Фитоспорин-М (Био)">
            <span class="f-icon">🦠</span>
            <span class="f-name">Фитоспорин</span>
            <span class="f-tag bio">Био</span>
          </button>
          <button class="fungicide-btn" @click="router.push('/products/horus')" title="Хорус (Системный)">
            <span class="f-icon">❄️</span>
            <span class="f-name">Хорус</span>
            <span class="f-tag sys">Системный</span>
          </button>
          <button class="fungicide-btn" @click="router.push('/products/skor')" title="Скор (Системный)">
            <span class="f-icon">☀️</span>
            <span class="f-name">Скор</span>
            <span class="f-tag sys">Системный</span>
          </button>
        </div>
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
      <div class="compact-tip-banner" @click="showTipModal = true">
        <div class="banner-sparkle-box">
          <Sparkles :size="20" class="sparkle-icon" />
        </div>
        <div class="compact-banner-info">
          <span class="badge">{{ currentTip.categoryBadge }}</span>
          <h3 class="banner-tip-title">{{ currentTip.emoji }} {{ currentTip.title }}</h3>
        </div>
        <div class="banner-read-action">
          <span>Читать</span>
          <ChevronRight :size="16" class="read-arrow" />
        </div>
      </div>
    </section>

    <!-- Агро-квиз «Правда или Миф» -->
    <AgroQuizWidget />

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

    <!-- Модальное окно совета дня -->
    <TipOfTheDayModal
      :tip="currentTip"
      :model-value="showTipModal"
      @update:model-value="onTipModalClose"
      @next="nextTip"
    />
    </div>
  </FpPullToRefresh>
</template>


<style scoped lang="scss">
.today-view { padding: 16px 16px 24px; }
.reminders-container { margin-bottom: 16px; }

.page-header { margin-bottom: 16px; }
.header-meta { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 4px; text-transform: capitalize; }
.header-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin: 0; }

.weather-widget {
  background: linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, #1e3a8a));
  border-radius: var(--radius-xl);
  padding: 16px 20px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 8px 24px rgba(45, 106, 79, 0.2);
}

.weather-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.weather-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.weather-main-icon {
  color: #fbbf24;
}

.weather-temp-large {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}

.weather-condition-text {
  font-size: 13px;
  opacity: 0.9;
  font-weight: 500;
}

.weather-gps-btn {
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255,255,255,0.25);
  }
}

.weather-details-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 600;
  opacity: 0.9;
}

.weather-detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.weather-forecast-row {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(255,255,255,0.15);
  padding-top: 12px;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.forecast-day {
  font-size: 11px;
  text-transform: capitalize;
  opacity: 0.8;
  font-weight: 600;
}

.forecast-icon {
  color: rgba(255,255,255,0.9);
}

.forecast-temp {
  font-size: 13px;
  font-weight: 700;
}

.retry-btn {
  display: flex; align-items: center; gap: 4px; padding: 6px 10px;
  background: var(--color-surface-hover); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; color: var(--color-text-secondary);
}

.alert-card {
  background: linear-gradient(135deg, #FFF8EC, #FFF2D6);
  border: 1px solid #F0C060;
  border-radius: var(--radius-xl);
  padding: 18px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(240, 192, 96, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12px;

  body.dark-theme & {
    background: linear-gradient(135deg, #2A1F0A, #1F1605);
    border-color: #7A5010;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
}

.alert-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.alert-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(231, 111, 81, 0.15);
  color: #E76F51;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.alert-icon-warn {
  color: #E76F51;
  flex-shrink: 0;
}

.alert-target-plants {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.alert-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
}

.alert-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.alert-fungicides {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fungicides-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fungicides-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fungicide-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 8px 12px;
  border-radius: var(--radius-lg);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  .f-icon { font-size: 14px; }
  .f-tag {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 800;
    text-transform: uppercase;

    &.bio { background: rgba(45, 106, 79, 0.15); color: var(--color-primary); }
    &.sys { background: rgba(38, 70, 83, 0.15); color: #264653; body.dark-theme & { color: #88C0D0; } }
  }
}

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

/* ── COMPACT TIP BANNER ── */
.compact-tip-banner {
  background: linear-gradient(135deg, var(--color-surface), color-mix(in srgb, var(--color-surface) 96%, var(--color-primary)));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--color-primary);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);

    .read-arrow {
      transform: translateX(3px);
      color: var(--color-primary);
    }
  }
}

.banner-sparkle-box {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-lg);
  background: rgba(45, 106, 79, 0.12);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.compact-banner-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  .badge {
    font-size: 11px;
    font-weight: 800;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .banner-tip-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.banner-read-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  flex-shrink: 0;

  .read-arrow {
    transition: transform 0.15s;
  }
}</style>
