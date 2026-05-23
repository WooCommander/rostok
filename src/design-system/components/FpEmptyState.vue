<script setup lang="ts">
import FpButton from './FpButton.vue'
import { Leaf } from 'lucide-vue-next'

interface Props {
  icon?: any
  title: string
  description?: string
  actionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  actionLabel: '',
})

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="fp-empty-state">
    <div class="empty-icon-wrapper">
      <component :is="props.icon || Leaf" :size="48" class="empty-icon" />
    </div>
    <h3 class="empty-title">{{ props.title }}</h3>
    <p v-if="props.description" class="empty-description">{{ props.description }}</p>
    <FpButton v-if="props.actionLabel" variant="primary" @click="emit('action')" class="empty-action">
      {{ props.actionLabel }}
    </FpButton>
  </div>
</template>

<style scoped lang="scss">
.fp-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-xl);
}

.empty-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(45, 106, 79, 0.08);
  border-radius: 50%;
  margin-bottom: 24px;
  color: var(--color-primary);

  body.dark-theme & {
    background: rgba(45, 106, 79, 0.2);
  }
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.empty-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  max-width: 320px;
  margin: 0 0 24px;
}

.empty-action {
  min-width: 200px;
}
</style>
