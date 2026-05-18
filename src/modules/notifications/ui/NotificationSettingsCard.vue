<script setup lang="ts">
import { Bell, BellOff, Check } from 'lucide-vue-next'
import { useNotificationState } from '../state/useNotificationState'

const { isSupported, isEnabled, loading, enableNotifications, disableNotifications, testNotification } = useNotificationState()
</script>

<template>
  <div class="notification-card">
    <div v-if="!isSupported" class="n-row unsupported">
      <div class="n-left">
        <div class="n-icon disabled"><BellOff :size="20" /></div>
        <div class="n-info">
          <h3>Push-уведомления</h3>
          <p>Не поддерживаются вашим браузером или устройством</p>
        </div>
      </div>
    </div>

    <div v-else class="n-content">
      <div class="n-header">
        <div class="n-left">
          <div class="n-icon" :class="{ active: isEnabled }"><Bell :size="20" /></div>
          <div class="n-info">
            <h3>Системные Push-уведомления</h3>
            <p>Напоминания об уходе и поливе даже при закрытом приложении</p>
          </div>
        </div>
        <div class="n-switch-box">
          <button
            class="toggle-btn"
            :class="{ active: isEnabled, loading }"
            :disabled="loading"
            @click="isEnabled ? disableNotifications() : enableNotifications()"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>{{ isEnabled ? 'Включены' : 'Включить' }}</span>
          </button>
        </div>
      </div>

      <div v-if="isEnabled" class="n-actions">
        <button class="test-btn" @click="testNotification">
          <Check :size="14" /> Проверить уведомление
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notification-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  transition: border-color 0.15s;

  &:hover { border-color: var(--color-primary); }
}

.n-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.n-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.n-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.active {
    background: rgba(45, 106, 79, 0.15);
    color: var(--color-primary);
  }

  &.disabled {
    color: var(--color-text-disabled);
  }
}

.n-info {
  display: flex;
  flex-direction: column;
  gap: 2px;

  h3 { margin: 0; font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
  p { margin: 0; font-size: 13px; color: var(--color-text-secondary); line-height: 1.3; }
}

.toggle-btn {
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-primary);
  background: transparent;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;

  &.active {
    background: var(--color-primary);
    color: white;
  }

  &:hover:not(.active) {
    background: rgba(45, 106, 79, 0.1);
  }
}

.n-actions {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.test-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}
</style>
