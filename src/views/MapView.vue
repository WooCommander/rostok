<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Sparkles, Loader2, Users } from 'lucide-vue-next'
import { supabase } from '@/api/supabase'
import { SocialService, type SocialActivity } from '@/modules/social/services/SocialService'
import FpPaywallModal from '@/shared/ui/FpPaywallModal.vue'

const router = useRouter()

const mapContainer = ref<HTMLElement | null>(null)
const loading = ref(true)
const isPremium = ref(false)
const showPaywall = ref(false)
const activities = ref<SocialActivity[]>([])
const myPosition = ref<{ lat: number; lng: number } | null>(null)
const markerCount = ref(0)

let mapInstance: import('leaflet').Map | null = null

const ACTION_LABELS: Record<string, string> = {
  watering: 'поливает',
  fertilizing: 'подкармливает',
  spraying: 'опрыскивает',
  pruning: 'обрезает',
  harvesting: 'собирает урожай',
  planting: 'высаживает',
  weeding: 'пропалывает',
  other: 'ухаживает за'
}

onMounted(async () => {
  // Проверяем premium
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('is_premium')
      .eq('user_id', user.id)
      .single()
    isPremium.value = settings?.is_premium ?? false
  }

  if (!isPremium.value) {
    loading.value = false
    showPaywall.value = true
    return
  }

  await initMap()
})

onUnmounted(() => {
  mapInstance?.remove()
  mapInstance = null
})

async function initMap() {
  loading.value = true

  // Получаем свою геопозицию
  try {
    const { Geolocation } = await import('@capacitor/geolocation')
    const pos = await Geolocation.getCurrentPosition({ timeout: 8000, enableHighAccuracy: false })
    myPosition.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
  } catch { /* без геолокации показываем всю карту */ }

  // Загружаем активности
  activities.value = await SocialService.getMapActivities(200)

  // Инициализируем Leaflet
  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  if (!mapContainer.value) return

  const center = myPosition.value
    ? [myPosition.value.lat, myPosition.value.lng] as [number, number]
    : [55.75, 37.62] as [number, number] // Москва по умолчанию

  const zoom = myPosition.value ? 11 : 5

  mapInstance = L.map(mapContainer.value, {
    center,
    zoom,
    zoomControl: true,
    attributionControl: true
  })

  // OpenStreetMap тайлы (бесплатно, без ключа)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(mapInstance)

  // Маркер своей позиции
  if (myPosition.value) {
    const myIcon = L.divIcon({
      html: `<div class="my-marker"><div class="my-pulse"></div>📍</div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    })
    L.marker([myPosition.value.lat, myPosition.value.lng], { icon: myIcon })
      .bindPopup('<b>Вы здесь</b>')
      .addTo(mapInstance!)
  }

  // Маркеры активностей
  let count = 0
  for (const act of activities.value) {
    if (act.lat == null || act.lng == null) continue

    const actionLabel = ACTION_LABELS[act.action] || act.action
    const timeAgo = act.timeAgo

    const icon = L.divIcon({
      html: `<div class="activity-marker" title="${act.userName}: ${actionLabel} ${act.plant}">
               <span class="act-emoji">${act.emoji}</span>
             </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })

    const popup = `
      <div class="map-popup">
        <div class="popup-header">
          <span class="popup-avatar">${act.userName[0]}</span>
          <div>
            <div class="popup-name">${act.userName}</div>
            <div class="popup-loc">${act.location}</div>
          </div>
        </div>
        <div class="popup-body">
          ${actionLabel} <strong>${act.emoji} ${act.plant}</strong>
        </div>
        <div class="popup-time">${timeAgo}</div>
      </div>`

    L.marker([act.lat, act.lng], { icon })
      .bindPopup(popup, { maxWidth: 240 })
      .addTo(mapInstance!)

    count++
  }

  markerCount.value = count
  loading.value = false

  await nextTick()
  mapInstance?.invalidateSize()
}
</script>

<template>
  <div class="map-view">
    <!-- Header -->
    <div class="page-header">
      <button class="back-btn" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <div class="header-info">
        <h1 class="header-title">Огородники рядом</h1>
        <span v-if="markerCount > 0" class="header-count">
          <Users :size="12" /> {{ markerCount }} активностей за 30 дней
        </span>
      </div>
      <span class="premium-chip">
        <Sparkles :size="12" /> Premium
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="map-loading">
      <Loader2 :size="32" class="spin" />
      <p>Загружаем огородников…</p>
    </div>

    <!-- Map container -->
    <div ref="mapContainer" class="map-container" :class="{ hidden: loading || !isPremium }" />

    <!-- Legend -->
    <div v-if="!loading && isPremium" class="map-legend">
      <div class="legend-item">
        <span>📍</span> Вы
      </div>
      <div class="legend-item">
        <div class="legend-dot"></div> Активность огородника
      </div>
      <div class="legend-note">Данные за последние 30 дней · Координаты округлены</div>
    </div>

    <!-- Paywall -->
    <FpPaywallModal
      v-model="showPaywall"
      feature-name="Карта огородников"
      @purchased="isPremium = true; showPaywall = false; initMap()"
    />
  </div>
</template>

<style scoped lang="scss">
.map-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--color-background);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  z-index: 10;
}

.back-btn {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.header-count {
  font-size: 11px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: 3px;
}

.premium-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(255,183,3,0.15), rgba(251,133,0,0.15));
  border: 1px solid rgba(251,133,0,0.3);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #FB8500;
  flex-shrink: 0;
}

.map-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-secondary);

  p { font-size: 14px; }
}

.map-container {
  flex: 1;
  width: 100%;
  min-height: 0;

  &.hidden { display: none; }
}

.map-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.legend-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.legend-note {
  font-size: 10px;
  color: var(--color-text-disabled);
  margin-left: auto;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>

<!-- Глобальные стили для Leaflet-маркеров (не scoped) -->
<style>
.activity-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 2px solid #2D6A4F;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  cursor: pointer;
  transition: transform 0.15s;
}
.activity-marker:hover { transform: scale(1.15); }
.act-emoji { font-size: 20px; line-height: 1; }

.my-marker {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  position: relative;
}
.my-pulse {
  position: absolute;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(45,106,79,0.25);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.5); opacity: 0; }
}

.map-popup {
  font-family: inherit;
  min-width: 180px;
}
.popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.popup-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: rgba(45,106,79,0.15);
  color: #2D6A4F;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}
.popup-name { font-size: 13px; font-weight: 700; color: #111; }
.popup-loc { font-size: 11px; color: #888; }
.popup-body { font-size: 13px; color: #333; margin-bottom: 4px; }
.popup-time { font-size: 11px; color: #aaa; }
</style>
