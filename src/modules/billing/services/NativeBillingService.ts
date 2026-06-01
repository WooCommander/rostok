/**
 * Google Play Billing через RevenueCat.
 *
 * Установка: npm install @revenuecat/purchases-capacitor
 *
 * Настройка:
 * 1. Создать аккаунт на revenuecat.com
 * 2. Подключить Google Play Console → RevenueCat
 * 3. Создать продукт в Play Console: subscription ID = 'premium_monthly'
 * 4. В RevenueCat создать Entitlement 'premium' с этим продуктом
 * 5. Вставить ключ из RevenueCat → Project Settings → API Keys
 */

// TODO: вставить свой ключ из RevenueCat Dashboard → Project Settings → API Keys → Public (Android)
const REVENUECAT_API_KEY = 'YOUR_REVENUECAT_ANDROID_KEY'
const ENTITLEMENT_ID = 'premium'

export type NativePurchaseResult =
  | { success: true; expiresAt: string }
  | { success: false; cancelled: boolean; error?: string }

export const NativeBillingService = {
  async configure(userId: string): Promise<void> {
    const { Purchases } = await import(/* @vite-ignore */ '@revenuecat/purchases-capacitor')
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY })
    await Purchases.logIn({ appUserID: userId })
  },

  async purchase(): Promise<NativePurchaseResult> {
    try {
      const { Purchases } = await import(/* @vite-ignore */ '@revenuecat/purchases-capacitor')
      const offerings = await Purchases.getOfferings()
      const pkg = offerings.current?.monthly

      if (!pkg) return { success: false, cancelled: false, error: 'Продукт не найден в Play Console' }

      const result = await Purchases.purchasePackage({ aPackage: pkg })
      const entitlement = result.customerInfo.entitlements.active[ENTITLEMENT_ID]

      if (!entitlement) return { success: false, cancelled: false, error: 'Подписка не активирована' }

      return {
        success: true,
        expiresAt: entitlement.expirationDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      if (e?.code === '1' /* PURCHASE_CANCELLED */) {
        return { success: false, cancelled: true }
      }
      return { success: false, cancelled: false, error: e?.message || 'Ошибка покупки' }
    }
  },

  async restore(): Promise<NativePurchaseResult> {
    try {
      const { Purchases } = await import(/* @vite-ignore */ '@revenuecat/purchases-capacitor')
      const info = await Purchases.restorePurchases()
      const entitlement = info.customerInfo.entitlements.active[ENTITLEMENT_ID]

      if (!entitlement) return { success: false, cancelled: false, error: 'Активных подписок не найдено' }

      return {
        success: true,
        expiresAt: entitlement.expirationDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      return { success: false, cancelled: false, error: e?.message || 'Ошибка восстановления' }
    }
  },

  async getStatus(): Promise<{ isPremium: boolean; expiresAt?: string }> {
    try {
      const { Purchases } = await import(/* @vite-ignore */ '@revenuecat/purchases-capacitor')
      const info = await Purchases.getCustomerInfo()
      const entitlement = info.customerInfo.entitlements.active[ENTITLEMENT_ID]
      if (!entitlement) return { isPremium: false }
      return { isPremium: true, expiresAt: entitlement.expirationDate ?? undefined }
    } catch {
      return { isPremium: false }
    }
  }
}
