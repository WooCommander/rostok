import { ReminderService } from '@/modules/reminders/services/ReminderService'

const SETTINGS_KEY = 'rostok_push_enabled'

export const PushNotificationService = {
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  },

  getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  },

  isEnabled(): boolean {
    return localStorage.getItem(SETTINGS_KEY) === 'true' && this.getPermission() === 'granted'
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false

    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        localStorage.setItem(SETTINGS_KEY, 'true')
        await this.registerServiceWorker()
        await this.scheduleActiveReminders()
        return true
      } else {
        localStorage.setItem(SETTINGS_KEY, 'false')
        return false
      }
    } catch (e) {
      console.error('Ошибка при запросе разрешения на уведомления:', e)
      return false
    }
  },

  toggleEnabled(enable: boolean): void {
    localStorage.setItem(SETTINGS_KEY, String(enable))
  },

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      return reg
    } catch (e) {
      console.error('Ошибка регистрации Service Worker:', e)
      return null
    }
  },

  async showNotification(title: string, body: string, url: string = '/'): Promise<void> {
    if (this.getPermission() !== 'granted' || !this.isEnabled()) return

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          data: { url }
        })
        return
      }
    }

    new Notification(title, {
      body,
      icon: '/vite.svg',
      data: { url }
    })
  },

  async scheduleActiveReminders(): Promise<void> {
    if (!this.isEnabled()) return

    const reminders = await ReminderService.getAll()
    const todayStr = new Date().toISOString().split('T')[0]
    
    // Ищем напоминания на сегодня или просроченные, которые еще не выполнены
    const active = reminders.filter(r => !r.completed && r.remindAtDate <= todayStr)
    
    if (active.length > 0) {
      const count = active.length
      const title = '🌱 Росток — Запланирован уход!'
      const body = `У вас ${count} запланированных процедур на сегодня. Зайдите в приложение, чтобы выполнить их.`
      
      const lastSentKey = `rostok_notif_sent_${todayStr}`
      if (localStorage.getItem(lastSentKey) !== 'true') {
        await this.showNotification(title, body, '/')
        localStorage.setItem(lastSentKey, 'true')
      }
    }
  }
}
