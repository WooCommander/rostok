<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, CheckCircle2, ShieldCheck, Map, Users } from 'lucide-vue-next'
import FpBottomSheetModal from './FpBottomSheetModal.vue'
import FpPremiumBadge from './FpPremiumBadge.vue'

interface Props {
  modelValue: boolean
  featureName?: string
}

const props = withDefaults(defineProps<Props>(), {
  featureName: 'Эта функция'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function onClose() {
  emit('update:modelValue', false)
}

function onUpgrade() {
  // В будущем тут будет логика покупки
  alert('Переход на страницу оплаты (демо)')
  onClose()
}
</script>

<template>
  <FpBottomSheetModal
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :with-glow="true"
  >
    <div class="paywall-content">
      <div class="paywall-icon-wrapper">
        <Sparkles :size="32" class="paywall-icon" />
      </div>
      
      <h2 class="paywall-title">
        {{ props.featureName }} доступна в версии <FpPremiumBadge />
      </h2>
      
      <p class="paywall-desc">
        Оформите подписку Premium, чтобы разблокировать эту и многие другие полезные функции для вашего умного огорода.
      </p>
      
      <div class="premium-features">
        <div class="feature-item">
          <ShieldCheck :size="20" class="feature-icon" />
          <span>Приватный профиль в Сообществе</span>
        </div>
        <div class="feature-item">
          <Map :size="20" class="feature-icon" />
          <span>Умная карта соседних грядок (скоро)</span>
        </div>
        <div class="feature-item">
          <Users :size="20" class="feature-icon" />
          <span>Безлимитные советы и комментарии</span>
        </div>
      </div>
      
      <button class="upgrade-btn" @click="onUpgrade">
        Перейти на Premium за 199 ₽/мес
      </button>
      
      <button class="cancel-btn" @click="onClose">
        Не сейчас
      </button>
    </div>
  </FpBottomSheetModal>
</template>

<style scoped lang="scss">
.paywall-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 0;
}

.paywall-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 183, 3, 0.15), rgba(251, 133, 0, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.paywall-icon {
  color: #FB8500;
}

.paywall-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 12px;
  line-height: 1.3;
}

.paywall-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 24px;
}

.premium-features {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  background: var(--color-surface-hover);
  padding: 16px;
  border-radius: var(--radius-lg);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.feature-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.upgrade-btn {
  width: 100%;
  padding: 16px;
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, #FFB703, #FB8500);
  color: white;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(251, 133, 0, 0.3);
  transition: transform 0.15s, box-shadow 0.15s;
  margin-bottom: 12px;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 6px rgba(251, 133, 0, 0.2);
  }
}

.cancel-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    color: var(--color-text-primary);
  }
}
</style>
