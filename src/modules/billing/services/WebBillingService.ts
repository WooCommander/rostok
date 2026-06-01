/**
 * Веб-оплата через Supabase Edge Function.
 *
 * Edge Function создаёт сессию оплаты (YooKassa / Stripe)
 * и возвращает URL для редиректа на страницу оплаты.
 *
 * После успешной оплаты платёжник отправляет вебхук на
 * /functions/v1/billing-webhook, который обновляет is_premium.
 *
 * TODO: выбрать процессор и добавить его ключи в Supabase Secrets:
 *   YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY
 *   или STRIPE_SECRET_KEY
 */

import { supabase } from '@/api/supabase'

export type WebPurchaseResult =
  | { success: true; expiresAt: string }
  | { success: false; cancelled: boolean; error?: string }

const MONTHLY_PRICE_LABEL = '199 ₽/мес'

export const WebBillingService = {
  async purchase(): Promise<WebPurchaseResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, cancelled: false, error: 'Необходима авторизация' }

      const { data, error } = await supabase.functions.invoke('create-payment-session', {
        body: {
          user_id: user.id,
          product: 'premium_monthly',
          return_url: window.location.origin + '/profile?payment=success',
          cancel_url: window.location.origin + '/profile?payment=cancelled'
        }
      })

      if (error || !data?.checkout_url) {
        return { success: false, cancelled: false, error: 'Не удалось создать сессию оплаты' }
      }

      // Открываем страницу оплаты — результат придёт через вебхук
      window.location.href = data.checkout_url
      return { success: false, cancelled: false } // never reached, page redirects
    } catch (err: unknown) {
      const e = err as { message?: string }
      return { success: false, cancelled: false, error: e?.message || 'Ошибка оплаты' }
    }
  },

  getPriceLabel(): string {
    return MONTHLY_PRICE_LABEL
  }
}
