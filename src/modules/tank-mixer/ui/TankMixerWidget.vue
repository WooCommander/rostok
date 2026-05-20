<script setup lang="ts">
import { ref, computed } from 'vue'
import { ProductItem } from '@/modules/products'
import { TankMixerService, type MixCheckResult } from '../services/tankMixerService'
import { Beaker, AlertTriangle, CheckCircle, XCircle } from 'lucide-vue-next'

const props = defineProps<{
  products: ProductItem[]
}>()

const selectedProduct1 = ref<ProductItem | null>(null)
const selectedProduct2 = ref<ProductItem | null>(null)
const selectedProduct3 = ref<ProductItem | null>(null)

const result = computed<MixCheckResult | null>(() => {
  const selected = [selectedProduct1.value, selectedProduct2.value, selectedProduct3.value].filter(Boolean) as ProductItem[]
  if (selected.length < 2) return null

  return TankMixerService.checkMultipleCompatibility(selected)
})

function onSelectProduct1(e: Event) {
  const target = e.target as HTMLSelectElement
  const p = props.products.find(x => x.id === target.value) || null
  selectedProduct1.value = p
}

function onSelectProduct2(e: Event) {
  const target = e.target as HTMLSelectElement
  const p = props.products.find(x => x.id === target.value) || null
  selectedProduct2.value = p
}

function onSelectProduct3(e: Event) {
  const target = e.target as HTMLSelectElement
  const p = props.products.find(x => x.id === target.value) || null
  selectedProduct3.value = p
}

function reset() {
  selectedProduct1.value = null
  selectedProduct2.value = null
  selectedProduct3.value = null
  const selects = document.querySelectorAll('.mixer-select')
  selects.forEach(s => (s as HTMLSelectElement).value = '')
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

    <div class="mixer-selectors">
      <div class="select-group">
        <label>Препарат 1</label>
        <select class="mixer-select" @change="onSelectProduct1">
          <option value="">-- Выберите препарат --</option>
          <option v-for="p in props.products" :key="'1-' + p.id" :value="p.id">
            {{ p.icon }} {{ p.name }}
          </option>
        </select>
      </div>

      <div class="plus-sign">+</div>

      <div class="select-group">
        <label>Препарат 2</label>
        <select class="mixer-select" @change="onSelectProduct2">
          <option value="">-- Выберите препарат --</option>
          <option v-for="p in props.products" :key="'2-' + p.id" :value="p.id">
            {{ p.icon }} {{ p.name }}
          </option>
        </select>
      </div>

      <div class="plus-sign">+</div>

      <div class="select-group">
        <label>Препарат 3 (необязательно)</label>
        <select class="mixer-select" @change="onSelectProduct3">
          <option value="">-- Выберите препарат --</option>
          <option v-for="p in props.products" :key="'3-' + p.id" :value="p.id">
            {{ p.icon }} {{ p.name }}
          </option>
        </select>
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

.mixer-select {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--color-primary);
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
