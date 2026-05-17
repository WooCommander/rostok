<script setup lang="ts">
import { Bell, CheckCircle2, X } from 'lucide-vue-next'
import type { ReminderUiModel } from '../adapters/RemindersAdapter'

interface Props {
  reminder: ReminderUiModel
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'complete', id: string, raw: ReminderUiModel['raw']): void
  (e: 'dismiss', id: string): void
}>()
</script>

<template>
  <div class="reminder-card" :class="props.reminder.careType">
    <div class="card-left">
      <div class="icon-wrap">
        <Bell class="bell-icon" :size="20" />
      </div>
      <div class="card-content">
        <div class="card-head">
          <span class="emoji">{{ props.reminder.emoji }}</span>
          <h4 class="title">{{ props.reminder.title }}</h4>
        </div>
        <p class="product">{{ props.reminder.productAndDose }}</p>
        <span class="date">{{ props.reminder.remindAtDisplay }}</span>
      </div>
    </div>
    
    <div class="actions">
      <button class="action-btn complete-btn" title="Выполнить и записать в журнал" @click="emit('complete', props.reminder.id, props.reminder.raw)">
        <CheckCircle2 :size="20" />
        <span>Выполнить</span>
      </button>
      <button class="action-btn dismiss-btn" title="Пропустить" @click="emit('dismiss', props.reminder.id)">
        <X :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reminder-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: var(--shadow-md);
  margin-bottom: 12px;

  &.fertilizing { border-left-color: var(--color-soil); .icon-wrap { background: var(--color-soil-light); color: var(--color-soil); } }
  &.spraying { border-left-color: #E76F51; .icon-wrap { background: #FFECE8; color: #E76F51; } }
  &.watering { border-left-color: #3b82f6; .icon-wrap { background: #E8F4FD; color: #3b82f6; } }
}

.card-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-primary-subtle, rgba(45,106,79,0.15));
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.emoji { font-size: 16px; }

.title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.date {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;

  &.complete-btn {
    background: var(--color-primary);
    color: white;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;

    &:hover { background: color-mix(in srgb, var(--color-primary) 85%, black); transform: translateY(-1px); }
  }

  &.dismiss-btn {
    background: var(--color-surface-hover);
    color: var(--color-text-disabled);
    padding: 8px;

    &:hover { color: var(--color-error, #E76F51); background: rgba(231,111,81,0.15); }
  }
}
</style>
