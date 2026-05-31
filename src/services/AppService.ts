import { globalStore } from '@/store/globalStore'
import { AuthService } from '@/modules/auth/services/AuthService'
import { ProfileService } from '@/modules/profile/services/ProfileService'

class GlobalService {
    public readonly auth = AuthService

    public get isLoading() {
        return globalStore.isAppLoading.value
    }

    public setLoading(value: boolean) {
        globalStore.setLoading(value)
    }

    public handleError(error: unknown) {
        console.error('Global Error:', error)
        globalStore.setError(String(error))
    }

    public addXp(amount: number): void {
        ProfileService.addXp(amount)
    }
}

export const AppService = new GlobalService()
