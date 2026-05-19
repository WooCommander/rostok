<script setup lang="ts">
import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'

import FpButton from './FpButton.vue'
import FpCard from './FpCard.vue'
import { InAppDownloadService } from '@/app/services/InAppDownloadService'
import { FpHaptics } from '@/shared/lib/haptics'
import { Download, CheckCircle2, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  title: string
  message: string
  downloadUrl?: string
  version?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'cancel'): void
  (e: 'success'): void
}>()

const status = ref<'idle' | 'downloading' | 'success' | 'error'>('idle')
const downloadProgress = ref(0)
const downloadedBytes = ref(0)
const totalBytes = ref(0)
const downloadedFilePath = ref<string | null>(null)

const isNative = computed(() => Capacitor.isNativePlatform())

const formattedDownloaded = computed(() => (downloadedBytes.value / 1024 / 1024).toFixed(1))
const formattedTotal = computed(() => (totalBytes.value > 0 ? (totalBytes.value / 1024 / 1024).toFixed(1) : '4.8'))

// Для SVG кругового прогресса
const radius = 54
const circumference = 2 * Math.PI * radius
const strokeOffset = computed(() => circumference - (downloadProgress.value / 100) * circumference)

function close() {
  if (status.value === 'downloading') return // Блокируем закрытие во время загрузки
  emit('update:visible', false)
  emit('cancel')
}

async function startDownload() {
  const url = props.downloadUrl || 'https://kzrylsrzyqrrpofaqixm.supabase.co/storage/v1/object/public/releases/Rostok.apk'
  
  if (isNative.value) {
    status.value = 'downloading'
    downloadProgress.value = 0
    FpHaptics.selection()
    
    // Плавная имитация подготовки к переходу на телефоне
    const interval = setInterval(() => {
      if (downloadProgress.value < 100) {
        downloadProgress.value += 10
      } else {
        clearInterval(interval)
        status.value = 'success'
        downloadedFilePath.value = url
        FpHaptics.success()
        
        setTimeout(() => {
          triggerInstall()
        }, 600)
      }
    }, 100)
  } else {
    status.value = 'downloading'
    downloadProgress.value = 0
    downloadedBytes.value = 0
    totalBytes.value = 4800000
    FpHaptics.selection()

    const resultPath = await InAppDownloadService.downloadApk(url, (pct, loaded, total) => {
      downloadProgress.value = pct
      downloadedBytes.value = loaded
      if (total > 0) totalBytes.value = total
    })

    if (resultPath) {
      downloadProgress.value = 100
      status.value = 'success'
      downloadedFilePath.value = resultPath
      FpHaptics.success()

      // Запускаем установку через 600мс после анимации 100%
      setTimeout(() => {
        triggerInstall()
      }, 600)
    } else {
      status.value = 'error'
      FpHaptics.error()
    }
  }
}

