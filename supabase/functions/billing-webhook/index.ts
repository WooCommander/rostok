/**
 * Supabase Edge Function: billing-webhook
 *
 * Принимает вебхуки от RevenueCat (Google Play) и платёжника (YooKassa/Stripe).
 * Обновляет is_premium в user_settings.
 *
 * Деплой: supabase functions deploy billing-webhook
 *
 * Secrets (supabase secrets set KEY=VALUE):
 *   REVENUECAT_WEBHOOK_SECRET — из RevenueCat → Project Settings → Webhooks
 *   YOOKASSA_SECRET_KEY       — из YooKassa личного кабинета (если веб)
 *   STRIPE_WEBHOOK_SECRET     — из Stripe Dashboard (если Stripe)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const source = req.headers.get('x-billing-source') || 'revenuecat'
  let userId: string | null = null
  let expiresAt: string | null = null
  let isActive = false
  let provider = source

  try {
    const body = await req.json()

    if (source === 'revenuecat') {
      // Верификация вебхука RevenueCat
      const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
      if (secret) {
        const signature = req.headers.get('x-revenuecat-signature')
        if (signature !== secret) {
          return new Response('Unauthorized', { status: 401 })
        }
      }

      const event = body.event
      userId = event?.app_user_id

      const type: string = event?.type || ''
      isActive = [
        'INITIAL_PURCHASE',
        'RENEWAL',
        'PRODUCT_CHANGE',
        'UNCANCELLATION'
      ].includes(type)

      if (isActive && event?.expiration_at_ms) {
        expiresAt = new Date(event.expiration_at_ms).toISOString()
      }

      provider = 'google_play'

    } else if (source === 'yookassa') {
      // YooKassa вебхук
      // TODO: добавить верификацию IP (185.71.76.0/27, 185.71.77.0/27)
      const notification = body
      if (notification.object?.status === 'succeeded' && notification.object?.metadata?.user_id) {
        userId = notification.object.metadata.user_id
        isActive = true
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        provider = 'web'
      }

    } else if (source === 'stripe') {
      // Stripe вебхук — верификация подписи
      // TODO: import { stripe } ... verify signature
      const event = body
      if (event.type === 'customer.subscription.created' || event.type === 'invoice.payment_succeeded') {
        userId = event.data?.object?.metadata?.user_id
        const periodEnd = event.data?.object?.current_period_end
        isActive = true
        expiresAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null
        provider = 'web'
      }
      if (event.type === 'customer.subscription.deleted') {
        userId = event.data?.object?.metadata?.user_id
        isActive = false
      }
    }

    if (!userId) {
      return new Response('Missing user_id', { status: 400 })
    }

    if (isActive && expiresAt) {
      await supabase.rpc('activate_premium', {
        p_user_id: userId,
        p_expires_at: expiresAt,
        p_provider: provider
      })
    } else if (!isActive) {
      await supabase.rpc('deactivate_premium', { p_user_id: userId })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('billing-webhook error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
})
