<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, MapPin, Thermometer, ChevronRight, Sun, Moon, FileText, RefreshCw, Bookmark, Sprout, ShieldAlert, BarChart3, Database, Users, Lock, Unlock, Crown } from 'lucide-vue-next'
import { authStore } from '@/modules/auth/store/authStore'
import { useTheme } from '@/composables/useTheme'
import { supabase } from '@/api/supabase'
import FpPremiumBadge from '@/shared/ui/FpPremiumBadge.vue'
import FpPaywallModal from '@/shared/ui/FpPaywallModal.vue'
import { WeatherService } from '@/modules/weather/services/WeatherService'
import { changelog } from '@/data/changelog'
import { useTipsState, TipOfTheDayModal } from '@/modules/tips'
import type { TipUiModel } from '@/modules/tips/adapters/TipsAdapter'
import { NotificationSettingsCard } from '@/modules/notifications'
import { PlantService } from '@/modules/plants/services/PlantService'

const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const user = computed(() => authStore.user.value)
const avatarLetter = computed(() => user.value?.is_anonymous ? '👻' : (user.value?.email?.charAt(0).toUpperCase() || '?'))
const appVersion = changelog[0]?.version || ''

function upgradeAccount() {
  router.push({ name: 'Login', query: { upgrade: 'true' } })
}

// Settings
const region = ref('')
const tempSource = ref<'auto' | 'manual'>('auto')
const manualTemp = ref<number | null>(null)
const communityVisible = ref(false)
const isPremium = ref(false)
const saving = ref(false)
const saved = ref(false)
const gpsLoading = ref(false)
const showPaywall = ref(false)

// Stats
const stats = ref({
  userPlantsCount: 0,
  treatmentsCount: 0,
  uniqueProductsCount: 0,
  totalPlantsBaseCount: 0
})
const treatmentCount = ref(0)
const activityData = ref<{ month: string; count: number }[]>([])

const maxBarValue = computed(() => {
  return Math.max(...activityData.value.map(d => d.count), 0)
})

// XP & Gardener Ranks
import { useProfileState } from '../state/useProfileState'
const { userXp, gardenerRank, xpProgressPercentage, loadXp } = useProfileState()

// Saved Tips
const { getSavedTips } = useTipsState()
const savedTips = computed(() => getSavedTips())
const selectedTip = ref<TipUiModel | null>(null)

onMounted(async () => {
  await loadSettings()
  await loadStats()
})

async function loadSettings() {
  if (!user.value) return
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.value.id)
    .single()
  if (data) {
    region.value = data.region || ''
    tempSource.value = data.temp_source || 'auto'
    manualTemp.value = data.manual_temp ?? null
    communityVisible.value = data.community_visible ?? false
    isPremium.value = data.is_premium ?? false
  }
}

