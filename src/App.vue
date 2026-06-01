<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useNotify } from '@/composables/useNotify'
import MainLayout from '@/layouts/MainLayout.vue'
import FpNotificationContainer from '@/design-system/components/FpNotificationContainer.vue'
import AppUpdateProgressModal from '@/design-system/components/AppUpdateProgressModal.vue'
import { DeviceService } from '@/app/services/DeviceService'
import { AppUpdateService, type AppUpdateMeta } from '@/app/services/AppUpdateService'
import { changelog } from '@/data/changelog'
import { PushNotificationService } from '@/modules/notifications'
import { BillingService } from '@/modules/billing/services/BillingService'
import { App as CapacitorApp } from '@capacitor/app'

const router = useRouter()
const { initTheme } = useTheme()
const { notify } = useNotify()

const showUpdateModal = ref(false)
const updateMeta = ref<AppUpdateMeta | null>(null)
const currentVersion = changelog[0]?.version || '1.2.0'

let backPressCount = 0
let backPressTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  initTheme()
  DeviceService.initStatusBar()
  PushNotificationService.scheduleActiveReminders()
  BillingService.init().catch(() => {})
  
  CapacitorApp.addListener('backButton', () => {
    if (window.history.state && window.history.state.back) {
      router.back()
    } else {
      backPressCount++
      if (backPressCount === 1) {
        notify('Свайпните еще раз, чтобы выйти', 'info', 2000)
        backPressTimeout = setTimeout(() => {
          backPressCount = 0
        }, 2000)
      } else {
        if (backPressTimeout) clearTimeout(backPressTimeout)
        CapacitorApp.exitApp()
      }
    }
  })
  
  const meta = await AppUpdateService.checkForUpdates(currentVersion)
  if (meta) {
    updateMeta.value = meta
    showUpdateModal.value = true
  }
})
</script>

<template>
  <MainLayout />
  <FpNotificationContainer />

  <AppUpdateProgressModal
    v-if="updateMeta"
    v-model:visible="showUpdateModal"
    :title="'Доступна версия ' + updateMeta.version"
    :message="updateMeta.release_notes || 'В новой версии добавлены полезные функции, справочники и секреты выращивания! Рекомендуем обновиться.'"
    :downloadUrl="updateMeta.download_url"
    :version="updateMeta.version"
  />
</template>
