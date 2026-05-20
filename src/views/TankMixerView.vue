<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { TankMixerWidget } from '@/modules/tank-mixer'
import { ProductService, type ProductItem } from '@/modules/products'

const allProducts = ref<ProductItem[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    allProducts.value = await ProductService.searchProducts('', 'all')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="tank-mixer-view">
    <div class="page-header">
      <h1 class="header-title">Баковые смеси</h1>
      <p class="header-sub">Проверьте совместимость препаратов перед опрыскиванием</p>
    </div>

    <div v-if="loading" class="loading-state">
      Загрузка базы препаратов...
    </div>
    
    <TankMixerWidget v-else-if="allProducts.length > 0" :products="allProducts" />
  </div>
</template>

<style scoped lang="scss">
.tank-mixer-view {
  padding: 24px 16px 48px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;

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

.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-tertiary);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
}
</style>
