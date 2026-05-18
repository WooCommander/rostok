<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import AppUpdateProgressModal from '@/design-system/components/AppUpdateProgressModal.vue'
import { changelog } from '@/data/changelog'
import { AppUpdateService, type AppUpdateMeta } from '@/app/services/AppUpdateService'
import { useNotify } from '@/composables/useNotify'
import { Download, Share2 } from 'lucide-vue-next'

import { FpHaptics } from '@/shared/lib/haptics'

const router = useRouter()
const { notify } = useNotify()

const releases = changelog
const currentVersion = releases[0]?.version || '1.2.0'

const isChecking = ref(false)
const updateMeta = ref<AppUpdateMeta | null>(null)
const showUpdateModal = ref(false)

// Пасхалка
const clickCount = ref(0)
const easterEggUnlocked = ref(false)
const easterEggFact = ref('')

const facts = [
  'Первые растения на Земле не имели ни корней, ни листьев. Они впитывали воду всем телом!',
  'Бамбук — самая быстрорастущая трава в мире. Он может вырасти до 90 см за один день!',
  'Морковь изначально была фиолетовой, а не оранжевой. Оранжевую вывели голландцы в 17 веке!',
  'Земляника — единственная ягода, семена которой находятся снаружи, а не внутри.',
  'Самое старое живое дерево на Земле — сосна Мафусаил. Ей более 4800 лет!',
  'Помидоры имеют больше генов, чем человек! (У томата около 31 760 генов, а у человека — около 20 000).'
]

let clickTimer: ReturnType<typeof setTimeout> | null = null

function onIconClick() {
  if (easterEggUnlocked.value) return

  clickCount.value++
  
  if (clickTimer) clearTimeout(clickTimer)
  
  // Сбрасываем счетчик, если не было кликов 1.5 секунды
  clickTimer = setTimeout(() => {
    clickCount.value = 0
  }, 1500)

  if (clickCount.value >= 5) {
    easterEggUnlocked.value = true
    easterEggFact.value = facts[Math.floor(Math.random() * facts.length)]
    FpHaptics.success()
    notify('🎉 Вы нашли секретную пасхалку!', 'success')
  }
}

async function onCheckUpdates() {
  isChecking.value = true
  try {
    const latest = await AppUpdateService.getLatestRelease()
    if (latest) {
      updateMeta.value = latest
      showUpdateModal.value = true

      if (AppUpdateService.isNewerVersion(currentVersion, latest.version)) {
        notify(`🚀 Доступна новая версия ${latest.version}!`, 'success')
      } else {
        notify(`У вас установлена самая актуальная версия (${latest.version}).`, 'success')
      }
    } else {
      notify('Не удалось получить данные о последней версии из облака', 'error')
    }
  } catch (e) {
    notify('Не удалось проверить обновления', 'error')
  } finally {
    isChecking.value = false
  }
}

async function onShare() {
  const shareData = {
    title: 'Rostok - Дневник огородника',
    text: 'Попробуй Rostok — мой любимый дневник огородника! Скачивай тут:',
    url: 'https://kzrylsrzyqrrpofaqixm.supabase.co/storage/v1/object/public/releases/Rostok.apk'
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      notify('Ссылка скопирована в буфер обмена', 'success')
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      notify('Не удалось поделиться', 'error')
    }
  }
}
</script>

