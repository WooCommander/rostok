<script setup lang="ts">
import { RefreshCw, Droplets, MapPin, Wind, CloudRain, Cloud, Snowflake, CloudLightning, Sun } from 'lucide-vue-next'
import { type WeatherData, type DailyForecast } from '../services/WeatherService'

interface Props {
  weather: WeatherData | null
  forecast: DailyForecast[]
  loading: boolean
  error: string
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'refresh'): void
}>()

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
</script>

<template>
  <div v-if="loading" class="weather-card skeleton">
    <div class="skeleton-line" style="width:60%; height:18px;"></div>
  </div>
  <div v-else-if="error" class="weather-card error-card">
    <span>{{ error }}</span>
    <button class="retry-btn" @click="emit('refresh')"><RefreshCw :size="14" /> Повтор</button>
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
      <button class="weather-gps-btn" @click="emit('refresh')" title="Обновить по GPS">
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
</template>

<style scoped lang="scss">
.weather-card {
  padding: 16px 20px; border-radius: var(--radius-xl); margin-bottom: 20px;
}
.skeleton { background: var(--color-surface-hover); }
.skeleton-line { background: var(--color-border); border-radius: 4px; }
.error-card { display: flex; justify-content: space-between; align-items: center; background: rgba(231, 111, 81, 0.1); color: #E76F51; }
.retry-btn { display: flex; align-items: center; gap: 4px; padding: 6px 10px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 12px; cursor: pointer; color: var(--color-text-primary); }

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
</style>
