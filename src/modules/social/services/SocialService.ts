import { supabase } from '@/api/supabase'
import { Preferences } from '@capacitor/preferences'

export interface SocialActivity {
  id: string
  userName: string
  action: string
  plant: string
  emoji: string
  timeAgo: string
  likes: number
  commentsCount: number
  location: string
  createdAt: string
  isReal?: boolean
  isLikedByMe?: boolean
}

export interface SocialComment {
  id: string
  activityId: string
  userId: string
  userName: string
  text: string
  timeAgo: string
}

interface CommunityRow {
  id: string
  user_id: string
  display_name: string
  action_type: string
  plant_name: string
  plant_emoji: string
  city: string | null
  location_label: string | null
  likes_count: number
  comments_count: number
  created_at: string
  is_liked_by_me?: boolean
}

const ACTION_LABELS: Record<string, string> = {
  watering: 'поливает',
  fertilizing: 'подкармливает',
  spraying: 'опрыскивает от вредителей',
  pruning: 'проводит обрезку',
  harvesting: 'собирает урожай',
  planting: 'высаживает рассаду',
  weeding: 'пропалывает',
  other: 'ухаживает за'
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMin = Math.round((now - then) / 60000)
  
  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} мин назад`
  
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ч назад`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} дн назад`
}

function mapRowToActivity(row: CommunityRow): SocialActivity {
  return {
    id: row.id,
    userName: row.display_name,
    action: ACTION_LABELS[row.action_type] || row.action_type,
    plant: row.plant_name,
    emoji: row.plant_emoji,
    timeAgo: formatTimeAgo(row.created_at),
    likes: row.likes_count || 0,
    commentsCount: row.comments_count || 0,
    location: row.city ? `г. ${row.city}` : (row.location_label || 'В вашем регионе'),
    createdAt: row.created_at,
    isReal: true,
    isLikedByMe: row.is_liked_by_me || false
  }
}

let feedCache: {
  data: SocialActivity[];
  timestamp: number;
} | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const PREF_CACHE_KEY = 'social_feed_cache'

export const SocialService = {
  /**
   * Получить ленту сообщества.
   * Отключена генерация мок-данных для полноценного тестирования.
   */
  async getFeed(count: number = 10, forceRefresh: boolean = false, onBackgroundUpdate?: (data: SocialActivity[]) => void): Promise<SocialActivity[]> {
    if (!forceRefresh) {
      // 1. Try In-Memory Cache first
      if (feedCache && feedCache.data.length >= count) {
        if (Date.now() - feedCache.timestamp < CACHE_TTL) {
          return feedCache.data.slice(0, count);
        } else if (onBackgroundUpdate) {
          // Trigger background update if TTL expired
          this.fetchRealFeed(count).then(newData => onBackgroundUpdate(newData));
          return feedCache.data.slice(0, count);
        }
      }
      
      // 2. Try Preferences Cache (Cold start)
      if (!feedCache) {
        try {
          const { value } = await Preferences.get({ key: PREF_CACHE_KEY })
          if (value) {
            const parsed = JSON.parse(value)
            if (parsed && parsed.data && parsed.data.length > 0) {
              feedCache = parsed
              if (feedCache && feedCache.data.length >= count) {
                // Return immediately, but trigger background fetch
                if (onBackgroundUpdate) {
                  this.fetchRealFeed(count).then(newData => onBackgroundUpdate(newData));
                }
                return feedCache.data.slice(0, count);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to load feed cache from Preferences', e)
        }
      }
    }

    return await this.fetchRealFeed(count)
  },

  /**
   * Приватный метод для реального запроса ленты с сервера
   */
  async fetchMoreFeed(beforeCursor: string, count: number = 15): Promise<SocialActivity[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('community_activities')
        .select('*')
        .not('display_name', 'ilike', '%(Демо)%')
        .lt('created_at', beforeCursor)
        .order('created_at', { ascending: false })
        .limit(count)

      if (error || !data || data.length === 0) return []

      if (user) {
        const activityIds = data.map(d => d.id)
        const { data: likesData } = await supabase
          .from('community_likes')
          .select('activity_id')
          .eq('user_id', user.id)
          .in('activity_id', activityIds)

        const likedSet = new Set(likesData?.map(l => l.activity_id) || [])
        return (data as CommunityRow[]).map(row => {
          row.is_liked_by_me = likedSet.has(row.id)
          return mapRowToActivity(row)
        })
      }

      return (data as CommunityRow[]).map(mapRowToActivity)
    } catch {
      return []
    }
  },

  async fetchRealFeed(count: number): Promise<SocialActivity[]> {
    let realActivities: SocialActivity[] = []
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('community_activities')
        .select('*')
        .not('display_name', 'ilike', '%(Демо)%')
        .order('created_at', { ascending: false })
        .limit(count)
      
      if (!error && data && data.length > 0) {
        // Проверяем лайки текущего пользователя
        if (user) {
          const activityIds = data.map(d => d.id)
          const { data: likesData } = await supabase
            .from('community_likes')
            .select('activity_id')
            .eq('user_id', user.id)
            .in('activity_id', activityIds)
            
          const likedSet = new Set(likesData?.map(l => l.activity_id) || [])
          
          realActivities = (data as CommunityRow[]).map(row => {
            row.is_liked_by_me = likedSet.has(row.id)
            return mapRowToActivity(row)
          })
        } else {
          realActivities = (data as CommunityRow[]).map(mapRowToActivity)
        }
        
        feedCache = {
          data: realActivities,
          timestamp: Date.now()
        }
        Preferences.set({ key: PREF_CACHE_KEY, value: JSON.stringify(feedCache) }).catch(() => {})
      }
    } catch (_) {
      console.warn('Failed to fetch real feed')
    }
    
    return realActivities
  },

  /**
   * Опубликовать действие пользователя в ленту сообщества.
   * Вызывается из JournalService/PlantService при добавлении записей.
   */
  async publishActivity(params: {
    actionType: string
    plantName: string
    plantEmoji?: string
    locationLabel?: string
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Проверяем, включил ли пользователь видимость в сообществе и есть ли у него подписка
      const { data: settings } = await supabase
        .from('user_settings')
        .select('community_visible, region, is_premium')
        .eq('user_id', user.id)
        .single()
      
      // БАЗОВАЯ ВЕРСИЯ: пользователи не могут скрывать свою активность.
      // Если у пользователя есть премиум, он может скрыть активность (community_visible = false)
      const isPremium = settings?.is_premium || false
      const wantsToHide = settings?.community_visible === false
      
      // Если хочет скрыть, но нет премиума -> все равно публикуем
      if (wantsToHide && isPremium) {
        return // Только премиум пользователи могут отменить публикацию
      }
      
      // Получаем город из настроек или из погоды
      let city = settings?.region || ''
      if (!city) {
        try {
          const res = await fetch('https://ipapi.co/json/')
          const data = await res.json()
          city = data.city || ''
        } catch (_) { /* без города тоже можно */ }
      }
      
      // Формируем display name из email
      const displayName = user.is_anonymous
        ? 'Огородник (Демо)'
        : (user.email?.split('@')[0] || 'Огородник')
      
      await supabase
        .from('community_activities')
        .insert({
          user_id: user.id,
          display_name: displayName,
          action_type: params.actionType,
          plant_name: params.plantName,
          plant_emoji: params.plantEmoji || '🌱',
          city: city || null,
          location_label: params.locationLabel || null
        })
        
      // Сбрасываем кэш, чтобы при следующем открытии ленты загрузилась новая запись
      feedCache = null;
      Preferences.remove({ key: PREF_CACHE_KEY }).catch(() => {})
    } catch (err) {
      // Не блокируем основной flow при ошибках публикации
      console.warn('Не удалось опубликовать в сообщество:', err)
    }
  },

  /**
   * Проверить, включена ли видимость в сообществе
   */
  async isCommunityVisible(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      
      const { data } = await supabase
        .from('user_settings')
        .select('community_visible')
        .eq('user_id', user.id)
        .single()
      
      return data?.community_visible ?? false
    } catch {
      return false
    }
  },

  /**
   * Переключить видимость в сообществе
   */
  async toggleCommunityVisibility(visible: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        community_visible: visible
      })
  },

  /**
   * Переключить лайк для записи
   */
  async toggleLike(activityId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase.rpc('toggle_like', {
        p_activity_id: activityId,
        p_user_id: user.id
      })
      
      if (error) throw error
      return data // возвращает true если лайк поставлен, false если убран
    } catch (err) {
      console.error('Failed to toggle like:', err)
      throw err
    }
  },

  /**
   * Получить комментарии к записи
   */
  async getComments(activityId: string): Promise<SocialComment[]> {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: true })
        
      if (error) throw error
      
      return (data || []).map(row => ({
        id: row.id,
        activityId: row.activity_id,
        userId: row.user_id,
        userName: row.display_name,
        text: row.text,
        timeAgo: formatTimeAgo(row.created_at)
      }))
    } catch (err) {
      console.error('Failed to get comments:', err)
      return []
    }
  },

  /**
   * Добавить комментарий
   */
  async addComment(activityId: string, text: string): Promise<SocialComment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // Формируем display name из email
      const displayName = user.is_anonymous
        ? 'Огородник (Демо)'
        : (user.email?.split('@')[0] || 'Огородник')
      
      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          activity_id: activityId,
          user_id: user.id,
          display_name: displayName,
          text
        })
        .select()
        .single()
        
      if (error) throw error
      
      return {
        id: data.id,
        activityId: data.activity_id,
        userId: data.user_id,
        userName: data.display_name,
        text: data.text,
        timeAgo: 'только что'
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
      return null
    }
  }
}
