<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, Calculator, HelpCircle, FlaskConical, Droplet } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { CalculatorService, type CalculationInput, CalculatorResultCard, PhCalculatorService, type SoilTexture, type DeoxidizerType } from '@/modules/calculator'
import { supabase } from '@/api/supabase'
import { authStore } from '@/modules/auth/store/authStore'
import { onMounted } from 'vue'

const router = useRouter()

const activeTab = ref<'fertilizer' | 'ph'>('fertilizer')
const isPremium = ref(false)

onMounted(async () => {
  const user = authStore.user.value
  if (user) {
    const { data } = await supabase.from('user_settings').select('is_premium').eq('user_id', user.id).single()
    isPremium.value = !!data?.is_premium
  }
})

function handleTabSwitch(tab: 'fertilizer' | 'ph') {
  if (tab === 'ph' && !isPremium.value) {
    alert('Калькулятор раскисления (pH) доступен только по Premium-подписке. Оформите её в Профиле!')
    return
  }
  activeTab.value = tab
}

function handleFertilizerSelect(id: string) {
  if (!isPremium.value && id !== fertilizers[0].id) {
    alert('Выбор дополнительных удобрений доступен только по Premium-подписке. Оформите её в Профиле!')
    return
  }
  selectedFertilizerId.value = id
}

// --- Fertilizer State ---
const fertilizers = CalculatorService.getFertilizers()
const calcType = ref<'area' | 'bushes' | 'trees'>('area')
const amount = ref<number>(10)
const selectedFertilizerId = ref<string>(fertilizers[0].id)
const soilType = ref<'loam' | 'sandy' | 'clay'>('loam')

const activeFertilizer = computed(() => {
  return fertilizers.find(f => f.id === selectedFertilizerId.value) || fertilizers[0]
})

// --- pH State ---
const phArea = ref<number>(10)
const currentPh = ref<number>(5.5)
const targetPh = ref<number>(6.5)
const phSoilTexture = ref<SoilTexture>('loam')
const deoxidizerType = ref<DeoxidizerType>('dolomite')

