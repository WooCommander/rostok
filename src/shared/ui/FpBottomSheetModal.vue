<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useSwipeToDismiss } from '@/shared/lib'

interface Props {
  modelValue: boolean
  withGlow?: boolean
  showCloseButton?: boolean
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  withGlow: false,
  showCloseButton: true,
  maxWidth: '520px'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const modalContainer = ref<HTMLElement | null>(null)

useSwipeToDismiss(modalContainer, {
  onDismiss: () => {
    emit('update:modelValue', false)
    emit('close')
  }
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fp-modal-fade">
      <div v-if="props.modelValue" class="fp-modal-backdrop" @click.self="close">
        <div ref="modalContainer" class="fp-modal-container" :style="{ maxWidth: props.maxWidth }">
          
          <!-- Декоративная полоса сверху -->
          <div v-if="props.withGlow" class="fp-modal-glow-bar"></div>

          <!-- Кнопка закрытия в углу -->
          <button v-if="props.showCloseButton" class="fp-close-icon-btn" @click="close" title="Закрыть">
            <X :size="20" />
          </button>

          <!-- Шапка -->
          <div v-if="$slots.header" class="fp-modal-header" :class="{ 'with-glow': props.withGlow }">
            <slot name="header"></slot>
          </div>

          <!-- Контент -->
          <div class="fp-modal-body">
            <slot></slot>
          </div>

          <!-- Подвал -->
          <div v-if="$slots.footer" class="fp-modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.fp-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.fp-modal-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl, 24px);
  width: 100%;
  max-height: 85vh;
  max-height: 85dvh;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
}

.fp-modal-glow-bar {
  height: 6px;
  width: 100%;
  background: linear-gradient(90deg, var(--color-primary), #F4A261, #E76F51);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  flex-shrink: 0;
}

.fp-close-icon-btn {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  z-index: 10;

  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: rotate(90deg);
  }
}

.fp-modal-header {
  padding: 24px 24px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 60px; /* Чтобы не наезжать на крестик */
  flex-shrink: 0;

  &.with-glow {
    /* Если есть декоративная полоса, возможно понадобится меньше отступа сверху */
    padding-top: 18px;
  }
}

.fp-modal-body {
  padding: 12px 24px 24px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
}

.fp-modal-footer {
  padding: 20px 24px 24px;
  background: var(--color-surface-hover);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  flex-shrink: 0;
}

/* Анимации модалки */
.fp-modal-fade-enter-active,
.fp-modal-fade-leave-active {
  transition: opacity 0.3s ease;

  .fp-modal-container {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.fp-modal-fade-enter-from,
.fp-modal-fade-leave-to {
  opacity: 0;

  .fp-modal-container {
    transform: scale(0.92) translateY(20px);
  }
}
</style>
