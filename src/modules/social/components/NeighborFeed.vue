<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Users, MapPin, Sparkles, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { SocialService, type SocialActivity } from '../services/SocialService'

const router = useRouter()
const activities = ref<SocialActivity[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    activities.value = await SocialService.getFeed(4)
  } catch (err) {
    console.error('Failed to load social feed:', err)
  } finally {
    loading.value = false
  }
})

function likeActivity(act: SocialActivity) {
  act.likes++
}
</script>

<template>
  <section class="section social-feed-section">
    <div class="section-title-row">
      <div class="section-title">
        <Users :size="16" />
        Огородники рядом
      </div>
      <button class="view-all-btn" @click="router.push('/community')">
        Все <ChevronRight :size="14" />
      </button>
    </div>
    
    <div v-if="loading" class="feed-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-item"></div>
    </div>
    
    <div v-else class="social-feed-scroll">
      <div class="feed-track">
        <div v-for="act in activities" :key="act.id" class="social-card">
          <div class="social-card-header">
            <div class="user-avatar">{{ act.userName[0] }}</div>
            <div class="user-info">
              <span class="user-name">{{ act.userName }}</span>
              <span class="user-loc"><MapPin :size="10" /> {{ act.location }}</span>
            </div>
            <div class="time-ago">{{ act.timeAgo }}</div>
          </div>
          <div class="social-content">
            Только что {{ act.action }} <strong>{{ act.emoji }} {{ act.plant }}</strong>
          </div>
          <div class="social-footer">
            <button class="like-btn" @click="likeActivity(act)">
              <Sparkles :size="14" />
              <span>Полезно ({{ act.likes }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  &:active { background: rgba(45, 106, 79, 0.1); }
}

.social-feed-scroll {
  overflow-x: auto;
  padding-bottom: 12px;
  margin: 0 -16px;
  padding-left: 16px;
  padding-right: 16px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.feed-track {
  display: inline-flex;
  gap: 12px;
}

.social-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px;
  min-width: 260px;
  max-width: 280px;
  box-shadow: var(--shadow-sm);
  scroll-snap-align: start;
}

.social-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-subtle, rgba(45, 106, 79, 0.15));
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.user-loc {
  font-size: 11px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: 2px;
}

.time-ago {
  font-size: 11px;
  color: var(--color-text-disabled);
  white-space: nowrap;
}

.social-content {
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  
  strong {
    color: var(--color-text-primary);
    font-weight: 600;
  }
}

.social-footer {
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.like-btn {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
  
  &:hover {
    background: rgba(45, 106, 79, 0.08);
  }
  &:active {
    transform: scale(0.95);
  }
}

.feed-skeleton {
  display: flex;
  gap: 12px;
  overflow: hidden;
}

.skeleton-item {
  min-width: 260px;
  height: 120px;
  background: var(--color-border);
  border-radius: var(--radius-lg);
  opacity: 0.5;
}
</style>
