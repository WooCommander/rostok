<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, X } from 'lucide-vue-next'

const emit = defineEmits<{ (e: 'done'): void }>()
const router = useRouter()

const current = ref(0)

const slides = [
  {
    emoji: '🌱',
    title: 'Добро пожаловать\nв Rostok',
    desc: 'Ваш умный помощник огородника. Ведите учёт, получайте советы и следите за погодой.',
    bg: 'var(--color-primary)'
  },
  {
    emoji: '🥦',
    title: 'Добавьте свои\nрастения',
    desc: 'Выберите культуры из каталога 50+ растений — томаты, огурцы, яблони, виноград и многое другое.',
    bg: '#2D6A4F'
  },
  {
    emoji: '📓',
    title: 'Ведите журнал\nухода',
    desc: 'Фиксируйте поливы, подкормки и обработки. Напоминания подскажут, когда повторить.',
    bg: '#1D3557'
  },
  {
    emoji: '🌤️',
    title: 'Умные советы\nпо погоде',
    desc: 'Приложение учитывает реальную температуру и предупреждает о риске болезней.',
    bg: '#457B9D'
  }
]

const isLast = computed(() => current.value === slides.length - 1)

// Свайп
const touchStartX = ref(0)

function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX.value
  if (Math.abs(dx) < 40) return
  if (dx < 0 && current.value < slides.length - 1) current.value++
  if (dx > 0 && current.value > 0) current.value--
}

function next() {
  if (isLast.value) finish()
  else current.value++
}

function skip() {
  finish()
}

function finish() {
  localStorage.setItem('rostok_onboarding_v1', '1')
  emit('done')
}

function goToPlants() {
  finish()
  router.push('/plants')
}
</script>

<template>
  <Teleport to="body">
    <div class="onboarding-overlay">
      <div
        class="onboarding-screen"
        :style="{ '--slide-bg': slides[current].bg }"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <!-- Skip -->
        <button v-if="!isLast" class="skip-btn" @click="skip">
          <X :size="18" />
          Пропустить
        </button>

        <!-- Slides -->
        <div class="slides-wrap">
          <TransitionGroup name="slide-fade" tag="div" class="slides-inner">
            <div v-for="(slide, i) in slides" :key="i" v-show="current === i" class="slide">
              <div class="slide-emoji">{{ slide.emoji }}</div>
              <h1 class="slide-title">{{ slide.title }}</h1>
              <p class="slide-desc">{{ slide.desc }}</p>
            </div>
          </TransitionGroup>
        </div>

        <!-- Dots -->
        <div class="dots">
          <button
            v-for="(_, i) in slides"
            :key="i"
            class="dot"
            :class="{ active: i === current }"
            @click="current = i"
          />
        </div>

        <!-- Actions -->
        <div class="actions">
          <button v-if="isLast" class="btn-main" @click="goToPlants">
            Добавить первое растение
            <ChevronRight :size="20" />
          </button>
          <button v-if="isLast" class="btn-ghost" @click="finish">
            Перейти на главную
          </button>
          <button v-else class="btn-main" @click="next">
            Далее
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--slide-bg, var(--color-primary));
}

.onboarding-screen {
  width: 100%;
  height: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--slide-bg, var(--color-primary));
  transition: background 0.4s ease;
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 24px calc(env(safe-area-inset-bottom, 0px) + 24px);
  color: white;
}

.skip-btn {
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.15);
  border: none;
  color: rgba(255,255,255,0.85);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s;

  &:hover { background: rgba(255,255,255,0.25); }
}

.slides-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.slides-inner {
  width: 100%;
  position: relative;
}

.slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
  padding: 0 8px;
}

.slide-emoji {
  font-size: 96px;
  line-height: 1;
  filter: drop-shadow(0 8px 24px rgba(0,0,0,0.2));
  animation: float 3s ease-in-out infinite;
}

.slide-title {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
  white-space: pre-line;
  text-shadow: 0 2px 8px rgba(0,0,0,0.15);
  margin: 0;
}

.slide-desc {
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255,255,255,0.85);
  max-width: 320px;
  margin: 0;
}

.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.35);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.25s ease;

  &.active {
    width: 24px;
    background: white;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-main {
  width: 100%;
  padding: 16px;
  border-radius: var(--radius-lg, 14px);
  border: none;
  background: white;
  color: var(--slide-bg, #2D6A4F);
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: transform 0.15s, box-shadow 0.15s;

  &:active {
    transform: scale(0.97);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
}

.btn-ghost {
  width: 100%;
  padding: 13px;
  border-radius: var(--radius-lg, 14px);
  border: 2px solid rgba(255,255,255,0.3);
  background: transparent;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.5); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
  position: absolute;
  width: 100%;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
