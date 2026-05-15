<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import MainLayout from '@/layouts/MainLayout.vue'
import FpNotificationContainer from '@/design-system/components/FpNotificationContainer.vue'
import { DeviceService } from '@/app/services/DeviceService'

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
  DeviceService.initStatusBar()
})
</script>

<template>
  <MainLayout />
  <FpNotificationContainer />
</template>
