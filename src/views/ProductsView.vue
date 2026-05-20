<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { ProductService, type ProductItem, ProductCard } from '@/modules/products'
import { TankMixerWidget } from '@/modules/tank-mixer'

const router = useRouter()

const searchQuery = ref('')
const selectedCategory = ref('all')
const products = ref<ProductItem[]>([])
const allProducts = ref<ProductItem[]>([])
const loading = ref(true)

const CATEGORIES = [
  { id: 'all', label: 'Все', icon: '💊' },
  { id: 'fungicide', label: 'Фунгицид', icon: '🛡️' },
  { id: 'insecticide', label: 'Инсектицид', icon: '🐛' },
  { id: 'fertilizer', label: 'Удобрение', icon: '🌿' },
  { id: 'bio', label: 'Био', icon: '🦠' }
]

async function loadProducts() {
  loading.value = true
  try {
    products.value = await ProductService.searchProducts(searchQuery.value, selectedCategory.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function selectCat(catId: string) {
  selectedCategory.value = catId
  loadProducts()
}

function onSearchInput(e: Event) {
  searchQuery.value = (e.target as HTMLInputElement).value
  loadProducts()
}

function clearSearch() {
  searchQuery.value = ''
  loadProducts()
}

function goToProduct(p: ProductItem) {
  router.push(`/products/${p.id}`)
}

const isScrolled = ref(false)
function onWindowScroll() {
  isScrolled.value = window.scrollY > 20
}

const catTabsRef = ref<HTMLElement | null>(null)
const showCatLeft = ref(false)
const showCatRight = ref(false)

function checkCatScroll() {
  const el = catTabsRef.value
  if (!el) return
  showCatLeft.value = el.scrollLeft > 10
  showCatRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10
}

function scrollCatsBy(amount: number) {
  const el = catTabsRef.value
  if (!el) return
  el.scrollBy({ left: amount, behavior: 'smooth' })
}

onMounted(async () => {
  allProducts.value = await ProductService.searchProducts('', 'all')
  loadProducts()
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  setTimeout(checkCatScroll, 100)
  window.addEventListener('resize', checkCatScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
  window.removeEventListener('resize', checkCatScroll)
})
</script>

<template>
  <div class="products-view">
    <div class="sticky-header-container" :class="{ 'is-scrolled': isScrolled }">
      <div class="page-header">
        <h1 class="header-title">Справочник препаратов</h1>
        <p class="header-sub">Описание, составы, дозировки и сроки ожидания</p>
      </div>

      <div class="search-wrap">
        <div class="search-box">
          <Search class="search-icon" :size="20" />
          <input
            :value="searchQuery"
            @input="onSearchInput"
            placeholder="Поиск по названию или составу..."
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
            <X :size="18" />
          </button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="scroll-container-wrapper" @mouseenter="checkCatScroll">
        <button v-show="showCatLeft" class="scroll-arrow left" @click="scrollCatsBy(-200)" title="Прокрутить влево">
          <ChevronLeft :size="18" />
        </button>

        <div class="cat-tabs-wrap" ref="catTabsRef" @scroll="checkCatScroll">
          <div class="cat-tabs">
            <button
              v-for="cat in CATEGORIES"
              :key="cat.id"
              class="cat-tab"
              :class="{ active: selectedCategory === cat.id }"
              @click="selectCat(cat.id)"
            >
              <span class="cat-icon">{{ cat.icon }}</span>
              <span class="cat-label">{{ cat.label }}</span>
            </button>
          </div>
        </div>

        <button v-show="showCatRight" class="scroll-arrow right" @click="scrollCatsBy(200)" title="Прокрутить вправо">
          <ChevronRight :size="18" />
        </button>
      </div>
    </div>

    <div class="products-container">
      <TankMixerWidget v-if="allProducts.length > 0" :products="allProducts" />

      <div v-if="loading" class="grid-list">
        <div v-for="i in 6" :key="i" class="skel-card">
          <div class="skel skel-top"></div>
          <div class="skel skel-mid"></div>
          <div class="skel skel-bot"></div>
        </div>
      </div>

      <div v-else-if="products.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Ничего не найдено</h3>
        <p>По вашему запросу не нашлось препаратов. Попробуйте изменить фильтр или поисковую фразу.</p>
        <button v-if="searchQuery || selectedCategory !== 'all'" class="reset-btn" @click="selectedCategory = 'all'; clearSearch()">
          Сбросить фильтры
        </button>
      </div>

      <div v-else class="grid-list">
        <ProductCard
          v-for="item in products"
          :key="item.id"
          :product="item"
          @click="goToProduct"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.products-view {
  padding: 24px 16px 48px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ── STICKY HEADER ── */
.sticky-header-container {
  position: sticky;
  top: 56px;
  z-index: 20;
  background: var(--color-background);
  padding: 16px 16px 12px;
  margin: -16px -16px 24px;
  transition: box-shadow 0.3s, background 0.3s, backdrop-filter 0.3s;

  &.is-scrolled {
    background: rgba(18, 26, 22, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.page-header {
  margin-bottom: 16px;
  text-align: left;

  .header-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 4px;
  }
  .header-sub {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

/* ── SEARCH ── */
.search-wrap {
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 4px 16px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-subtle, rgba(45,106,79,0.2));
  }
}

.search-icon {
  color: var(--color-text-tertiary);
  margin-right: 12px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: 16px;
  color: var(--color-text-primary);
  outline: none;

  &::placeholder {
    color: var(--color-text-tertiary);
  }
}

.clear-btn {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  padding: 6px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--color-text-primary);
    background: var(--color-surface-hover);
  }
}

/* ── HORIZONTAL CATEGORIES SCROLL ── */
.scroll-container-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.scroll-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.15s;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  &.left { left: -4px; }
  &.right { right: -4px; }
}

.cat-tabs-wrap {
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 4px 0;
  width: 100%;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.cat-tabs {
  display: flex;
  gap: 10px;
  min-width: max-content;
}

.cat-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--color-primary-subtle, rgba(45,106,79,0.4));
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  &.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
}

/* ── GRID LIST ── */
.products-container {
  min-height: 300px;
}

.grid-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ── EMPTY STATE ── */
.empty-state {
  padding: 48px 24px;
  text-align: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  max-width: 500px;
  margin: 0 auto;

  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  h3 { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: var(--color-text-primary); }
  p { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 24px; line-height: 1.5; }
}

.reset-btn {
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.9; }
}

/* ── SKELETONS ── */
.skel-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skel {
  background: linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.08) 75%);
  background-size: 200% 100%;
  animation: skel-anim 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skel-top { height: 44px; width: 60%; }
.skel-mid { height: 20px; width: 90%; }
.skel-bot { height: 60px; width: 100%; }

@keyframes skel-anim {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
