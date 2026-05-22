<script setup lang="ts">
import { ref } from 'vue'
import { Crown, Sparkles, X, CheckCircle2 } from 'lucide-vue-next'

interface Props {
  title?: string
  description?: string
  features?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Доступно только в Premium',
  description: 'Получите максимум возможностей с Premium-подпиской. Развивайте свой огород без ограничений!',
  features: () => [
    'Неограниченное количество грядок',
    'Все виды удобрений в агрокалькуляторе',
    'Расчет раскисления почвы (pH)',
    'Приоритетная поддержка'
  ]
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'subscribe'): void
}>()
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="paywall-modal">
      <button class="close-btn" @click="emit('close')">
        <X :size="24" />
      </button>

      <div class="modal-header">
        <div class="crown-icon-wrap">
          <Crown :size="40" class="crown-icon" />
          <Sparkles :size="20" class="sparkle top-left" />
          <Sparkles :size="16" class="sparkle bottom-right" />
        </div>
        <h2 class="modal-title">{{ props.title }}</h2>
        <p class="modal-desc">{{ props.description }}</p>
      </div>

      <div class="features-list">
        <div v-for="(feature, idx) in props.features" :key="idx" class="feature-item">
          <CheckCircle2 :size="18" class="check-icon" />
          <span>{{ feature }}</span>
        </div>
      </div>

      <div class="modal-actions">
        <button class="subscribe-btn" @click="emit('subscribe')">
          <Crown :size="18" />
          Оформить Premium
        </button>
        <button class="cancel-btn" @click="emit('close')">
          Не сейчас
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.paywall-modal {
  background: linear-gradient(145deg, var(--color-surface), #1a1f1c);
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.1);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
  padding: 32px 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    color: var(--color-text-primary);
    background: rgba(255, 255, 255, 0.1);
  }
}

.modal-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.crown-icon-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(218, 165, 32, 0.1));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 215, 0, 0.4);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.15) inset;
}

.crown-icon {
  color: #FFD700;
  filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
}

.sparkle {
  position: absolute;
  color: #FFD700;
  animation: pulse 2s infinite;

  &.top-left {
    top: -5px;
    left: -5px;
  }

  &.bottom-right {
    bottom: -5px;
    right: -5px;
    animation-delay: 1s;
  }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}

.modal-title {
  font-size: 24px;
  font-weight: 800;
  color: #FFD700;
  margin: 0 0 12px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.modal-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.4;

  .check-icon {
    color: #10B981;
    flex-shrink: 0;
  }
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.subscribe-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #FFD700, #DAA520);
  color: #000;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(218, 165, 32, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(218, 165, 32, 0.4);
    background: linear-gradient(135deg, #FFE44D, #E5B82D);
  }

  &:active {
    transform: translateY(0);
  }
}

.cancel-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary);
  }
}
</style>
