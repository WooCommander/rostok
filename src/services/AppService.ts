import { globalStore } from '@/store/globalStore'
import { AuthService } from '@/modules/auth/services/AuthService'
import { ProfileService } from '@/modules/profile/services/ProfileService'
import { ErrorHandler, type AppError } from '@/shared/lib/errorHandler'

class GlobalService {
    public readonly auth = AuthService

    public get isLoading() {
        return globalStore.isAppLoading.value
    }

    public setLoading(value: boolean) {
        globalStore.setLoading(value)
    }

    public handleError(error: unknown, context?: string): AppError {
        return ErrorHandler.handle(error, context)
    }

    public clearError(): void {
        ErrorHandler.clearError()
    }

    public addXp(amount: number): void {
        ProfileService.addXp(amount)
    }
}

export const AppService = new GlobalService()
