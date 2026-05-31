<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft, Users, MapPin, Sparkles, MessageCircle, Send } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { SocialService, type SocialActivity, type SocialComment } from '@/modules/social/services/SocialService'
import FpPullToRefresh from '@/design-system/components/FpPullToRefresh.vue'
import FpBottomSheetModal from '@/shared/ui/FpBottomSheetModal.vue'

const router = useRouter()
const activities = ref<SocialActivity[]>([])
const loading = ref(true)

// Модалка комментариев
const selectedActivity = ref<SocialActivity | null>(null)
const comments = ref<SocialComment[]>([])
const newCommentText = ref('')
const loadingComments = ref(false)
const sendingComment = ref(false)

async function loadFeed(force = false) {
  loading.value = true
  try {
    activities.value = await SocialService.getFeed(15, force, (newData) => {
      activities.value = newData
    })
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
  await loadFeed(true)
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

async function openComments(act: SocialActivity) {
  selectedActivity.value = act
  comments.value = []
  loadingComments.value = true
  
  try {
    comments.value = await SocialService.getComments(act.id)
  } catch (e) {
    console.error(e)
  } finally {
    loadingComments.value = false
  }
}

async function sendComment() {
  const text = newCommentText.value.trim()
  const act = selectedActivity.value
  if (!text || !act || sendingComment.value) return
  
  sendingComment.value = true
  
  // Optimistic update
  const tempId = `temp_${Date.now()}`
  comments.value.push({
    id: tempId,
    activityId: act.id,
    userId: 'me',
    userName: 'Вы',
    text: text,
    timeAgo: 'только что'
  })
  
  act.commentsCount++
  newCommentText.value = ''
  
  try {
    const realComment = await SocialService.addComment(act.id, text)
    if (realComment) {
      // Replace temp with real
      const idx = comments.value.findIndex(c => c.id === tempId)
      if (idx !== -1) comments.value[idx] = realComment
    }
  } catch (e) {
    console.error(e)
    act.commentsCount--
    comments.value = comments.value.filter(c => c.id !== tempId)
  } finally {
    sendingComment.value = false
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
            <button class="action-btn" @click="openComments(act)">
              <MessageCircle :size="14" />
              <span>{{ act.commentsCount || 0 }}</span>
            </button>
            <button class="like-btn" :class="{ 'liked': act.isLikedByMe }" @click="likeActivity(act)">
              <Sparkles :size="14" :fill="act.isLikedByMe ? 'currentColor' : 'none'" />
              <span>{{ act.isLikedByMe ? 'Вы оценили' : 'Полезно' }} ({{ act.likes }})</span>
            </button>
          </div>
        </div>
        
        <div v-if="activities.length === 0" class="feed-empty">
          <p>В вашем регионе пока нет активностей. Будьте первыми!</p>
        </div>
        <div v-else class="feed-end">
          <p>Вы досмотрели до конца ленты.</p>
        </div>
      </div>
    </div>
  </FpPullToRefresh>

  <!-- Модальное окно комментариев -->
  <FpBottomSheetModal 
    :model-value="!!selectedActivity" 
    @update:model-value="!$event && (selectedActivity = null)"
    :with-glow="true"
  >
    <template #header>
      <h3 class="modal-title">Комментарии</h3>
    </template>
    
    <div class="comments-container">
      <div v-if="loadingComments" class="comments-loading">
        Загрузка...
      </div>
      <div v-else-if="comments.length === 0" class="comments-empty">
        Пока нет комментариев. Будьте первым!
      </div>
      <div v-else class="comments-list">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-avatar">{{ comment.userName[0] }}</div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.userName }}</span>
              <span class="comment-time">{{ comment.timeAgo }}</span>
            </div>
            <div class="comment-text">{{ comment.text }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="comment-input-area">
        <input 
          v-model="newCommentText" 
          type="text" 
          placeholder="Написать комментарий..." 
          class="comment-input"
          @keyup.enter="sendComment"
          :disabled="sendingComment"
        />
        <button 
          class="send-btn" 
          :disabled="!newCommentText.trim() || sendingComment"
          @click="sendComment"
        >
          <Send :size="18" />
        </button>
      </div>
    </template>
  </FpBottomSheetModal>
</template>

<style scoped lang="scss">
.community-view {
  padding: 16px 16px 32px;
  min-height: 100vh;
  min-height: 100dvh;
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
  gap: 8px;
}

.action-btn,
.like-btn {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
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
}

.action-btn {
  color: var(--color-text-secondary);
}

.like-btn {
  color: var(--color-primary);
  &.liked {
    background: rgba(45, 106, 79, 0.15);
  }
}

/* Comments Modal */
.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.comments-container {
  min-height: 200px;
  max-height: 50vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.comments-loading,
.comments-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-disabled);
  font-size: 14px;
  padding: 32px 0;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  background: var(--color-surface-hover);
  padding: 10px 14px;
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.comment-time {
  font-size: 11px;
  color: var(--color-text-disabled);
}

.comment-text {
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-text-secondary);
  word-break: break-word;
}

.comment-input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 4px 4px 4px 16px;
}

.comment-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--color-text-primary);
  
  &::placeholder {
    color: var(--color-text-disabled);
  }
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.9);
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

.feed-end,
.feed-empty {
  text-align: center;
  padding: 24px 0;
  color: var(--color-text-disabled);
  font-size: 14px;
}
</style>
