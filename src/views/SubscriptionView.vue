<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Sparkles, ShieldCheck, CheckCircle2, XCircle,
  RefreshCw, ExternalLink, Loader2, Clock, CreditCard
} from 'lucide-vue-next'
import { supabase } from '@/api/supabase'
import { BillingService } from '@/modules/billing/services/BillingService'

const router = useRouter()

interface SubscriptionInfo {
  isPremium: boolean
  expiresAt: string | null
  provider: string | null
}

interface SubscriptionEvent {
  id: string
  event_type: string
  provider: string
  expires_at: string | null
  amount_rub: number | null
  created_at: string
}

const loading = ref(true)
const actionLoading = ref(false)
const restoring = ref(false)
const info = ref<SubscriptionInfo>({ isPremium: false, expiresAt: null, provider: null })
const events = ref<SubscriptionEvent[]>([])
const errorMsg = ref('')
const successMsg = ref('')

const expiresFormatted = computed(() => {
  if (!info.value.expiresAt) return null
  const d = new Date(info.value.expiresAt)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

const isExpired = computed(() => {
  if (!info.value.expiresAt) return false
  return new Date(info.value.expiresAt) < new Date()
})

const statusLabel = computed(() => {
  if (!info.value.isPremium || isExpired.value) return 'Базовая версия'
  return 'Premium активен'
})

const providerLabel = computed(() => {
  if (info.value.provider === 'google_play') return 'Google Play'
  if (info.value.provider === 'web') return 'Веб-оплата'
  return null
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: settings } = await supabase
      .from('user_settings')
      .select('is_premium, premium_expires_at, subscription_provider')
      .eq('user_id', user.id)
      .single()

    if (settings) {
      info.value = {
        isPremium: settings.is_premium ?? false,
        expiresAt: settings.premium_expires_at ?? null,
        provider: settings.subscription_provider ?? null
      }
    }

    const { data: eventsData } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    events.value = eventsData || []
  } finally {
    loading.value = false
  }
}

async function onSubscribe() {
  actionLoading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const result = await BillingService.purchase()
    if (result.success) {
      successMsg.value = 'Подписка успешно оформлена!'
      await loadData()
    } else if (!result.cancelled) {
      errorMsg.value = result.error || 'Не удалось оформить подписку'
    }
  } finally {
    actionLoading.value = false
  }
}

async function onRestore() {
  restoring.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const result = await BillingService.restore()
    if (result.success) {
      successMsg.value = 'Подписка восстановлена!'
      await loadData()
    } else {
      errorMsg.value = result.error || 'Активных подписок не найдено'
    }
  } finally {
    restoring.value = false
  }
}

function openManageSubscription() {
  // Google Play: открываем страницу управления подписками
  const url = 'https://play.google.com/store/account/subscriptions'
  if (window.open) window.open(url, '_blank')
}

function eventLabel(type: string): string {
  const map: Record<string, string> = {
    activated: 'Подписка оформлена',
    renewed: 'Подписка продлена',
    restored: 'Подписка восстановлена',
    cancelled: 'Подписка отменена',
    expired: 'Подписка истекла'
  }
  return map[type] || type
}

