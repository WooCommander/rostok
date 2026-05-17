<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpConfirmationModal from '@/design-system/components/FpConfirmationModal.vue'
import { changelog } from '@/data/changelog'
import { AppUpdateService, type AppUpdateMeta } from '@/app/services/AppUpdateService'
import { useNotify } from '@/composables/useNotify'
import { Info, Download, Share2 } from 'lucide-vue-next'

const router = useRouter()
const { notify } = useNotify()

const releases = changelog
const currentVersion = releases[0]?.version || '1.1.1'

const isChecking = ref(false)
const updateMeta = ref<AppUpdateMeta | null>(null)
const showUpdateModal = ref(false)

async function onCheckUpdates() {
  isChecking.value = true
  try {
    const meta = await AppUpdateService.checkForUpdates(currentVersion)
    if (meta) {
      updateMeta.value = meta
      showUpdateModal.value = true
    } else {
      notify('У вас установлена самая актуальная версия!', 'success')
    }
  } catch (e) {
    notify('Не удалось проверить обновления', 'error')
  } finally {
    isChecking.value = false
  }
}

function onConfirmUpdate() {
  const url = updateMeta.value?.download_url || 'https://kzrylsrzyqrrpofaqixm.supabase.co/storage/v1/object/public/releases/Rostok.apk'
  window.open(url, '_blank')
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
      <div class="app-icon-wrapper">
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

    <FpConfirmationModal v-if="updateMeta" v-model:visible="showUpdateModal"
      :title="'Доступна версия ' + updateMeta.version"
      :message="updateMeta.release_notes || 'В новой версии добавлены полезные функции, справочники и секреты выращивания! Рекомендуем обновиться.'"
      confirmText="Обновить" cancelText="Отмена" variant="primary" @confirm="onConfirmUpdate" />
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
