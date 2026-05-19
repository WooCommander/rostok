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
        // На нативной платформе мы возвращаем исходный URL, так как установка
        // будет безопасно выполнена через системный браузер во избежание ограничений доступа к файлам кэша.
        return url
      } else {
        // Веб-версия: скачиваем файл один раз как Blob с отображением прогресса
        const response = await fetch(url)
        if (!response.body) {
          return url
        }

        const contentLength = +(response.headers.get('Content-Length') || 0)
        const reader = response.body.getReader()
        let receivedLength = 0
        const chunks: Uint8Array[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            break
          }
          if (value) {
            chunks.push(value)
            receivedLength += value.length
            if (contentLength > 0) {
              const pct = Math.min(100, Math.round((receivedLength / contentLength) * 100))
              onProgress(pct, receivedLength, contentLength)
            }
          }
        }

        const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' })
        return URL.createObjectURL(blob)
      }
    } catch (err) {
      console.error('Ошибка подготовки APK:', err)
      return url
    }
  }

  /**
   * Запускает установку скачанного APK в системе Android или скачивание в вебе
   */
  static async installApk(filePathOrUrl: string, fallbackUrl: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Открываем во внешнем браузере, чтобы Android скачал и установил APK
        window.open(fallbackUrl, '_system')
      } else {
        // В веб-версии создаем невидимую ссылку для сохранения Blob-файла на диск
        const link = document.createElement('a')
        link.href = filePathOrUrl
        link.download = 'Rostok.apk'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Освобождаем память Blob URL
        if (filePathOrUrl.startsWith('blob:')) {
          URL.revokeObjectURL(filePathOrUrl)
        }
      }
    } catch (e) {
      console.warn('Ошибка при установке/сохранении файла:', e)
      window.open(fallbackUrl, '_blank')
    }
  }
}