function eventIcon(type: string): string {
  const map: Record<string, string> = {
    activated: '✅',
    renewed: '🔄',
    restored: '♻️',
    cancelled: '❌',
    expired: '⏰'
  }
  return map[type] || '📋'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="subscription-view">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <h1 class="header-title">Подписка</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader2 :size="32" class="spin" />
    </div>

    <template v-else>
      <!-- Статус подписки -->
      <div class="status-card" :class="{ active: info.isPremium && !isExpired }">
        <div class="status-icon-wrap">
          <Sparkles :size="28" />
        </div>
        <div class="status-content">
          <div class="status-badge" :class="{ active: info.isPremium && !isExpired }">
            <CheckCircle2 v-if="info.isPremium && !isExpired" :size="14" />
            <XCircle v-else :size="14" />
            {{ statusLabel }}
          </div>
          <div v-if="info.isPremium && !isExpired && expiresFormatted" class="status-detail">
            Действует до {{ expiresFormatted }}
          </div>
          <div v-else-if="isExpired" class="status-detail expired">
            Истекла {{ expiresFormatted }}
          </div>
          <div v-if="providerLabel" class="status-provider">
            <CreditCard :size="12" /> {{ providerLabel }}
          </div>
        </div>
      </div>

      <!-- Возможности Premium -->
      <div class="features-card">
        <div class="features-title">Что входит в Premium</div>
        <div class="feature-row">
          <ShieldCheck :size="18" class="ficon" />
          <span>Приватный профиль — активность не видна в ленте</span>
        </div>
        <div class="feature-row">
          <ShieldCheck :size="18" class="ficon" />
          <span>Безлимитные растения в огороде</span>
        </div>
        <div class="feature-row">
          <ShieldCheck :size="18" class="ficon" />
          <span>Безлимитные напоминания об обработках</span>
        </div>
        <div class="feature-row">
          <ShieldCheck :size="18" class="ficon" />
          <span>Умная карта огородников рядом (скоро)</span>
        </div>
      </div>

      <!-- Сообщения -->
      <div v-if="errorMsg" class="msg error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="msg success">{{ successMsg }}</div>

      <!-- Действия -->
      <div class="actions">
        <template v-if="!info.isPremium || isExpired">
          <button class="btn-primary" @click="onSubscribe" :disabled="actionLoading">
            <Loader2 v-if="actionLoading" :size="18" class="spin" />
            <Sparkles v-else :size="18" />
            {{ actionLoading ? 'Оформление...' : `Оформить Premium — ${BillingService.getPriceLabel()}` }}
          </button>
        </template>

        <template v-else>
          <div class="manage-hint">
            Управление подпиской доступно через {{ providerLabel || 'магазин приложений' }}.
          </div>
          <button v-if="info.provider === 'google_play'" class="btn-secondary" @click="openManageSubscription">
            <ExternalLink :size="16" />
            Управление в Google Play
          </button>
        </template>

        <button
          v-if="BillingService.isNative()"
          class="btn-ghost"
          @click="onRestore"
          :disabled="restoring || actionLoading"
        >
          <Loader2 v-if="restoring" :size="14" class="spin" />
          <RefreshCw v-else :size="14" />
          Восстановить покупку
        </button>
      </div>

      <!-- История -->
      <div v-if="events.length > 0" class="history-section">
        <div class="section-title">
          <Clock :size="14" />
          История подписок
        </div>
        <div class="events-list">
          <div v-for="ev in events" :key="ev.id" class="event-row">
            <div class="event-icon">{{ eventIcon(ev.event_type) }}</div>
            <div class="event-content">
              <div class="event-label">{{ eventLabel(ev.event_type) }}</div>
              <div class="event-meta">
                {{ formatDate(ev.created_at) }}
                <span v-if="ev.amount_rub"> · {{ ev.amount_rub }} ₽</span>
                <span v-if="ev.expires_at"> · до {{ formatDate(ev.expires_at) }}</span>
              </div>
            </div>
            <div class="event-provider">{{ ev.provider === 'google_play' ? 'Play' : 'Веб' }}</div>
          </div>
        </div>
      </div>

      <p class="legal-note">
        Подписка автоматически продлевается каждый месяц. Отменить можно в любой момент через {{ providerLabel || 'магазин приложений' }}.
      </p>
    </template>
  </div>
</template>

<style scoped lang="scss">
.subscription-view {
  padding: 16px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.back-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  &:hover { background: var(--color-surface-hover); }
}

.header-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.loading-state {
  display: flex; justify-content: center; padding: 60px 0;
  color: var(--color-text-tertiary);
}

/* Status card */
.status-card {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: border-color 0.2s;

  &.active {
    border-color: #FFB703;
    background: linear-gradient(135deg, var(--color-surface), color-mix(in srgb, var(--color-surface) 95%, #FFB703));
  }
}

.status-icon-wrap {
  width: 52px; height: 52px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(255,183,3,0.15), rgba(251,133,0,0.15));
  color: #FB8500;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.status-content {
  display: flex; flex-direction: column; gap: 4px;
}

.status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 14px; font-weight: 700;
  color: var(--color-text-secondary);
  padding: 4px 10px;
  background: var(--color-surface-hover);
  border-radius: var(--radius-pill);
  width: fit-content;

  &.active {
    background: rgba(82, 183, 136, 0.15);
    color: #2D6A4F;
    body.dark-theme & { color: #52B788; }
  }
}

.status-detail {
  font-size: 13px; color: var(--color-text-secondary);
  &.expired { color: var(--color-error, #E76F51); }
}

.status-provider {
  font-size: 11px; color: var(--color-text-tertiary);
  display: flex; align-items: center; gap: 4px;
}

/* Features */
.features-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 16px;
}

.features-title {
  font-size: 13px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.feature-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 0;
  font-size: 14px; color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  &:last-child { border-bottom: none; }
}

.ficon { color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }

/* Messages */
.msg {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 14px; font-weight: 500;

  &.error {
    background: rgba(231, 111, 81, 0.1);
    border: 1px solid rgba(231, 111, 81, 0.3);
    color: #E76F51;
  }
  &.success {
    background: rgba(82, 183, 136, 0.1);
    border: 1px solid rgba(82, 183, 136, 0.3);
    color: #2D6A4F;
    body.dark-theme & { color: #52B788; }
  }
}

/* Actions */
.actions {
  display: flex; flex-direction: column; gap: 10px;
}

.btn-primary {
  width: 100%; padding: 16px;
  border-radius: var(--radius-lg); border: none;
  background: linear-gradient(135deg, #FFB703, #FB8500);
  color: white; font-weight: 700; font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(251, 133, 0, 0.3);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform 0.15s, box-shadow 0.15s;

  &:disabled { opacity: 0.7; cursor: not-allowed; }
  &:not(:disabled):active { transform: scale(0.98); box-shadow: 0 2px 6px rgba(251,133,0,0.2); }
}

.btn-secondary {
  width: 100%; padding: 13px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-weight: 600; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  &:hover { background: var(--color-surface-hover); }
}

.btn-ghost {
  width: 100%; padding: 11px;
  border-radius: var(--radius-lg); border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: 600; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:hover { color: var(--color-text-primary); }
}

.manage-hint {
  font-size: 13px; color: var(--color-text-secondary);
  text-align: center; padding: 4px 0;
}

/* History */
.history-section { display: flex; flex-direction: column; gap: 10px; }

.section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--color-text-secondary);
}

.events-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.event-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  &:last-child { border-bottom: none; }
}

.event-icon { font-size: 18px; flex-shrink: 0; width: 24px; text-align: center; }

.event-content { flex: 1; min-width: 0; }

.event-label {
  font-size: 14px; font-weight: 600; color: var(--color-text-primary);
}

.event-meta {
  font-size: 12px; color: var(--color-text-tertiary); margin-top: 2px;
}

.event-provider {
  font-size: 11px; font-weight: 700;
  color: var(--color-text-tertiary);
  background: var(--color-surface-hover);
  padding: 3px 8px; border-radius: var(--radius-pill);
  flex-shrink: 0;
}

.legal-note {
  font-size: 12px; color: var(--color-text-disabled);
  text-align: center; line-height: 1.5; margin: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
