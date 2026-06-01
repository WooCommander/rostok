import { Capacitor } from '@capacitor/core'
import { supabase } from '@/api/supabase'
import { NativeBillingService } from './NativeBillingService'
import { WebBillingService } from './WebBillingService'

export type PurchaseResult =
  | { success: true; expiresAt: string }
  | { success: false; cancelled: boolean; error?: string }

export const BillingService = {
  isNative(): boolean {
    return Capacitor.isNativePlatform()
  },

  async init(): Promise<void> {
    if (!this.isNative()) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await NativeBillingService.configure(user.id)
      }
    } catch {
      // RevenueCat не установлен — пропускаем без ошибки
    }
  },

  async purchase(): Promise<PurchaseResult> {
    if (this.isNative()) {
      const result = await NativeBillingService.purchase()
      if (result.success) {
        await this.syncPremiumToSupabase(result.expiresAt, 'google_play')
      }
      return result
    }
    return WebBillingService.purchase()
  },

  async restore(): Promise<PurchaseResult> {
    if (!this.isNative()) {
      return { success: false, cancelled: false, error: 'Восстановление доступно только в мобильном приложении' }
    }
    const result = await NativeBillingService.restore()
    if (result.success) {
      await this.syncPremiumToSupabase(result.expiresAt, 'google_play')
    }
    return result
  },

  async checkAndSyncStatus(): Promise<boolean> {
    if (this.isNative()) {
      const { isPremium, expiresAt } = await NativeBillingService.getStatus()
      if (isPremium && expiresAt) {
        await this.syncPremiumToSupabase(expiresAt, 'google_play')
      }
      return isPremium
    }

    // Для веба — проверяем флаг в БД (обновляется вебхуком)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from('user_settings')
      .select('is_premium, premium_expires_at')
      .eq('user_id', user.id)
      .single()

    if (!data?.is_premium) return false
    if (data.premium_expires_at && new Date(data.premium_expires_at) < new Date()) {
      await this.deactivateExpired(user.id)
      return false
    }
    return true
  },

  async syncPremiumToSupabase(expiresAt: string, provider: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.rpc('activate_premium', {
      p_user_id: user.id,
      p_expires_at: expiresAt,
      p_provider: provider
    })
  },

  async deactivateExpired(userId: string): Promise<void> {
    await supabase.rpc('deactivate_premium', { p_user_id: userId })
  },

  getPriceLabel(): string {
    return '199 ₽/мес'
  }
}
