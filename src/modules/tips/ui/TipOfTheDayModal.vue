<script setup lang="ts">
import { ref } from 'vue'
import { Bookmark, BookmarkCheck, Sparkles, Share2, RefreshCw, Check, X, CheckCircle2 } from 'lucide-vue-next'
import type { TipUiModel } from '../adapters/TipsAdapter'
import { useTipsState } from '../state/useTipsState'

interface Props {
  tip: TipUiModel
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'next'): void
}>()

const copied = ref(false)
const { isSaved, toggleSaveTip } = useTipsState()

async function shareTip() {
  const bulletsText = props.tip.bullets?.map(b => `• ${b}`).join('\n') || ''
  const shareText = `🌱 Совет дня от агронома Rostok:\n\n${props.tip.emoji} ${props.tip.title}\n\n${props.tip.content}\n${bulletsText}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.tip.title,
        text: shareText
      })
    } catch {}
  } else {
    try {
      await navigator.clipboard.writeText(shareText)
      copied.value = true
      setTimeout(() => { copied.value = false }, 2500)
    } catch {}
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="props.modelValue" class="modal-backdrop" @click.self="close">
      <div class="modal-container">
        <!-- Декоративная полоса сверху -->
        <div class="modal-glow-bar"></div>

        <!-- Кнопка закрытия в углу -->
        <button class="close-icon-btn" @click="close" title="Закрыть">
          <X :size="20" />
        </button>

        <!-- Шапка -->
        <div class="modal-header">
          <div class="header-badge">
            <Sparkles :size="14" class="sparkle-icon" />
            <span>{{ props.tip.categoryBadge }}</span>
          </div>
          <div class="header-right">
            <span class="header-author">{{ props.tip.author }}</span>
            <button
              class="bookmark-btn"
              :class="{ saved: isSaved(props.tip.id) }"
              @click="toggleSaveTip(props.tip.id)"
              :title="isSaved(props.tip.id) ? 'Убрать из сохранённых' : 'Сохранить совет'"
            >
              <BookmarkCheck v-if="isSaved(props.tip.id)" :size="20" />
              <Bookmark v-else :size="20" />
            </button>
          </div>
        </div>

        <!-- Контент -->
        <div class="modal-body">
          <div class="emoji-wrapper">
            <span class="big-emoji">{{ props.tip.emoji }}</span>
          </div>

          <h2 class="tip-title">{{ props.tip.title }}</h2>
          <p class="tip-content">{{ props.tip.content }}</p>

          <!-- Буллеты / детали -->
          <div v-if="props.tip.bullets && props.tip.bullets.length > 0" class="bullets-box">
            <div v-for="bullet in props.tip.bullets" :key="bullet" class="bullet-item">
              <CheckCircle2 :size="18" class="bullet-icon" />
              <span class="bullet-text">{{ bullet }}</span>
            </div>
          </div>
        </div>

        <!-- Действия -->
        <div class="modal-footer">
          <div class="secondary-actions">
            <button class="action-btn" title="Поделиться советом" @click="shareTip">
              <Share2 :size="18" />
              <span>Поделиться</span>
            </button>
            <button class="action-btn" title="Следующий совет" @click="emit('next')">
              <RefreshCw :size="18" />
              <span>Другой совет</span>
            </button>
          </div>

          <button class="primary-close-btn" @click="close">
            Понятно, спасибо!
          </button>
        </div>

        <!-- Уведомление о копировании -->
        <div v-if="copied" class="copied-toast">
          <Check :size="16" />
          <span>Скопировано в буфер</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.modal-backdrop {
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

.modal-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl, 24px);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
}

.modal-glow-bar {
  height: 6px;
  width: 100%;
  background: linear-gradient(90deg, var(--color-primary), #F4A261, #E76F51);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  flex-shrink: 0;
}

.close-icon-btn {
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

.modal-header {
  padding: 24px 24px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 60px; /* Чтобы не наезжать на крестик */
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(45, 106, 79, 0.15);
  color: var(--color-primary);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-author {
  font-size: 13px;
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.bookmark-btn {
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    color: var(--color-primary);
    transform: scale(1.1);
  }

  &.saved {
    color: var(--color-primary);
  }
}

.modal-body {
  padding: 12px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.emoji-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(45, 106, 79, 0.1), rgba(231, 111, 81, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border: 1px solid var(--color-border);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.big-emoji {
  font-size: 42px;
  user-select: none;
}

.tip-title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.tip-content {
  margin: 0 0 24px;
  font-size: 15px;
  line-height: 1.65;
  color: var(--color-text-secondary);
  max-width: 95%;
}

.bullets-box {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.bullet-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.bullet-icon {
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.bullet-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.modal-footer {
  padding: 20px 24px 24px;
  background: var(--color-surface-hover);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
}

.secondary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 12px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }
}

.primary-close-btn {
  width: 100%;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 16px;
  border-radius: var(--radius-lg);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 4px 12px rgba(45, 106, 79, 0.3);

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(45, 106, 79, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.copied-toast {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  animation: toastAnim 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes toastAnim {
  0% { opacity: 0; transform: translate(-50%, -10px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

/* Анимации модалки */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;

  .modal-container {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.92) translateY(20px);
  }
}
</style>
