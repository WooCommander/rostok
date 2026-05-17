<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, RefreshCw, Share2, Check } from 'lucide-vue-next'
import type { TipUiModel } from '../adapters/TipsAdapter'

interface Props {
  tip: TipUiModel
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'next'): void
}>()

const copied = ref(false)

async function shareTip() {
  const shareText = `Совет дня от агронома Rostok: ${props.tip.title}. ${props.tip.content}`
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
  <div class="tip-card">
    <div class="card-header">
      <div class="header-left">
        <div class="icon-wrap">
          <Sparkles class="sparkle-icon" :size="20" />
        </div>
        <div class="header-info">
          <span class="badge" :class="props.tip.categoryBadge">{{ props.tip.categoryBadge }}</span>
          <span class="author">{{ props.tip.author }}</span>
        </div>
      </div>
      <div class="actions">
        <button class="icon-btn" title="Поделиться советом" @click="shareTip">
          <Share2 :size="16" />
        </button>
        <button class="icon-btn" title="Следующий совет" @click="emit('next')">
          <RefreshCw :size="16" />
        </button>
      </div>
    </div>

    <div class="card-body">
      <h3 class="tip-title">
        <span class="emoji">{{ props.tip.emoji }}</span>
        {{ props.tip.title }}
      </h3>
      <p class="tip-content">{{ props.tip.content }}</p>
    </div>

    <div v-if="copied" class="copied-toast">
      <Check :size="16" />
      <span>Скопировано в буфер</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.copied-toast {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--color-primary);
  color: white;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: var(--shadow-md);
  z-index: 10;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.tip-card {
  background: linear-gradient(145deg, var(--color-surface), color-mix(in srgb, var(--color-surface) 95%, var(--color-primary)));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, var(--color-primary), #F4A261, #E76F51);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--color-primary-subtle, rgba(45,106,79,0.15));
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.badge {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary);
}

.author {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji {
  font-size: 22px;
}

.tip-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-text-secondary);
}
</style>