async function loadStats() {
  if (!user.value) return
  try {
    const userPlants = await PlantService.getUserPlants()
    stats.value.userPlantsCount = userPlants.length

    const allPlants = await PlantService.getAll()
    stats.value.totalPlantsBaseCount = allPlants.length

    const { data: treatments, count } = await supabase
      .from('treatment_log')
      .select('product, treated_at', { count: 'exact' })
      .eq('user_id', user.value.id)

    stats.value.treatmentsCount = count || 0
    treatmentCount.value = count || 0

    if (treatments) {
      const products = treatments
        .map(t => t.product)
        .filter((p): p is string => !!p && p.trim() !== '')
      stats.value.uniqueProductsCount = new Set(products).size
    }

    const last6Months: { key: string; label: string; count: number }[] = []
    const monthLabels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
    
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const monthIdx = d.getMonth()
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`
      const label = monthLabels[monthIdx]
      last6Months.push({ key, label, count: 0 })
    }

    if (treatments) {
      treatments.forEach(t => {
        if (!t.treated_at) return
        const monthKey = t.treated_at.substring(0, 7)
        const found = last6Months.find(m => m.key === monthKey)
        if (found) {
          found.count++
        }
      })
    }

    activityData.value = last6Months.map(m => ({ month: m.label, count: m.count }))
    loadXp()
  } catch (e) {
    console.error('Ошибка загрузки статистики:', e)
  }
}

async function detectLocation() {
  gpsLoading.value = true
  try {
    const weather = await WeatherService.getWithCache()
    region.value = weather.city
    await saveSettings()
  } catch (e) {
    console.error(e)
  } finally {
    gpsLoading.value = false
  }
}

async function saveSettings() {
  if (!user.value) return
  saving.value = true
  const payload = {
    user_id: user.value.id,
    region: region.value,
    temp_source: tempSource.value,
    manual_temp: tempSource.value === 'manual' ? manualTemp.value : null,
    community_visible: communityVisible.value,
    is_premium: isPremium.value
  }
  await supabase.from('user_settings').upsert(payload)
  saving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

async function togglePremiumDemo() {
  isPremium.value = !isPremium.value
  // Если премиум выключен, принудительно делаем видимым в сообществе
  if (!isPremium.value) {
    communityVisible.value = true
  }
  await saveSettings()
}

function handlePrivacyToggleClick(e: Event) {
  if (!isPremium.value) {
    e.preventDefault()
    showPaywall.value = true
  }
}

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="profile-view">

    <!-- User card -->
    <div class="user-card" :class="{ 'demo-card': user?.is_anonymous }">
      <div class="avatar">{{ avatarLetter }}</div>
      <div class="user-info">
        <div class="user-email">{{ user?.is_anonymous ? 'Демо-режим' : (user?.email || 'Гость') }}</div>
        <div class="demo-warning" v-if="user?.is_anonymous">
          Вы не зарегистрированы. 
          <a href="#" @click.prevent="upgradeAccount">Создать аккаунт</a>, чтобы сохранить грядки.
        </div>
        
        <div class="gardener-rank-row" v-if="!user?.is_anonymous">
          <span class="gardener-rank-badge" :style="{ backgroundColor: gardenerRank.color + '15', color: gardenerRank.color }">
            {{ gardenerRank.emoji }} {{ gardenerRank.rank }}
          </span>
          <span class="gardener-xp-value">{{ userXp }} XP</span>
        </div>

        <!-- Прогресс-бар XP -->
        <div class="xp-progress-container" v-if="userXp < 180">
          <div class="xp-progress-bar">
            <div class="xp-progress-fill" :style="{ width: `${xpProgressPercentage}%`, backgroundColor: gardenerRank.color }"></div>
          </div>
          <div class="xp-progress-labels">
            <span>До следующего ранга: осталось {{ gardenerRank.nextXp - userXp }} XP</span>
          </div>
        </div>
        <div class="xp-progress-container" v-else>
          <div class="xp-progress-labels">
            <span :style="{ color: gardenerRank.color, fontWeight: '700' }">🏆 Достигнут высший ранг!</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Сохранённые советы -->
    <div class="section" v-if="savedTips.length > 0">
      <div class="section-title">
        <Bookmark :size="14" style="margin-right: 4px; display: inline-block; vertical-align: middle;" />
        Сохранённые советы ({{ savedTips.length }})
      </div>
      <div class="saved-tips-grid">
        <div v-for="tip in savedTips" :key="tip.id" class="saved-tip-card" @click="selectedTip = tip">
          <span class="tip-emoji">{{ tip.emoji }}</span>
          <div class="tip-info">
            <div class="tip-cat">{{ tip.categoryBadge }}</div>
            <div class="tip-title">{{ tip.title }}</div>
          </div>
          <ChevronRight :size="16" class="chevron" />
        </div>
      </div>
    </div>

    <!-- Статистика -->
    <div class="section">
      <div class="section-title">
        <BarChart3 :size="14" style="margin-right: 4px; display: inline-block; vertical-align: middle;" />
        Мой сад в цифрах
      </div>
      <div class="stats-grid">
        <div class="stat-tile">
          <div class="tile-icon sprout">
            <Sprout :size="20" />
          </div>
          <div class="tile-content">
            <div class="tile-num">{{ stats.userPlantsCount }}</div>
            <div class="tile-label">Растений в огороде</div>
          </div>
        </div>

        <div class="stat-tile">
          <div class="tile-icon journal">
            <FileText :size="20" />
          </div>
          <div class="tile-content">
            <div class="tile-num">{{ stats.treatmentsCount }}</div>
            <div class="tile-label">Записей ухода</div>
          </div>
        </div>

        <div class="stat-tile">
          <div class="tile-icon product">
            <ShieldAlert :size="20" />
          </div>
          <div class="tile-content">
            <div class="tile-num">{{ stats.uniqueProductsCount }}</div>
            <div class="tile-label">Препаратов применено</div>
          </div>
        </div>

        <div class="stat-tile">
          <div class="tile-icon database">
            <Database :size="20" />
          </div>
          <div class="tile-content">
            <div class="tile-num">{{ stats.totalPlantsBaseCount }}</div>
            <div class="tile-label">Культур в энциклопедии</div>
          </div>
        </div>
      </div>

      <!-- График агро-активности -->
      <div v-if="stats.treatmentsCount > 0" class="activity-chart-wrapper">
        <div class="activity-chart-title">Интенсивность ухода</div>
        <div class="activity-chart-box">
          <div class="chart-bars">
            <div v-for="bar in activityData" :key="bar.month" class="chart-bar-col">
              <span class="bar-count-tooltip" :class="{ visible: bar.count > 0 }">{{ bar.count }}</span>
              <div class="bar-rail">
                <div 
                  class="bar-fill-indicator" 
                  :style="{ height: `${maxBarValue > 0 ? (bar.count / maxBarValue) * 100 : 0}%` }"
                  :class="{ active: bar.count > 0 }"
                ></div>
              </div>
              <span class="bar-month-label">{{ bar.month }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings -->
    <div class="section">
      <div class="section-title">Местоположение и погода</div>

      <div class="settings-card">
        <!-- Region -->
        <div class="setting-row">
          <div class="setting-label">
            <MapPin :size="16" class="setting-icon" />
            Регион
          </div>
          <div class="setting-control region-control">
            <input
              v-model="region"
              class="setting-input"
              placeholder="Киев, Москва..."
              @blur="saveSettings"
            />
            <button class="gps-btn" @click="detectLocation" :disabled="gpsLoading">
              <RefreshCw :size="14" :class="{ spinning: gpsLoading }" />
            </button>
          </div>
        </div>

        <div class="divider" />

        <!-- Temp source -->
        <div class="setting-row">
          <div class="setting-label">
            <Thermometer :size="16" class="setting-icon" />
            Температура
          </div>
          <div class="setting-control">
            <div class="toggle-group">
              <button
                class="toggle-btn"
                :class="{ active: tempSource === 'auto' }"
                @click="tempSource = 'auto'; saveSettings()"
              >Авто</button>
              <button
                class="toggle-btn"
                :class="{ active: tempSource === 'manual' }"
                @click="tempSource = 'manual'"
              >Вручную</button>
            </div>
          </div>
        </div>

        <div v-if="tempSource === 'manual'" class="manual-temp-row">
          <input
            v-model.number="manualTemp"
            type="number"
            class="setting-input temp-input"
            placeholder="22"
            @blur="saveSettings"
          />
          <span class="temp-unit">°C</span>
        </div>
      </div>

      <div v-if="saved" class="saved-badge">✓ Сохранено</div>
    </div>

    <!-- Сообщество -->
    <div class="section">
      <div class="section-title">
        <Users :size="14" style="margin-right: 4px; display: inline-block; vertical-align: middle;" />
        Сообщество
      </div>
      <div class="settings-card">
        <div class="setting-row">
          <div class="setting-label">
            Показывать мою активность
            <FpPremiumBadge v-if="!isPremium" style="margin-left: 8px;" />
          </div>
          <div class="setting-control" @click.capture="handlePrivacyToggleClick">
            <label class="toggle-switch" :class="{ disabled: !isPremium }">
              <input type="checkbox" v-model="communityVisible" @change="saveSettings" :disabled="!isPremium" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="community-hint">
          <span v-if="!isPremium" style="color: var(--color-error); font-weight: 600;">
            В базовой версии все ваши действия попадают в общую ленту. Активируйте Premium, чтобы сделать профиль приватным.
          </span>
          <span v-else>
            Когда включено, ваши записи журнала будут видны другим огородникам в ленте «Сообщество».
          </span>
        </div>
        
        <!-- Кнопка-заглушка для тестирования Премиум -->
        <div class="setting-row clickable" @click="togglePremiumDemo">
          <div class="setting-label">
            <Crown :size="16" :style="{ color: isPremium ? 'var(--color-primary)' : 'var(--color-text-secondary)' }" />
            {{ isPremium ? 'Premium активен (Выключить)' : 'Активировать Premium (Демо)' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Уведомления -->
    <div class="section">
      <div class="section-title">Уведомления</div>
      <NotificationSettingsCard />
    </div>

    <!-- Appearance -->
    <div class="section">
      <div class="section-title">Внешний вид</div>
      <div class="settings-card">
        <div class="setting-row clickable" @click="toggleTheme">
          <div class="setting-label">
            <component :is="isDark ? Sun : Moon" :size="16" class="setting-icon" />
            {{ isDark ? 'Светлая тема' : 'Тёмная тема' }}
          </div>
          <ChevronRight :size="16" class="chevron" />
        </div>
      </div>
    </div>

    <!-- App info -->
    <div class="section">
      <div class="section-title">Приложение</div>
      <div class="settings-card">
        <div class="setting-row clickable" @click="router.push('/changelog')">
          <div class="setting-label">
            <FileText :size="16" class="setting-icon" />
            Что нового
          </div>
          <div class="setting-right">
            <span class="version-text">v{{ appVersion }}</span>
            <ChevronRight :size="16" class="chevron" />
          </div>
        </div>
      </div>
    </div>

    <!-- Logout -->
    <button class="logout-btn" @click="logout">
      <LogOut :size="18" />
      {{ user?.is_anonymous ? 'Выйти (данные будут потеряны)' : 'Выйти' }}
    </button>

    <!-- Модальное окно просмотра совета -->
    <TipOfTheDayModal
      v-if="selectedTip"
      :tip="selectedTip"
      :model-value="!!selectedTip"
      @update:model-value="selectedTip = null"
      @next="selectedTip = null"
    />

  </div>
  <!-- Paywall Modal -->
  <FpPaywallModal v-model="showPaywall" feature-name="Приватность профиля" />
</template>

<style scoped lang="scss">
.profile-view {
  padding: 16px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card {
  background: var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--color-on-primary);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  flex-shrink: 0;
}

.user-info { flex: 1; min-width: 0; }
.user-email { font-size: 16px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-stat { font-size: 13px; opacity: 0.75; }

.demo-card {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.demo-warning {
  font-size: 12px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  
  a {
    color: white;
    font-weight: 700;
    text-decoration: underline;
  }
}

.section {}
.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.settings-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 12px;
  &.clickable { cursor: pointer; &:active { background: var(--color-surface-hover); } }
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.setting-icon { color: var(--color-primary); flex-shrink: 0; }

.setting-control { display: flex; align-items: center; gap: 8px; }

.region-control { flex: 1; justify-content: flex-end; }

.setting-input {
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  font-size: 13px;
  color: var(--color-text-primary);
  outline: none;
  width: 120px;
  text-align: right;
  &:focus { border-color: var(--color-primary); }
  &.temp-input { width: 70px; }
}

.gps-btn {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 7px;
  cursor: pointer;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.8s linear infinite; }

.toggle-group {
  display: flex;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px;
  gap: 2px;
}

.toggle-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  &.active { background: var(--color-primary); color: var(--color-on-primary); }
}

.manual-temp-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 14px;
}

.temp-unit { font-size: 14px; color: var(--color-text-secondary); }

.divider { height: 1px; background: var(--color-border); margin: 0; }

.setting-right { display: flex; align-items: center; gap: 8px; }
.version-text { font-size: 12px; color: var(--color-text-tertiary); }
.chevron { color: var(--color-text-disabled); }

.saved-badge {
  font-size: 12px;
  color: var(--color-success);
  font-weight: 600;
  padding: 4px 0;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-error);
  cursor: pointer;
  margin-top: 4px;
  &:hover { background: color-mix(in srgb, var(--color-error) 5%, transparent); }
}

/* ── SAVED TIPS CARDS ── */
.saved-tips-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.saved-tip-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    transform: translateY(-1px);
    border-color: var(--color-primary);
    background: var(--color-surface-hover);

    .chevron { transform: translateX(2px); color: var(--color-primary); }
  }
}

.tip-emoji {
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tip-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tip-cat {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── STATS GRID ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-tile {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: transform 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--color-primary);
  }
}

.tile-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.sprout {
    background: rgba(45, 106, 79, 0.1);
    color: #2d6a4f;
  }

  &.journal {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
  }

  &.product {
    background: rgba(217, 119, 6, 0.1);
    color: #d97706;
  }

  &.database {
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
  }
}

.tile-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tile-num {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.tile-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

/* ── ACTIVITY CHART ── */
.activity-chart-wrapper {
  margin-top: 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.activity-chart-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 24px;
  text-align: left;
}

.activity-chart-box {
  width: 100%;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100px;
  padding: 0 6px;
}

.chart-bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.bar-count-tooltip {
  position: absolute;
  top: -20px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--color-text-disabled);
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.25s ease;

  &.visible {
    opacity: 0.7;
    transform: translateY(0);
  }
}

.bar-rail {
  width: 12px;
  height: 70px;
  background: var(--color-surface-hover);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.bar-fill-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  border-radius: 6px;
  background: var(--color-border);
  transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s;

  &.active {
    background: linear-gradient(180deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 85%, black) 100%);
  }
}

.bar-month-label {
  margin-top: 8px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* ── Toggle switch ── */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-border);
  border-radius: 24px;
  transition: background 0.25s;

  &::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: transform 0.25s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.community-hint {
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-tertiary);
  border-top: 1px solid var(--color-border);
}
</style>
