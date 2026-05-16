<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import MainLayout from '@/layouts/MainLayout.vue'
import FpNotificationContainer from '@/design-system/components/FpNotificationContainer.vue'
import FpConfirmationModal from '@/design-system/components/FpConfirmationModal.vue'
import { DeviceService } from '@/app/services/DeviceService'
import { AppUpdateService, type AppUpdateMeta } from '@/app/services/AppUpdateService'

const { initTheme } = useTheme()

const showUpdateModal = ref(false)
const updateMeta = ref<AppUpdateMeta | null>(null)

onMounted(async () => {
  initTheme()
  DeviceService.initStatusBar()
  
  const meta = await AppUpdateService.checkForUpdates('1.0.0')
  if (meta) {
    updateMeta.value = meta
    showUpdateModal.value = true
  }
})

function onConfirmUpdate() {
  const url = updateMeta.value?.download_url || 'https://play.google.com/store/apps/details?id=com.rostok.app'
  window.open(url, '_blank')
}
</script>

<template>
  <MainLayout />
  <FpNotificationContainer />

  <FpConfirmationModal
    v-if="updateMeta"
    v-model:visible="showUpdateModal"
    :title="'Доступна версия ' + updateMeta.version"
    :message="updateMeta.release_notes || 'В новой версии добавлены полезные функции, справочники и секреты выращивания! Рекомендуем обновиться.'"
    confirmText="Обновить"
    cancelText="Позже"
    variant="primary"
    @confirm="onConfirmUpdate"
  />
</template>
