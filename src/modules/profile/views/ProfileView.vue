<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, MapPin, Thermometer, ChevronRight, Sun, Moon, FileText, RefreshCw } from 'lucide-vue-next'
import { authStore } from '@/modules/auth/store/authStore'
import { useTheme } from '@/composables/useTheme'
import { supabase } from '@/api/supabase'
import { WeatherService } from '@/modules/weather/services/WeatherService'
import { changelog } from '@/data/changelog'

const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const user = computed(() => authStore.user.value)
const avatarLetter = computed(() => user.value?.email?.charAt(0).toUpperCase() || '?')
const appVersion = changelog[0]?.version || ''

// Settings
const region = ref('')
const tempSource = ref<'auto' | 'manual'>('auto')
const manualTemp = ref<number | null>(null)
const saving = ref(false)
const saved = ref(false)
const gpsLoading = ref(false)

// Stats
const treatmentCount = ref(0)

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
  }
}

async function loadStats() {
  if (!user.value) return
  const { count } = await supabase
    .from('treatment_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.value.id)
  treatmentCount.value = count || 0
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
    manual_temp: tempSource.value === 'manual' ? manualTemp.value : null
  }
  await supabase.from('user_settings').upsert(payload)
  saving.value = false
  saved.value = true
  setTimeout(() => saved.value = false, 2000)
}

async function logout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="profile-view">

    <!-- User card -->
    <div class="user-card">
      <div class="avatar">{{ avatarLetter }}</div>
      <div class="user-info">
        <div class="user-email">{{ user?.email || 'Гость' }}</div>
        <div class="user-stat">{{ treatmentCount }} записей в журнале</div>
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
      Выйти
    </button>

  </div>
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
</style>
