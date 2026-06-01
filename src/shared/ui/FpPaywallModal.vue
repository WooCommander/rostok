<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, ShieldCheck, Map, Users, Loader2, RotateCcw } from 'lucide-vue-next'
import FpBottomSheetModal from './FpBottomSheetModal.vue'
import FpPremiumBadge from './FpPremiumBadge.vue'
import { BillingService } from '@/modules/billing/services/BillingService'

interface Props {
  modelValue: boolean
  featureName?: string
}

const props = withDefaults(defineProps<Props>(), {
  featureName: 'Эта функция'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'purchased'): void
}>()

const loading = ref(false)
const restoring = ref(false)
const errorMsg = ref('')

function onClose() {
  errorMsg.value = ''
  emit('update:modelValue', false)
}

async function onUpgrade() {
  loading.value = true
  errorMsg.value = ''
  try {
    const result = await BillingService.purchase()
    if (result.success) {
      emit('purchased')
      onClose()
    } else if (!result.cancelled) {
      errorMsg.value = result.error || 'Не удалось оформить подписку'
    }
  } finally {
    loading.value = false
  }
}

async function onRestore() {
  restoring.value = true
  errorMsg.value = ''
  try {
    const result = await BillingService.restore()
    if (result.success) {
      emit('purchased')
      onClose()
    } else {
      errorMsg.value = result.error || 'Активных подписок не найдено'
    }
  } finally {
    restoring.value = false
  }
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
          <span>Безлимитные растения и напоминания</span>
        </div>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <button class="upgrade-btn" @click="onUpgrade" :disabled="loading || restoring">
        <Loader2 v-if="loading" :size="18" class="spin" />
        <span v-else>Оформить Premium — {{ BillingService.getPriceLabel() }}</span>
      </button>

      <button v-if="BillingService.isNative()" class="restore-btn" @click="onRestore" :disabled="loading || restoring">
        <Loader2 v-if="restoring" :size="14" class="spin" />
        <RotateCcw v-else :size="14" />
        Восстановить покупку
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:disabled { opacity: 0.7; cursor: not-allowed; }
  &:not(:disabled):active {
    transform: scale(0.98);
    box-shadow: 0 2px 6px rgba(251, 133, 0, 0.2);
  }
}

.restore-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
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

.error-msg {
  width: 100%;
  padding: 10px 14px;
  background: rgba(231, 111, 81, 0.1);
  border: 1px solid rgba(231, 111, 81, 0.3);
  border-radius: var(--radius-md);
  color: #E76F51;
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
