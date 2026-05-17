import { ref } from 'vue'
import { ReminderService } from '../services/ReminderService'
import { RemindersAdapter, type ReminderUiModel } from '../adapters/RemindersAdapter'

export function useReminderState() {
  const activeReminders = ref<ReminderUiModel[]>([])
  const loading = ref(true)

  async function loadForToday() {
    loading.value = true
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const raw = await ReminderService.getActiveRemindersForDate(todayStr)
      activeReminders.value = raw.map(RemindersAdapter.toUiModel)
    } catch (e) {
      console.error('Ошибка загрузки напоминаний:', e)
    } finally {
      loading.value = false
    }
  }

  async function completeReminder(id: string) {
    await ReminderService.markAsCompleted(id)
    activeReminders.value = activeReminders.value.filter(r => r.id !== id)
  }

  async function dismissReminder(id: string) {
    await ReminderService.markAsCompleted(id)
    activeReminders.value = activeReminders.value.filter(r => r.id !== id)
  }

  return {
    activeReminders,
    loading,
    loadForToday,
    completeReminder,
    dismissReminder
  }
}
