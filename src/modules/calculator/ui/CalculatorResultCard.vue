<script setup lang="ts">
import { Droplets, Scale, AlertCircle, Utensils, Award } from 'lucide-vue-next'
import type { CalculationResult, FertilizerMeta } from '../services/CalculatorService'

interface Props {
  result: CalculationResult
  fertilizer: FertilizerMeta
}

const props = defineProps<Props>()
</script>

<template>
  <div class="result-card">
    <div class="card-header">
      <div class="header-icon"><Scale :size="24" /></div>
      <div class="header-info">
        <span class="sub-label">Итоговый расчет подкормки</span>
        <h3 class="fert-name">{{ props.fertilizer.name }}</h3>
      </div>
    </div>

    <div class="main-stats-grid">
      <div class="stat-box primary-stat">
        <Scale class="stat-icon" :size="20" />
        <div class="stat-content">
          <span class="stat-num">{{ props.result.fertilizerAmountGrams }} г</span>
          <span class="stat-desc">Точный вес удобрения</span>
        </div>
      </div>

      <div class="stat-box water-stat">
        <Droplets class="stat-icon" :size="20" />
        <div class="stat-content">
          <span class="stat-num">{{ props.result.waterAmountLiters }} л</span>
          <span class="stat-desc">Объем воды для раствора (~{{ props.result.recommendedSolutionsCount }} ведер по 10л)</span>
        </div>
      </div>
    </div>

    <div class="approx-box">
      <div class="approx-item">
        <Utensils :size="16" class="approx-icon" />
        <span>≈ <strong>{{ props.result.spoonApprox }}</strong> столовых ложек (с горкой)</span>
      </div>
      <div v-if="props.result.glassApprox >= 0.3" class="approx-item">
        <Award :size="16" class="approx-icon glass-icon" />
        <span>≈ <strong>{{ props.result.glassApprox }}</strong> стандартных стаканов (200 мл)</span>
      </div>
    </div>

    <div class="tips-box">
      <div class="tips-head">
        <AlertCircle :size="16" class="tips-icon" />
        <span>Регламент и совет агронома</span>
      </div>
      <p class="tips-text">{{ props.result.tips }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.result-card {
  background: var(--color-surface);
  border: 1px solid var(--color-primary-subtle, rgba(45,106,79,0.3));
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--color-primary-subtle, rgba(45,106,79,0.15));
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.sub-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.fert-name {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
}

/* ── MAIN STATS ── */
.main-stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-box {
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--color-border);

  &.primary-stat {
    background: var(--color-primary-subtle, rgba(45,106,79,0.08));
    border-color: var(--color-primary);
    .stat-icon { color: var(--color-primary); }
    .stat-num { color: var(--color-primary); font-size: 24px; font-weight: 800; }
  }

  &.water-stat {
    background: rgba(59,130,246,0.08);
    border-color: #3b82f6;
    .stat-icon { color: #3b82f6; }
    .stat-num { color: #3b82f6; font-size: 24px; font-weight: 800; }
  }
}

.stat-icon {
  flex-shrink: 0;
  padding: 10px;
  background: white;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  box-shadow: var(--shadow-sm);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-desc {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* ── APPROX ── */
.approx-box {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-primary);
}

.approx-item {
  display: flex;
  align-items: center;
  gap: 10px;

  strong { color: var(--color-primary); font-size: 15px; }
  .approx-icon { color: var(--color-text-secondary); }
  .glass-icon { color: #F4A261; }
}

/* ── TIPS ── */
.tips-box {
  background: rgba(244,162,97,0.1);
  border: 1px solid rgba(244,162,97,0.4);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tips-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-warn, #d97706);
}

.tips-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);
}
</style>
