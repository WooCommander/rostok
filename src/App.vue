<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import MainLayout from '@/layouts/MainLayout.vue'
import FpNotificationContainer from '@/design-system/components/FpNotificationContainer.vue'
import AppUpdateProgressModal from '@/design-system/components/AppUpdateProgressModal.vue'
import { DeviceService } from '@/app/services/DeviceService'
import { AppUpdateService, type AppUpdateMeta } from '@/app/services/AppUpdateService'
import { changelog } from '@/data/changelog'

const { initTheme } = useTheme()

const showUpdateModal = ref(false)
const updateMeta = ref<AppUpdateMeta | null>(null)
const currentVersion = changelog[0]?.version || '1.2.0'

onMounted(async () => {
  initTheme()
  DeviceService.initStatusBar()
  
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
