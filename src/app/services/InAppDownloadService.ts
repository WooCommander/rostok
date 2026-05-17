import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

export type ProgressCallback = (progress: number, downloadedBytes: number, totalBytes: number) => void

export class InAppDownloadService {
  /**
   * Скачивает APK-файл с отслеживанием прогресса через @capacitor/filesystem (на Android/iOS)
   * или через стандартный fetch ReadableStream (в веб-версии)
   */
  static async downloadApk(url: string, onProgress: ProgressCallback): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const progressListener = await Filesystem.addListener('progress', (status: { url?: string, bytes: number, contentLength: number }) => {
          if (status.contentLength > 0) {
            const pct = Math.min(100, Math.round((status.bytes / status.contentLength) * 100))
            onProgress(pct, status.bytes, status.contentLength)
          }
        })

        const downloadResult = await Filesystem.downloadFile({
          url,
          path: 'Rostok_update.apk',
          directory: Directory.Cache,
          progress: true
        })

        try {
          await progressListener.remove()
        } catch {
          // Игнорируем ошибку удаления слушателя
        }

        if (downloadResult && downloadResult.path) {
          onProgress(100, 4800000, 4800000)
          return downloadResult.path
        }
      } else {
        // Веб-фоллбэк: загрузка через fetch с отображением прогресса
        const response = await fetch(url)
        if (!response.body) {
          onProgress(100, 4800000, 4800000)
          return url
        }

        const contentLength = +(response.headers.get('Content-Length') || 4800000)
        const reader = response.body.getReader()
        let receivedLength = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            onProgress(100, contentLength, contentLength)
            break
          }
          receivedLength += value?.length || 0
          const pct = Math.min(100, Math.round((receivedLength / contentLength) * 100))
          onProgress(pct, receivedLength, contentLength)
        }

        // Для веб-версии можно создать URL объекта для сохранения, но проще сразу возвращать url
        return url
      }
    } catch (err) {
      console.error('Ошибка скачивания in-app APK:', err)
      return null
    }
    return null
  }

  /**
   * Запускает установку скачанного APK в системе Android
   */
  static async installApk(filePathOrUrl: string, fallbackUrl: string) {
    try {
      if (Capacitor.isNativePlatform() && filePathOrUrl !== fallbackUrl) {
        // Конвертируем путь из кэша в локальный URI для вызова установщика
        const fileUri = Capacitor.convertFileSrc(filePathOrUrl)
        window.open(fileUri, '_system')
      } else {
        window.open(fallbackUrl, '_blank')
      }
    } catch (e) {
      console.warn('Не удалось запустить нативный интент, открытие ссылки в браузере:', e)
      window.open(fallbackUrl, '_blank')
    }
  }
}
