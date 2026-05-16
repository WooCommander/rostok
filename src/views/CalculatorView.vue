<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, Calculator, HelpCircle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { CalculatorService, type CalculationInput, CalculatorResultCard } from '@/modules/calculator'

const router = useRouter()

const fertilizers = CalculatorService.getFertilizers()

const calcType = ref<'area' | 'bushes' | 'trees'>('area')
const amount = ref<number>(10)
const selectedFertilizerId = ref<string>(fertilizers[0].id)
const soilType = ref<'loam' | 'sandy' | 'clay'>('loam')

const activeFertilizer = computed(() => {
  return fertilizers.find(f => f.id === selectedFertilizerId.value) || fertilizers[0]
})

const calculationResult = computed(() => {
  const input: CalculationInput = {
    calcType: calcType.value,
    amount: Number(amount.value) || 0,
    fertilizerId: selectedFertilizerId.value,
    soilType: soilType.value
  }
  return CalculatorService.calculate(input)
})
</script>

<template>
  <div class="calculator-page">
    <div class="page-header">
      <div class="header-top-row">
        <button class="back-btn" @click="router.back()"><ArrowLeft :size="20" /></button>
        <div class="title-badge"><Calculator :size="16" /> Агрокалькулятор</div>
      </div>
      <h1 class="page-title">Калькулятор подкормок и полива</h1>
      <p class="page-sub">Точный расчет граммовки удобрений и объема воды по площади или количеству растений</p>
    </div>

    <div class="calc-body">
      <!-- Настройки расчета -->
      <div class="calc-form-card">
        <div class="form-section">
          <label class="section-label">1. Выберите удобрение</label>
          <div class="fert-select-grid">
            <button
              v-for="f in fertilizers"
              :key="f.id"
              class="fert-select-btn"
              :class="{ active: selectedFertilizerId === f.id }"
              @click="selectedFertilizerId = f.id"
            >
              <div class="fert-btn-title">{{ f.name }}</div>
              <div class="fert-btn-cat" :class="f.category">
                {{ f.category === 'organic' ? 'Органика' : f.category === 'complex' ? 'Комплексное' : f.category === 'nitrogen' ? 'Азотное' : f.category === 'phosphorus' ? 'Фосфорное' : 'Калийное' }}
              </div>
            </button>
          </div>
          <p class="fert-desc-hint">{{ activeFertilizer.description }}</p>
        </div>

        <div class="form-section">
          <label class="section-label">2. Способ расчета</label>
          <div class="tabs-wrap">
            <button
              class="tab-btn"
              :class="{ active: calcType === 'area' }"
              @click="calcType = 'area'"
            >
              По площади (м²)
            </button>
            <button
              class="tab-btn"
              :class="{ active: calcType === 'bushes' }"
              @click="calcType = 'bushes'"
            >
              Кусты / Овощи (шт.)
            </button>
            <button
              class="tab-btn"
              :class="{ active: calcType === 'trees' }"
              @click="calcType = 'trees'"
            >
              Плодовые деревья (шт.)
            </button>
          </div>
        </div>

        <div class="form-section number-input-section">
          <label class="section-label">
            {{ calcType === 'area' ? '3. Введите площадь посадки (в кв. метрах):' : calcType === 'bushes' ? '3. Количество кустов / растений (шт.):' : '3. Количество плодовых деревьев (шт.):' }}
          </label>
          <div class="num-input-wrap">
            <button class="step-btn" @click="amount = Math.max(1, amount - 1)">-</button>
            <input
              type="number"
              v-model.number="amount"
              min="1"
              max="1000"
              class="num-input"
            />
            <button class="step-btn" @click="amount++">+</button>
            <span class="unit-span">{{ calcType === 'area' ? 'м²' : 'шт.' }}</span>
          </div>
        </div>

        <div class="form-section soil-section">
          <div class="soil-label-row">
            <label class="section-label mb-0">4. Тип грунта на участке</label>
            <HelpCircle :size="16" class="help-icon" title="На песчаных почвах вода уходит быстрее, дозы чуть снижены. На глинистых удерживается дольше." />
          </div>
          <div class="soil-options">
            <button
              class="soil-btn"
              :class="{ active: soilType === 'loam' }"
              @click="soilType = 'loam'"
            >
              Суглинки / Чернозем (норма)
            </button>
            <button
              class="soil-btn"
              :class="{ active: soilType === 'sandy' }"
              @click="soilType = 'sandy'"
            >
              Песчаная (-10% дозы)
            </button>
            <button
              class="soil-btn"
              :class="{ active: soilType === 'clay' }"
              @click="soilType = 'clay'"
            >
              Глинистая (+10% дозы)
            </button>
          </div>
        </div>
      </div>

      <!-- Результат -->
      <div class="result-container">
        <CalculatorResultCard
          :result="calculationResult"
          :fertilizer="activeFertilizer"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.calculator-page {
  padding: 24px 16px 64px;
  max-width: 900px;
  margin: 0 auto;
}

/* ── HEADER ── */
.page-header {
  margin-bottom: 28px;
}

.header-top-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.back-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-primary);
  transition: all 0.15s;

  &:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-primary);
  }
}

.title-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--color-primary-subtle, rgba(45,106,79,0.15));
  color: var(--color-primary);
  border-radius: 99px;
  font-size: 14px;
  font-weight: 700;
}

.page-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.page-sub {
  margin: 0;
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* ── BODY ── */
.calc-body {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.calc-form-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;

  &.mb-0 { margin-bottom: 0; }
}

/* ── FERTILIZER SELECT ── */
.fert-select-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.fert-select-btn {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-surface-hover);
  }

  &.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;

    .fert-btn-title { color: white; }
    .fert-btn-cat { background: rgba(255,255,255,0.2); color: white; }
  }
}

.fert-btn-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.fert-btn-cat {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;

  &.nitrogen { background: rgba(59,130,246,0.15); color: #3b82f6; }
  &.phosphorus { background: rgba(45,106,79,0.15); color: #2D6A4F; }
  &.potassium { background: rgba(244,162,97,0.15); color: #F4A261; }
  &.complex { background: rgba(147,51,234,0.15); color: #9333ea; }
  &.organic { background: rgba(16,185,129,0.15); color: #10b981; }
}

.fert-desc-hint {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  background: var(--color-background);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-primary);
}

/* ── TABS ── */
.tabs-wrap {
  display: flex;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { color: var(--color-text-primary); }

  &.active {
    background: var(--color-surface);
    color: var(--color-primary);
    box-shadow: var(--shadow-sm);
    font-weight: 700;
  }
}

/* ── NUMBER INPUT ── */
.num-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 320px;
}

.step-btn {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { background: var(--color-surface-hover); border-color: var(--color-primary); color: var(--color-primary); }
}

.num-input {
  flex: 1;
  height: 48px;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
  outline: none;

  &:focus { border-color: var(--color-primary); }
}

.unit-span {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

/* ── SOIL OPTIONS ── */
.soil-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-icon {
  color: var(--color-text-tertiary);
  cursor: pointer;
  &:hover { color: var(--color-primary); }
}

.soil-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.soil-btn {
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-secondary);
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { background: var(--color-surface-hover); color: var(--color-text-primary); }

  &.active {
    background: var(--color-primary-subtle, rgba(45,106,79,0.15));
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 700;
  }
}
</style>
