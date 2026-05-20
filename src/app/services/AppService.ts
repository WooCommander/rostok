import { ProfileService } from '@/modules/profile/services/ProfileService'

export const AppService = {
  addXp(amount: number): void {
    ProfileService.addXp(amount)
  }
}
