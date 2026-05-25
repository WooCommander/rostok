<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ProductItem } from '@/modules/products'
import { TankMixerService, type MixCheckResult, type PopularMix } from '../services/tankMixerService'
import { Beaker, AlertTriangle, CheckCircle, XCircle } from 'lucide-vue-next'
import FpMobilePicker from '@/design-system/components/FpMobilePicker.vue'
import FpSpinner from '@/design-system/components/FpSpinner.vue'

const props = defineProps<{
  products: ProductItem[]
}>()

const selectedProduct1 = ref<ProductItem | null>(null)
const selectedProduct2 = ref<ProductItem | null>(null)
const selectedProduct3 = ref<ProductItem | null>(null)

const popularMixes = ref<PopularMix[]>([])
const loadingMixes = ref(true)

onMounted(async () => {
  try {
    popularMixes.value = await TankMixerService.getPopularMixes()
  } finally {
    loadingMixes.value = false
  }
})

const result = computed<MixCheckResult | null>(() => {
  const selected = [selectedProduct1.value, selectedProduct2.value, selectedProduct3.value].filter(Boolean) as ProductItem[]
  if (selected.length < 2) return null

  return TankMixerService.checkMultipleCompatibility(selected)
})

const pickerItems = computed(() => {
  return props.products.map(p => ({
    id: p.id,
    name: `${p.icon} ${p.name}`,
    originalProduct: p
  }))
})



function applyMix(mixIds: string[]) {
  reset()
  if (mixIds[0]) selectedProduct1.value = props.products.find(p => p.id === mixIds[0]) || null
  if (mixIds[1]) selectedProduct2.value = props.products.find(p => p.id === mixIds[1]) || null
  if (mixIds[2]) selectedProduct3.value = props.products.find(p => p.id === mixIds[2]) || null
}

function reset() {
  selectedProduct1.value = null
  selectedProduct2.value = null
  selectedProduct3.value = null
}
</script>

<template>
  <div class="tank-mixer">
    <div class="mixer-header">
      <div class="icon-wrap">
        <Beaker :size="24" />
      </div>
      <h2>Конструктор баковых смесей</h2>
      <p>Проверьте, можно ли смешивать препараты в одном опрыскивателе</p>
    </div>

    <div class="popular-mixes">
      <div class="mixes-title">Популярные рецепты:</div>
      <div v-if="loadingMixes" style="display: flex; justify-content: center; padding: 8px 0;">
        <FpSpinner size="md" />
      </div>
      <div v-else-if="popularMixes.length > 0" class="mix-chips">
        <button v-for="(mix, i) in popularMixes" :key="i" class="mix-chip" @click="applyMix(mix.products)">
          {{ mix.name }}
        </button>
      </div>
      <div v-else style="font-size: 13px; color: var(--color-text-tertiary);">
        Нет доступных рецептов
      </div>
    </div>

    <div class="mixer-selectors">
      <div class="select-group">
        <FpMobilePicker
          :model-value="selectedProduct1 ? `${selectedProduct1.icon} ${selectedProduct1.name}` : ''"
          :items="pickerItems"
          label="Препарат 1"
          placeholder="-- Выберите препарат --"
          variant="bordered"
          @select="(item: any) => selectedProduct1 = item.originalProduct"
        />
      </div>

      <div class="plus-sign">+</div>

      <div class="select-group">
        <FpMobilePicker
          :model-value="selectedProduct2 ? `${selectedProduct2.icon} ${selectedProduct2.name}` : ''"
          :items="pickerItems"
          label="Препарат 2"
          placeholder="-- Выберите препарат --"
          variant="bordered"
          @select="(item: any) => selectedProduct2 = item.originalProduct"
        />
      </div>

      <div class="plus-sign">+</div>

      <div class="select-group">
        <FpMobilePicker
          :model-value="selectedProduct3 ? `${selectedProduct3.icon} ${selectedProduct3.name}` : ''"
          :items="pickerItems"
          label="Препарат 3 (необязательно)"
          placeholder="-- Выберите препарат --"
          variant="bordered"
          @select="(item: any) => selectedProduct3 = item.originalProduct"
        />
      </div>
    </div>

    <Transition name="fade">
      <div v-if="result" class="mixer-result" :class="result.result.toLowerCase()">
        <div class="result-icon">
          <CheckCircle v-if="result.result === 'COMPATIBLE'" :size="32" />
          <XCircle v-else-if="result.result === 'INCOMPATIBLE'" :size="32" />
          <AlertTriangle v-else :size="32" />
        </div>
        <div class="result-text">
          <h3>
            <span v-if="result.result === 'COMPATIBLE'">Отличная смесь!</span>
            <span v-else-if="result.result === 'INCOMPATIBLE'">Смешивать нельзя!</span>
            <span v-else>Смешивайте с осторожностью</span>
          </h3>
          <p>{{ result.message }}</p>
        </div>
        <button class="reset-btn" @click="reset">Очистить</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.tank-mixer {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-md);
  margin-bottom: 32px;
}

.mixer-header {
  text-align: center;
  margin-bottom: 24px;

  .icon-wrap {
    width: 48px;
    height: 48px;
    background: var(--color-primary-subtle, rgba(45,106,79,0.2));
    color: var(--color-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }

  h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 8px;
    color: var(--color-text-primary);
  }

  p {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.popular-mixes {
  margin-bottom: 24px;

  .mixes-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 12px;
  }

  .mix-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mix-chip {
    padding: 6px 12px;
    background: var(--color-surface-hover);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: color-mix(in srgb, var(--color-primary) 10%, transparent);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
}

.mixer-selectors {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-end;
  }
}

.select-group {
  flex: 1;
  width: 100%;

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }
}



.plus-sign {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  padding: 0 16px;
  line-height: 44px;
}

.mixer-result {
  margin-top: 24px;
  padding: 20px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;

  @media (min-width: 640px) {
    flex-direction: row;
    text-align: left;
  }

  &.compatible {
    background: rgba(46, 204, 113, 0.1);
    border: 1px solid rgba(46, 204, 113, 0.3);
    .result-icon { color: #2ecc71; }
    h3 { color: #27ae60; }
  }

  &.incompatible {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.3);
    .result-icon { color: #e74c3c; }
    h3 { color: #c0392b; }
  }

  &.caution {
    background: rgba(241, 196, 15, 0.1);
    border: 1px solid rgba(241, 196, 15, 0.3);
    .result-icon { color: #f1c40f; }
    h3 { color: #d35400; }
  }
}

.result-text {
  flex: 1;

  h3 {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
    color: var(--color-text-primary);
  }
}

.reset-btn {
  padding: 8px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
