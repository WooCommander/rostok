<script setup lang="ts">
import { ref } from 'vue'
import { Bookmark, BookmarkCheck, Sparkles, Share2, RefreshCw, Check, CheckCircle2 } from 'lucide-vue-next'
import type { TipUiModel } from '../adapters/TipsAdapter'
import { useTipsState } from '../state/useTipsState'
import { FpBottomSheetModal } from '@/shared/ui'
import FpButton from '@/design-system/components/FpButton.vue'

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
</script>

<template>
  <FpBottomSheetModal
    :model-value="props.modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
    with-glow
  >
    <template #header>
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
    </template>

    <div class="modal-body-content">
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

    <template #footer>
      <div class="secondary-actions">
        <FpButton variant="secondary" title="Поделиться советом" @click="shareTip">
          <Share2 :size="18" />
          <span>Поделиться</span>
        </FpButton>
        <FpButton variant="secondary" title="Следующий совет" @click="emit('next')">
          <RefreshCw :size="18" />
          <span>Другой совет</span>
        </FpButton>
      </div>

      <FpButton variant="primary" size="full" @click="emit('update:modelValue', false)">
        Понятно, спасибо!
      </FpButton>
    </template>

    <!-- Уведомление о копировании -->
    <div v-if="copied" class="copied-toast">
      <Check :size="16" />
      <span>Скопировано в буфер</span>
    </div>
  </FpBottomSheetModal>
</template>

<style scoped lang="scss">
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

.modal-body-content {
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

.secondary-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
</style>
