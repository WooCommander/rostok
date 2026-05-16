<script setup lang="ts">
import type { ProductItem } from '../services/ProductService'
import { AlertCircle, Clock, ShieldAlert } from 'lucide-vue-next'

interface Props {
  product: ProductItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click', product: ProductItem): void
}>()

const CATEGORY_NAMES: Record<string, { label: string; bg: string; color: string }> = {
  fungicide: { label: 'Фунгицид', bg: 'rgba(45,106,79,0.15)', color: '#2D6A4F' },
  insecticide: { label: 'Инсектицид', bg: 'rgba(231,111,81,0.15)', color: '#E76F51' },
  fertilizer: { label: 'Удобрение', bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  bio: { label: 'Биопрепарат', bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
}
</script>

<template>
  <div class="product-card" @click="emit('click', props.product)">
    <div class="card-top">
      <div class="product-icon">{{ props.product.icon }}</div>
      <div class="product-title-area">
        <h3 class="product-name">{{ props.product.name }}</h3>
        <span 
          class="cat-badge" 
          :style="{ 
            backgroundColor: CATEGORY_NAMES[props.product.category]?.bg, 
            color: CATEGORY_NAMES[props.product.category]?.color 
          }"
        >
          {{ CATEGORY_NAMES[props.product.category]?.label || props.product.category }}
        </span>
      </div>
    </div>

    <div class="active-ing">
      <span class="ing-label">Действующее вещество:</span> {{ props.product.active_ingredient }}
    </div>

    <p class="product-desc">{{ props.product.description }}</p>

    <div class="card-footer">
      <div v-if="props.product.waiting_period_days !== null" class="footer-item wait-time" :title="'Срок ожидания до сбора урожая: ' + props.product.waiting_period_days + ' дней'">
        <Clock :size="14" />
        <span>Срок: {{ props.product.waiting_period_days === 0 ? 'нет' : props.product.waiting_period_days + ' дней' }}</span>
      </div>
      <div class="footer-item hazard" :title="props.product.hazard_class">
        <ShieldAlert :size="14" />
        <span class="hazard-text">{{ props.product.hazard_class.split('(')[0].trim() }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.product-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary-subtle, rgba(45,106,79,0.3));
  }
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.product-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.product-title-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.product-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.cat-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

.active-ing {
  font-size: 13px;
  color: var(--color-text-primary);
  background: var(--color-background);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  border-left: 3px solid var(--color-primary);

  .ing-label {
    font-weight: 600;
    color: var(--color-text-secondary);
  }
}

.product-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;

  &.wait-time {
    color: var(--color-primary);
  }
  &.hazard {
    color: var(--color-error, #E76F51);
  }
}

.hazard-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}
</style>