<template>
  <div class="about-view">
    <div class="page-header">
      <div>
        <h1 class="header-title">О приложении</h1>
      </div>
      <FpButton size="sm" variant="secondary" @click="router.back()">Назад</FpButton>
    </div>

    <FpCard class="app-info-card" padding="lg">
      <div 
        class="app-icon-wrapper" 
        :class="{ 'pulse-anim': clickCount > 0, 'egg-unlocked': easterEggUnlocked }"
        @click="onIconClick"
      >
        <span class="app-icon">🌱</span>
      </div>
      <div class="app-details">
        <h2>Rostok</h2>
        <p class="version">Версия {{ currentVersion }}</p>
      </div>

      <div class="actions">
        <FpButton variant="primary" class="action-btn" :loading="isChecking" @click="onCheckUpdates">
          <template #icon>
            <Download :size="18" />
          </template>
          Проверить обновления
        </FpButton>
        <FpButton variant="secondary" class="action-btn" @click="onShare">
          <template #icon>
            <Share2 :size="18" />
          </template>
          Поделиться
        </FpButton>
      </div>
    </FpCard>

    <transition name="fade">
      <FpCard v-if="easterEggUnlocked" class="easter-egg-card" padding="lg">
        <div class="egg-content">
          <span class="egg-icon">🤫</span>
          <div>
            <h3>А вы знали?</h3>
            <p>{{ easterEggFact }}</p>
          </div>
        </div>
      </FpCard>
    </transition>

    <div class="changelog-section">
      <h2 class="section-title">История изменений</h2>
      <div class="timeline">
        <FpCard v-for="rel in releases" :key="rel.version" class="release-card" padding="lg">
          <div class="release-header">
            <div class="title">
              <span class="version">v{{ rel.version }}</span>
              <span class="dot">•</span>
              <span class="date">{{ rel.date }}</span>
            </div>
          </div>

          <div class="pill-row" v-if="rel.highlights?.length">
            <span v-for="(h, i) in rel.highlights" :key="i" class="pill">{{ h }}</span>
          </div>

          <div class="grid">
            <div v-if="rel.features?.length" class="column">
              <h3>Новые функции</h3>
              <ul>
                <li v-for="(item, i) in rel.features" :key="i">{{ item }}</li>
              </ul>
            </div>
            <div v-if="rel.fixes?.length" class="column">
              <h3>Исправления</h3>
              <ul>
                <li v-for="(item, i) in rel.fixes" :key="i">{{ item }}</li>
              </ul>
            </div>
            <div v-if="rel.notes?.length" class="column">
              <h3>Примечания</h3>
              <ul>
                <li v-for="(item, i) in rel.notes" :key="i">{{ item }}</li>
              </ul>
            </div>
          </div>
        </FpCard>
      </div>
    </div>

    <AppUpdateProgressModal
      v-if="updateMeta"
      v-model:visible="showUpdateModal"
      :title="'Доступна версия ' + updateMeta.version"
      :message="updateMeta.release_notes || 'В новой версии добавлены полезные функции, справочники и секреты выращивания! Рекомендуем обновиться.'"
      :downloadUrl="updateMeta.download_url"
      :version="updateMeta.version"
    />
  </div>
</template>

<style scoped lang="scss">
.about-view {
  padding: var(--spacing-lg) var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .header-meta {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .header-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }
}

.app-info-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);

  .app-icon-wrapper {
    width: 80px;
    height: 80px;
    background: var(--color-background);
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--color-border);
  }

  .app-details {
    h2 {
      margin: 0;
      font-size: 24px;
      color: var(--color-text-primary);
    }

    .version {
      margin: 4px 0 0;
      color: var(--color-text-secondary);
      font-size: 14px;
      font-weight: 500;
    }
  }

  .actions {
    margin-top: var(--spacing-sm);
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);

    .action-btn {
      width: 100%;
    }
  }
}

.easter-egg-card {
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), color-mix(in srgb, var(--color-warning) 15%, transparent));
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  
  .egg-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .egg-icon {
    font-size: 28px;
    line-height: 1;
  }

  h3 {
    margin: 0 0 4px;
    color: var(--color-text-primary);
    font-size: 16px;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.4;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes gentlePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse-anim {
  animation: gentlePulse 0.2s ease;
}

.egg-unlocked {
  background: linear-gradient(135deg, var(--color-primary), var(--color-warning)) !important;
  color: white;
  border-color: transparent !important;
  transition: all 0.5s ease;
}

.changelog-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  .section-title {
    margin: 0;
    font-size: 18px;
    color: var(--color-text-primary);
    padding-left: 4px;
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.release-card {
  position: relative;
  border: 1px solid var(--color-border);

  .release-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: var(--color-text-primary);

    .version {
      font-size: 18px;
    }

    .dot {
      color: var(--color-text-tertiary);
    }

    .date {
      color: var(--color-text-secondary);
      font-size: 14px;
    }
  }
}

.pill-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.pill {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-md);
}

.column h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.column ul {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--color-text-primary);
}
</style>
