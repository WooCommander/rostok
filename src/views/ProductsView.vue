<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, X } from 'lucide-vue-next'
import { ProductService, type ProductItem, ProductCard } from '@/modules/products'

const router = useRouter()

const searchQuery = ref('')
const selectedCategory = ref('all')
const products = ref<ProductItem[]>([])
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

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div class="products-view">
    <div class="page-header">
      <h1 class="title">Справочник препаратов</h1>
      <p class="subtitle">Описание, составы, дозировки и сроки ожидания</p>
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
    <div class="cat-tabs-wrap">
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

    <div class="products-container">
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

.page-header {
  margin-bottom: 24px;
  text-align: center;

  .title {
    font-size: 28px;
    font-weight: 800;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }
  .subtitle {
    font-size: 15px;
    color: var(--color-text-secondary);
    margin: 0;
  }
}

/* ── SEARCH ── */
.search-wrap {
  margin-bottom: 20px;
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

/* ── CATEGORY TABS ── */
.cat-tabs-wrap {
  overflow-x: auto;
  margin-bottom: 28px;
  padding-bottom: 4px;
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
