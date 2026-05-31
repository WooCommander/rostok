import { globalStore } from '@/store/globalStore'

export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  BUSINESS = 'business',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: any
}

export class ErrorHandler {
  static createError(type: ErrorType, message: string, code?: string, details?: any): AppError {
    return {
      type,
      message,
      code,
      details
    }
  }

  static handle(error: unknown, context?: string): AppError {
    console.error(`Error in ${context || 'unknown context'}:`, error)

    let appError: AppError

    if (error instanceof Error) {
      appError = this.mapError(error)
    } else if (typeof error === 'string') {
      appError = this.createError(ErrorType.UNKNOWN, error)
    } else {
      appError = this.createError(ErrorType.UNKNOWN, 'Произошла неожиданная ошибка')
    }

    globalStore.setError(appError.message)
    return appError
  }

  private static mapError(error: Error): AppError {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return this.createError(
        ErrorType.NETWORK,
        'Проблемы с сетью. Проверьте интернет соединение',
        'NETWORK_ERROR'
      )
    }

    if (message.includes('auth') || message.includes('unauthorized')) {
      return this.createError(
        ErrorType.AUTH,
        'Ошибка авторизации. Войдите в аккаунт заново',
        'AUTH_ERROR'
      )
    }

    if (message.includes('validation') || message.includes('required')) {
      return this.createError(
        ErrorType.VALIDATION,
        'Проверьте правильность введенных данных',
        'VALIDATION_ERROR'
      )
    }

    return this.createError(ErrorType.UNKNOWN, error.message || 'Произошла ошибка')
  }

  static clearError(): void {
    globalStore.setError(null)
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<{ data: T | null; error: AppError | null }> {
    try {
      const data = await operation()
      return { data, error: null }
    } catch (error) {
      const appError = this.handle(error, context)
      return { data: null, error: appError }
    }
  }
}