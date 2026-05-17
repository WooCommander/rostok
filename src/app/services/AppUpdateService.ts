import { useNotify } from '@/composables/useNotify'
import { FpHaptics } from '@/shared/lib/haptics'

export interface AppUpdateMeta {
  version: string
  release_notes?: string
  is_mandatory?: boolean
  download_url?: string
  created_at?: string
}

export class AppUpdateService {
  /**
   * Проверяет наличие новой версии приложения в Supabase
   * Сравнивает текущую версию (по умолчанию 1.0.0) с версией из БД.
   */
  static async checkForUpdates(currentVersion: string = '1.0.0'): Promise<AppUpdateMeta | null> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        console.warn('VITE_SUPABASE_URL не задан')
        return null
      }

      const url = `${supabaseUrl}/storage/v1/object/public/releases/version.json?t=${Date.now()}`
      const res = await fetch(url)
      if (!res.ok) {
        console.warn('Не удалось загрузить manifest version.json из Supabase Storage')
        return null
      }

      const data = await res.json()
      if (!data || !data.version) {
        return null
      }

      const updateData: AppUpdateMeta = {
        version: data.version,
        release_notes: data.notes,
        download_url: data.apkUrl
      }

      if (this.isNewerVersion(currentVersion, updateData.version)) {
        const { notify } = useNotify()
        FpHaptics.success()
        
        notify(
          `🚀 Доступна версия ${updateData.version}! ${updateData.release_notes ? updateData.release_notes.split('\n')[0] : 'Установлена новая версия с улучшениями.'}`,
          'success',
          10000
        )
        return updateData
      }

      return null
    } catch (e: unknown) {
      console.warn('Ошибка при проверке обновлений в Supabase Storage:', (e as Error).message || e)
      return null
    }
  }

  /**
   * Получает последнюю версию из Supabase Storage напрямую без проверки новизны
   */
  static async getLatestRelease(): Promise<AppUpdateMeta | null> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) return null

      const url = `${supabaseUrl}/storage/v1/object/public/releases/version.json?t=${Date.now()}`
      const res = await fetch(url)
      if (!res.ok) return null

      const data = await res.json()
      if (!data || !data.version) return null

      return {
        version: data.version,
        release_notes: data.notes,
        download_url: data.apkUrl
      }
    } catch {
      return null
    }
  }

  /**
   * Сравнивает две семантические версии (например, '1.0.0' и '1.0.1')
   */
  static isNewerVersion(current: string, remote: string): boolean {
    const currParts = current.split('.').map(Number)
    const remoteParts = remote.split('.').map(Number)

    const len = Math.max(currParts.length, remoteParts.length)
    for (let i = 0; i < len; i++) {
      const c = currParts[i] || 0
      const r = remoteParts[i] || 0
      if (r > c) return true
      if (r < c) return false
    }
    return false
  }
}
