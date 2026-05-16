import { supabase } from '@/api/supabase'
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
      // Ищем последнюю запись в таблице app_versions
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('Проверка обновлений пропущена (таблица app_versions не найдена или недоступна):', error.message)
        return null
      }

      const updateData = data as unknown as AppUpdateMeta | null

      if (updateData && updateData.version && this.isNewerVersion(currentVersion, updateData.version)) {
        const { notify } = useNotify()
        FpHaptics.success()
        
        notify(
          `🚀 Доступна версия ${updateData.version}! ${updateData.release_notes || 'Установлена новая версия с улучшениями.'}`,
          'success',
          10000
        )
        return updateData
      }

      return null
    } catch (e: unknown) {
      console.warn('Ошибка при проверке обновлений в Supabase:', (e as Error).message || e)
      return null
    }
  }

  /**
   * Сравнивает две семантические версии (например, '1.0.0' и '1.0.1')
   */
  private static isNewerVersion(current: string, remote: string): boolean {
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
