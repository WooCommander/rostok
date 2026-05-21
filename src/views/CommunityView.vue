<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft, Users, MapPin, Sparkles } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { SocialService, type SocialActivity } from '@/modules/social/services/SocialService'
import FpPullToRefresh from '@/design-system/components/FpPullToRefresh.vue'

const router = useRouter()
const activities = ref<SocialActivity[]>([])
const loading = ref(true)

async function loadFeed() {
  loading.value = true
  try {
    activities.value = await SocialService.getFeed(15)
  } catch (err) {
    console.error('Failed to load social feed:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFeed()
})

async function onRefresh(done: () => void) {
  await loadFeed()
  done()
}

async function likeActivity(act: SocialActivity) {
  // Optmistic UI update
  const originalLikes = act.likes
  const wasLiked = act.isLikedByMe
  
  if (act.isLikedByMe) {
    act.likes--
    act.isLikedByMe = false
  } else {
    act.likes++
    act.isLikedByMe = true
  }

  try {
    const isNowLiked = await SocialService.toggleLike(act.id)
    act.isLikedByMe = isNowLiked
  } catch (e) {
    // Revert on error
    act.likes = originalLikes
    act.isLikedByMe = wasLiked
  }
}
</script>

<template>
  <FpPullToRefresh @refresh="onRefresh">
    <div class="community-view">
      <div class="page-header">
        <button class="back-btn" @click="router.back()">
          <ArrowLeft :size="20" />
        </button>
        <h1 class="header-title">Сообщество</h1>
      </div>

      <div class="header-desc">
        <Users :size="20" class="desc-icon" />
        <p>Узнайте, что делают другие огородники в вашем регионе прямо сейчас!</p>
      </div>

      <div v-if="loading" class="feed-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-item"></div>
      </div>
      
      <div v-else class="feed-list">
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
            <button class="like-btn" :class="{ 'liked': act.isLikedByMe }" @click="likeActivity(act)">
              <Sparkles :size="14" :fill="act.isLikedByMe ? 'currentColor' : 'none'" />
              <span>{{ act.isLikedByMe ? 'Вы оценили' : 'Полезно' }} ({{ act.likes }})</span>
            </button>
          </div>
        </div>
        
        <div class="feed-end">
          <p>Вы досмотрели до конца ленты.</p>
        </div>
      </div>
    </div>
  </FpPullToRefresh>
</template>

<style scoped lang="scss">
.community-view {
  padding: 16px 16px 32px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.back-btn {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: var(--color-surface-hover); }
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.header-desc {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(45, 106, 79, 0.08);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 24px;
  
  .desc-icon {
    color: var(--color-primary);
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    color: var(--color-text-secondary);
  }
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.social-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
}

.social-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary-subtle, rgba(45, 106, 79, 0.15));
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.user-loc {
  font-size: 12px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-ago {
  font-size: 12px;
  color: var(--color-text-disabled);
  white-space: nowrap;
}

.social-content {
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
  
  strong {
    color: var(--color-text-primary);
    font-weight: 600;
  }
}

.social-footer {
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.like-btn {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
  
  &:hover {
    background: rgba(45, 106, 79, 0.08);
  }
  &:active {
    transform: scale(0.95);
  }
  
  &.liked {
    background: rgba(45, 106, 79, 0.15);
  }
}

.feed-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  height: 140px;
  background: var(--color-border);
  border-radius: var(--radius-lg);
  opacity: 0.5;
}

.feed-end {
  text-align: center;
  padding: 24px 0;
  color: var(--color-text-disabled);
  font-size: 14px;
}
</style>
