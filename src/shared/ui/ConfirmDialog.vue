<script setup lang="ts">
import { Trash2, HelpCircle } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Подтверждение действия',
  message: 'Вы уверены, что хотите выполнить это действие?',
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  isDanger: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function onConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

function onCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="props.modelValue" class="confirm-backdrop" @click="onCancel">
      <div class="confirm-modal" @click.stop>
        <div class="modal-head" :class="{ 'danger-head': props.isDanger }">
          <div class="head-icon">
            <Trash2 v-if="props.isDanger" :size="24" />
            <HelpCircle v-else :size="24" />
          </div>
          <h3 class="modal-title">{{ props.title }}</h3>
        </div>

        <div class="modal-body">
          <p class="modal-message">{{ props.message }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="onCancel">{{ props.cancelText }}</button>
          <button 
            class="btn-confirm" 
            :class="{ 'btn-danger': props.isDanger }" 
            @click="onConfirm"
          >
            {{ props.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.confirm-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.confirm-modal {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modal-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-head {
  padding: 24px 24px 16px;
  display: flex;
  align-items: center;
  gap: 16px;

  .head-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-primary-subtle, rgba(45,106,79,0.15));
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &.danger-head .head-icon {
    background: rgba(231,111,81,0.15);
    color: var(--color-error, #E76F51);
  }
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.modal-body {
  padding: 0 24px 24px;
}

.modal-message {
  margin: 0;
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.modal-footer {
  padding: 16px 24px;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

button {
  padding: 12px 20px;
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.btn-cancel {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);

  &:hover {
    background: var(--color-border);
  }
}

.btn-confirm {
  background: var(--color-primary);
  color: white;

  &:hover {
    opacity: 0.9;
  }
}

.btn-danger {
  background: var(--color-error, #E76F51);

  &:hover {
    background: color-mix(in srgb, var(--color-error, #E76F51) 85%, black);
  }
}

@keyframes modal-pop {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.2s;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>