function triggerInstall() {
  const url = props.downloadUrl || 'https://kzrylsrzyqrrpofaqixm.supabase.co/storage/v1/object/public/releases/Rostok.apk'
  if (downloadedFilePath.value) {
    InAppDownloadService.installApk(downloadedFilePath.value, url)
  } else {
    window.open(url, '_system')
  }
  emit('success')
  emit('update:visible', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="update-modal-overlay" @click.self="close">
        <div class="update-modal-container">
          <FpCard class="update-card" padding="lg">
            <div class="update-header">
              <div class="header-icon-badge">
                <span class="app-icon">🌱</span>
              </div>
              <h3 class="modal-title">{{ title }}</h3>
            </div>

            <div class="update-body">
              <template v-if="status === 'idle'">
                <p class="release-desc">{{ message }}</p>
                <div class="features-box">
                  <span class="f-title">Что нового в релизе:</span>
                  <ul class="features-list">
                    <li>🟢 Интерактивная фильтрация каталога по сложности, свету и поливу</li>
                    <li>🦠 Прямые рекомендации фунгицидов при риске грибковых болезней</li>
                    <li>🔖 Закладки для сохранения полезных советов дня в профиле</li>
                    <li>✨ Плавная анимация перелистывания карточек при свайпе</li>
                  </ul>
                </div>
              </template>

              <template v-else-if="status === 'downloading'">
                <div class="progress-circle-container">
                  <svg class="progress-svg" width="140" height="140">
                    <!-- Задний фон круга -->
                    <circle
                      class="progress-bg"
                      cx="70" cy="70" :r="radius"
                      stroke-width="10"
                    />
                    <!-- Заполняющаяся полоса -->
                    <circle
                      class="progress-bar"
                      cx="70" cy="70" :r="radius"
                      stroke-width="10"
                      :stroke-dasharray="circumference"
                      :stroke-dashoffset="strokeOffset"
                    />
                  </svg>
                  <div class="progress-text-center">
                    <span class="pct-num">{{ downloadProgress }}%</span>
                  </div>
                </div>
                <div class="progress-details">
                  <h4 class="status-head">
                    {{ isNative ? 'Подготовка к установке...' : 'Загрузка обновления...' }}
                  </h4>
                  <span class="status-meta">
                    {{ isNative ? 'Перенаправление в браузер' : `${formattedDownloaded} MB из ${formattedTotal} MB` }}
                  </span>
                </div>
              </template>

              <template v-else-if="status === 'success'">
                <div class="success-box">
                  <CheckCircle2 :size="56" class="success-icon" />
                  <h4 class="success-title">
                    {{ isNative ? 'Запуск установки...' : 'Загрузка завершена!' }}
                  </h4>
                  <p class="success-desc">
                    {{ isNative ? 'Открываем системный браузер для скачивания и установки APK. Пожалуйста, подтвердите установку файла.' : 'Файл успешно подготовлен! Нажмите кнопку ниже для сохранения на диск.' }}
                  </p>
                </div>
              </template>

              <template v-else-if="status === 'error'">
                <div class="error-box">
                  <AlertCircle :size="56" class="error-icon" />
                  <h4 class="error-title">Ошибка при скачивании</h4>
                  <p class="error-desc">Не удалось загрузить файл обновления внутри приложения. Вы можете скачать актуальный APK напрямую через браузер.</p>
                </div>
              </template>
            </div>

            <div class="update-footer">
              <template v-if="status === 'idle'">
                <FpButton variant="text" @click="close" class="footer-btn">Позже</FpButton>
                <FpButton variant="primary" @click="startDownload" class="footer-btn action-btn">
                  <template #icon><Download :size="18" /></template>
                  {{ isNative ? 'Обновить' : 'Обновить сейчас' }}
                </FpButton>
              </template>

              <template v-else-if="status === 'downloading'">
                <div class="downloading-notice">Пожалуйста, не закрывайте приложение</div>
              </template>

              <template v-else-if="status === 'success'">
                <FpButton variant="primary" @click="triggerInstall" class="footer-btn full-btn">
                  {{ isNative ? 'Открыть в браузере' : 'Сохранить APK' }}
                </FpButton>
              </template>

              <template v-else-if="status === 'error'">
                <FpButton variant="text" @click="close" class="footer-btn">Закрыть</FpButton>
                <FpButton variant="primary" @click="triggerInstall" class="footer-btn action-btn">Скачать в браузере</FpButton>
              </template>
            </div>
          </FpCard>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>


<style scoped lang="scss">
.update-modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(10, 15, 12, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.update-modal-container {
  width: 100%; max-width: 420px;
  animation: modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.update-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4);
}

.update-header {
  display: flex; align-items: center; gap: 14px; margin-bottom: 16px;
}

.header-icon-badge {
  width: 48px; height: 48px; border-radius: var(--radius-xl);
  background: var(--color-primary-subtle, rgba(45,106,79,0.15));
  border: 1px solid rgba(45,106,79,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; flex-shrink: 0;
}

.modal-title {
  font-size: 20px; font-weight: 800; color: var(--color-text-primary); margin: 0;
}

.update-body {
  margin-bottom: 24px;
}

.release-desc {
  font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; margin: 0 0 16px;
}

.features-box {
  background: var(--color-background); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); padding: 14px;

  .f-title { font-size: 12px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px; }
  .features-list {
    margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px;
    li { font-size: 13px; color: var(--color-text-primary); font-weight: 500; display: flex; align-items: center; gap: 6px; }
  }
}

/* ── PROGRESS CIRCLE ── */
.progress-circle-container {
  position: relative; display: flex; justify-content: center; align-items: center; margin: 20px 0 16px;
}

.progress-svg {
  transform: rotate(-90deg);

  .progress-bg { fill: transparent; stroke: var(--color-border); opacity: 0.4; }
  .progress-bar { fill: transparent; stroke: var(--color-primary); stroke-linecap: round; transition: stroke-dashoffset 0.2s linear; }
}

.progress-text-center {
  position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;
  .pct-num { font-size: 32px; font-weight: 800; color: var(--color-text-primary); letter-spacing: -0.03em; }
}

.progress-details {
  text-align: center; display: flex; flex-direction: column; gap: 4px;
  .status-head { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
  .status-meta { font-size: 13px; font-weight: 600; color: var(--color-text-tertiary); }
}

.success-box, .error-box {
  text-align: center; padding: 24px 10px 10px; display: flex; flex-direction: column; align-items: center; gap: 12px;
}

.success-icon { color: var(--color-success, #22c55e); animation: popIcon 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.success-title { font-size: 20px; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.success-desc { font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; margin: 0; }

.error-icon { color: var(--color-error); }
.error-title { font-size: 20px; font-weight: 800; color: var(--color-text-primary); margin: 0; }
.error-desc { font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; margin: 0; }

.update-footer {
  display: flex; justify-content: flex-end; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid var(--color-border);
}

.footer-btn { font-weight: 700; font-size: 14px; }
.action-btn { flex: 1; }
.full-btn { width: 100%; }
.downloading-notice { width: 100%; text-align: center; font-size: 12px; font-weight: 600; color: var(--color-text-tertiary); animation: pulseText 2s infinite; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@keyframes modalScaleUp {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes popIcon {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes pulseText {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
