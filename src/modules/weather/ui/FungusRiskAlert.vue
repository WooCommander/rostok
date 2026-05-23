<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { type WeatherData } from '../services/WeatherService'

interface Props {
  weather: WeatherData | null
}

defineProps<Props>()
const router = useRouter()

</script>

<template>
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
</template>

<style scoped lang="scss">
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
</style>
