<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Clock, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, Layers } from 'lucide-vue-next'
import { ProductService, type ProductItem } from '@/modules/products'

const route = useRoute()
const router = useRouter()

const product = ref<ProductItem | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const CATEGORY_INFO: Record<string, { label: string; color: string; bg: string }> = {
  fungicide: { label: 'Фунгицид', color: '#2D6A4F', bg: 'rgba(45,106,79,0.15)' },
  insecticide: { label: 'Инсектицид', color: '#E76F51', bg: 'rgba(231,111,81,0.15)' },
  fertilizer: { label: 'Удобрение', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  bio: { label: 'Биопрепарат', color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
}

async function loadProduct() {
  loading.value = true
  error.value = null
  const idOrName = route.params.id as string
  try {
    const data = await ProductService.getProductByIdOrName(idOrName)
    if (data) {
      product.value = data
    } else {
      error.value = 'Препарат не найден в справочнике'
    }
  } catch (e: any) {
    error.value = e.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
}

function goToAnalogue(name: string) {
  router.push(`/products/${encodeURIComponent(name.toLowerCase())}`)
}

onMounted(() => {
  loadProduct()
})
</script>

<template>
  <div class="product-detail">

    <template v-if="loading">
      <div class="detail-header skeleton-header">
        <button class="back-btn" @click="router.back()"><ArrowLeft :size="20" /></button>
        <div class="skel skel-circle"></div>
        <div class="skel-col">
          <div class="skel skel-title"></div>
          <div class="skel skel-sub"></div>
        </div>
      </div>
      <div class="detail-body">
        <div class="skel skel-box mb-8"></div>
        <div class="skel skel-box mb-8"></div>
      </div>
    </template>

    <template v-else-if="error || !product">
      <div class="detail-header error-header">
        <button class="back-btn" @click="router.back()"><ArrowLeft :size="20" /></button>
        <h2>{{ error || 'Препарат не найден' }}</h2>
      </div>
      <div class="detail-body empty-state">
        <p>Мы не смогли найти информацию о данном препарате. Вы можете вернуться в полный справочник и воспользоваться поиском.</p>
        <button class="action-btn" @click="router.push('/products')">Перейти в справочник</button>
      </div>
    </template>

    <template v-else>
      <div class="sticky-top-container">
        <div class="detail-header">
          <button class="back-btn" @click="router.back()"><ArrowLeft :size="20" /></button>
          <div class="header-icon">{{ product.icon }}</div>
          <div class="header-info">
            <h1 class="product-name">{{ product.name }}</h1>
            <span 
              class="cat-badge"
              :style="{ 
                backgroundColor: CATEGORY_INFO[product.category]?.bg, 
                color: CATEGORY_INFO[product.category]?.color 
              }"
            >
              {{ CATEGORY_INFO[product.category]?.label || product.category }}
            </span>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <!-- Мета-карточка (Класс опасности + Срок ожидания) -->
        <div class="meta-card">
          <div v-if="product.waiting_period_days !== null" class="meta-item wait-time">
            <Clock class="meta-icon" :size="20" />
            <div class="meta-text-col">
              <span class="meta-label">Срок ожидания до сбора урожая:</span>
              <span class="meta-val">{{ product.waiting_period_days === 0 ? 'Без ограничений (0 дней)' : product.waiting_period_days + ' дней' }}</span>
            </div>
          </div>

          <div class="meta-item hazard">
            <ShieldAlert class="meta-icon" :size="20" />
            <div class="meta-text-col">
              <span class="meta-label">Класс опасности:</span>
              <span class="meta-val">{{ product.hazard_class }}</span>
            </div>
          </div>
        </div>

        <!-- Действующее вещество -->
        <div class="section-card active-ing-card">
          <div class="card-head">
            <Layers class="card-head-icon" :size="18" />
            <h3>Действующее вещество и химсостав</h3>
          </div>
          <p class="ing-text">{{ product.active_ingredient }}</p>
        </div>

        <!-- Назначение и описание -->
        <div class="section-card desc-card">
          <div class="card-head">
            <CheckCircle2 class="card-head-icon" :size="18" />
            <h3>Назначение и принцип действия</h3>
          </div>
          <p class="desc-text">{{ product.description }}</p>
        </div>

        <!-- Дозировки -->
        <div class="section-card dosage-card">
          <div class="card-head">
            <AlertTriangle class="card-head-icon warning-icon" :size="18" />
            <h3>Рекомендованные дозировки и регламент</h3>
          </div>
          <div class="dosage-box">
            <p>{{ product.dosages }}</p>
          </div>
        </div>

        <!-- Аналоги -->
        <div v-if="product.analogues && product.analogues.length" class="section-card analogues-card">
          <div class="card-head">
            <Sparkles class="card-head-icon" :size="18" />
            <h3>Популярные аналоги и заменители</h3>
          </div>
          <p class="analogues-hint">Нажмите на препарат-аналог для перехода к его карточке (если он есть в базе):</p>
          <div class="analogues-tags">
            <button
              v-for="an in product.analogues"
              :key="an"
              class="analogue-tag"
              @click="goToAnalogue(an)"
            >
              {{ an }}
            </button>
          </div>
        </div>

        <div class="catalog-link-area">
          <button class="secondary-btn" @click="router.push('/products')">
            Смотреть все препараты в справочнике
          </button>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped lang="scss">
.product-detail {
  min-height: 100vh;
  background: var(--color-background);
  padding-bottom: 48px;
}

/* ── STICKY HEADER ── */
.sticky-top-container {
  position: sticky;
  top: calc(56px + env(safe-area-inset-top, 0px));
  z-index: 100;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.detail-header {
  background: var(--color-primary);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;

  &.error-header { background: var(--color-error, #E76F51); color: white; }
  h2 { margin: 0; font-size: 20px; font-weight: 700; }
}

.back-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 10px;
  color: white;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.3); }
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.product-name {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: white;
}

.cat-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  background: white;
}

/* ── BODY & CARDS ── */
.detail-body {
  padding: 24px 16px;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.meta-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-sm);

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: space-between;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 14px;

  &.wait-time .meta-icon { color: var(--color-primary); }
  &.hazard .meta-icon { color: var(--color-error, #E76F51); }
}

.meta-icon {
  flex-shrink: 0;
  background: var(--color-surface-hover);
  padding: 10px;
  border-radius: 12px;
  width: 42px;
  height: 42px;
}

.meta-text-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label { font-size: 12px; color: var(--color-text-secondary); font-weight: 600; }
.meta-val { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }

/* ── SECTION CARDS ── */
.section-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);

  &.active-ing-card { border-left: 4px solid var(--color-primary); }
  &.dosage-card { border-left: 4px solid var(--color-warn, #F4A261); }
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  h3 { margin: 0; font-size: 17px; font-weight: 700; color: var(--color-text-primary); }
  .card-head-icon { color: var(--color-primary); }
  .warning-icon { color: var(--color-warn, #F4A261); }
}

.ing-text {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.desc-text {
  margin: 0;
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.dosage-box {
  background: var(--color-background);
  border-radius: var(--radius-md);
  padding: 16px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-primary);
  p { margin: 0; white-space: pre-line; }
}

.analogues-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 14px;
}

.analogues-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.analogue-tag {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }
}

.catalog-link-area {
  margin-top: 16px;
  text-align: center;
}

.secondary-btn {
  width: 100%;
  padding: 14px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: var(--color-surface-hover); }
}

/* ── SKELETONS & EMPTY ── */
.skeleton-header { background: var(--color-primary); height: 80px; }
.skel-box { height: 160px; background: var(--color-surface); border-radius: var(--radius-lg); }
.empty-state { text-align: center; padding: 48px 20px; }
.action-btn { background: var(--color-primary); color: white; border: none; padding: 12px 24px; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }
</style>
