import { ref, onMounted } from 'vue'
import { PushNotificationService } from '../services/PushNotificationService'

export function useNotificationState() {
  const isSupported = ref(false)
  const isEnabled = ref(false)
  const permission = ref<NotificationPermission | 'unsupported'>('unsupported')
  const loading = ref(false)

  function checkStatus() {
    isSupported.value = PushNotificationService.isSupported()
    permission.value = PushNotificationService.getPermission()
    isEnabled.value = PushNotificationService.isEnabled()
  }

  async function enableNotifications() {
    loading.value = true
    try {
      const granted = await PushNotificationService.requestPermission()
      checkStatus()
      if (granted) {
        await PushNotificationService.showNotification(
          'Уведомления включены!', 
          'Теперь Росток будет вовремя сообщать вам о необходимых поливах и подкормках.'
        )
      }
      return granted
    } finally {
      loading.value = false
    }
  }

  function disableNotifications() {
    PushNotificationService.toggleEnabled(false)
    checkStatus()
  }

  async function testNotification() {
    await PushNotificationService.showNotification(
      'Тестовое уведомление 💦', 
      'Полив: Томаты (Теплица №1) — 5 л теплой воды.'
    )
  }

  onMounted(() => {
    checkStatus()
  })

  return {
    isSupported,
    isEnabled,
    permission,
    loading,
    enableNotifications,
    disableNotifications,
    testNotification,
    checkStatus
  }
}