const phResult = computed(() => {
  return PhCalculatorService.calculate({
    area: phArea.value,
    currentPh: currentPh.value,
    targetPh: targetPh.value,
    soilTexture: phSoilTexture.value,
    deoxidizerType: deoxidizerType.value
  })
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
      <h1 class="page-title">Агрокалькуляторы</h1>
      <p class="page-sub">Точный расчет подкормок, полива и нормализации кислотности почвы</p>
    </div>

    <div class="main-tabs">
      <button class="main-tab-btn" :class="{ active: activeTab === 'fertilizer' }" @click="handleTabSwitch('fertilizer')">
        <Droplet :size="18" /> Подкормка и полив
      </button>
      <button class="main-tab-btn" :class="{ active: activeTab === 'ph' }" @click="handleTabSwitch('ph')">
        <FlaskConical :size="18" /> Раскисление (pH) 👑
      </button>
    </div>

    <div class="calc-body" v-if="activeTab === 'fertilizer'">
      <!-- Настройки расчета подкормок -->
      <div class="calc-form-card">
        <div class="form-section">
          <label class="section-label">1. Выберите удобрение</label>
          <div class="fert-select-grid">
            <button
              v-for="(f, index) in fertilizers"
              :key="f.id"
              class="fert-select-btn"
              :class="{ active: selectedFertilizerId === f.id, 'premium-locked': !isPremium && index > 0 }"
              @click="handleFertilizerSelect(f.id)"
            >
              <div class="fert-btn-title">{{ f.name }} <span v-if="!isPremium && index > 0" class="premium-icon">👑</span></div>
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

    <div class="calc-body" v-if="activeTab === 'ph'">
      <div class="calc-form-card">
        <div class="form-section">
          <label class="section-label">1. Выберите средство-раскислитель</label>
          <div class="fert-select-grid">
            <button class="fert-select-btn" :class="{ active: deoxidizerType === 'dolomite' }" @click="deoxidizerType = 'dolomite'">
              <div class="fert-btn-title">Доломитовая мука</div>
              <div class="fert-btn-cat organic">Мягкое</div>
            </button>
            <button class="fert-select-btn" :class="{ active: deoxidizerType === 'ash' }" @click="deoxidizerType = 'ash'">
              <div class="fert-btn-title">Древесная зола</div>
              <div class="fert-btn-cat potassium">Народное</div>
            </button>
            <button class="fert-select-btn" :class="{ active: deoxidizerType === 'lime' }" @click="deoxidizerType = 'lime'">
              <div class="fert-btn-title">Гашеная известь</div>
              <div class="fert-btn-cat complex">Жесткое</div>
            </button>
          </div>
          <p class="fert-desc-hint" v-if="deoxidizerType === 'dolomite'">Доломитовая мука — самый безопасный вариант. Не обжигает корни и обогащает почву магнием.</p>
          <p class="fert-desc-hint" v-if="deoxidizerType === 'ash'">Древесная зола — отличное органическое удобрение, но для раскисления её требуется в 1.5-2 раза больше.</p>
          <p class="fert-desc-hint" v-if="deoxidizerType === 'lime'">Известь-пушонка действует агрессивно и быстро. Вносить только осенью под перекопку!</p>
        </div>

        <div class="form-section soil-section">
          <label class="section-label">2. Тип грунта</label>
          <div class="soil-options">
            <button class="soil-btn" :class="{ active: phSoilTexture === 'sandy' }" @click="phSoilTexture = 'sandy'">Песчаная (легкая)</button>
            <button class="soil-btn" :class="{ active: phSoilTexture === 'loam' }" @click="phSoilTexture = 'loam'">Суглинок (средняя)</button>
            <button class="soil-btn" :class="{ active: phSoilTexture === 'clay' }" @click="phSoilTexture = 'clay'">Глинистая (тяжелая)</button>
          </div>
        </div>

        <div class="form-section number-input-section">
          <label class="section-label">3. Площадь обработки (м²)</label>
          <div class="num-input-wrap">
            <button class="step-btn" @click="phArea = Math.max(1, phArea - 1)">-</button>
            <input type="number" v-model.number="phArea" min="1" class="num-input" />
            <button class="step-btn" @click="phArea++">+</button>
          </div>
        </div>

        <div class="ph-sliders">
          <div class="form-section">
            <div class="slider-header">
              <label class="section-label">4. Текущий уровень pH</label>
              <span class="ph-value">{{ currentPh.toFixed(1) }}</span>
            </div>
            <input type="range" v-model.number="currentPh" min="4.0" max="8.0" step="0.1" class="ph-range current" />
            <div class="ph-marks"><span>4.0 (Сильно кислая)</span><span>8.0 (Щелочная)</span></div>
          </div>

          <div class="form-section mt-16">
            <div class="slider-header">
              <label class="section-label">5. Целевой уровень pH</label>
              <span class="ph-value target">{{ targetPh.toFixed(1) }}</span>
            </div>
            <input type="range" v-model.number="targetPh" min="5.0" max="7.5" step="0.1" class="ph-range target" />
            <div class="ph-marks"><span>Обычно 6.5</span></div>
          </div>
        </div>
      </div>

      <div class="result-container">
        <div class="ph-result-card" :class="{ success: phResult.totalAmountKg > 0, info: phResult.totalAmountKg === 0 }">
          <div class="ph-result-header">
            <h3>Результат расчета</h3>
          </div>
          <div class="ph-result-body">
            <div v-if="phResult.totalAmountKg > 0" class="ph-big-number">
              {{ phResult.totalAmountKg }} <span>кг</span>
            </div>
            <p class="ph-result-msg">{{ phResult.message }}</p>
            <div v-if="phResult.totalAmountKg > 0" class="ph-per-meter">
              Это примерно <b>{{ phResult.amountPerSqMGrams }} г</b> на 1 м².
            </div>
          </div>
        </div>
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
.main-tabs {
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 4px;
  margin-bottom: 24px;
}

.main-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { color: var(--color-text-primary); }

  &.active {
    background: var(--color-primary);
    color: white;
    box-shadow: var(--shadow-sm);
  }
}

.calc-body {
  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.ph-sliders {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--color-background);
  padding: 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ph-value {
  font-size: 20px;
  font-weight: 800;
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  padding: 4px 12px;
  border-radius: 99px;

  &.target {
    color: #2ecc71;
    background: rgba(46, 204, 113, 0.1);
  }
}

.ph-range {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  background: var(--color-border);

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
  }

  &.current::-webkit-slider-thumb { background: #e74c3c; box-shadow: 0 0 10px rgba(231,76,60,0.5); }
  &.target::-webkit-slider-thumb { background: #2ecc71; box-shadow: 0 0 10px rgba(46,204,113,0.5); }
}

.ph-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.mt-16 { margin-top: 16px; }

.ph-result-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);

  &.success {
    border-color: var(--color-primary);
    .ph-result-header { background: var(--color-primary); color: white; }
    .ph-big-number { color: var(--color-primary); }
  }

  &.info {
    border-color: #3b82f6;
    .ph-result-header { background: #3b82f6; color: white; }
    .ph-big-number { color: #3b82f6; }
  }
}

.ph-result-header {
  padding: 16px 20px;
  h3 { margin: 0; font-size: 18px; font-weight: 700; }
}

.ph-result-body {
  padding: 24px 20px;
  text-align: center;
}

.ph-big-number {
  font-size: 48px;
  font-weight: 900;
  margin-bottom: 8px;
  line-height: 1;

  span { font-size: 24px; font-weight: 700; }
}

.ph-result-msg {
  font-size: 16px;
  color: var(--color-text-primary);
  line-height: 1.5;
  margin: 0 0 16px;
}

.ph-per-meter {
  font-size: 14px;
  color: var(--color-text-secondary);
  background: var(--color-background);
  padding: 8px;
  border-radius: var(--radius-md);
  display: inline-block;
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
