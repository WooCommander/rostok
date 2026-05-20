import { supabase } from '@/api/supabase'
import { WeatherService } from '@/modules/weather/services/WeatherService'
import { PlantService } from '@/modules/plants/services/PlantService'

export interface SocialActivity {
  id: string
  userName: string
  action: string
  plant: string
  emoji: string
  timeAgo: string
  likes: number
  location: string
  isReal?: boolean
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
  created_at: string
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

// ── Mock-генерация (fallback) ──
const mockNames = ['Александр', 'Елена', 'Михаил', 'Анна', 'Сергей', 'Ольга', 'Дмитрий', 'Мария', 'Иван', 'Наталья', 'Виктория', 'Андрей', 'Ирина', 'Екатерина', 'Алексей']
const mockLocations = ['СНТ "Ромашка"', 'Дачный посёлок', 'Рядом с вами', 'В вашем регионе', 'Соседний участок', 'Теплица', 'Пригород']
const mockActions = Object.entries(ACTION_LABELS)

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
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
    likes: row.likes_count,
    location: row.city ? `г. ${row.city}` : (row.location_label || 'В вашем регионе'),
    isReal: true
  }
}

async function generateMockFeed(count: number): Promise<SocialActivity[]> {
  const [weather, plants] = await Promise.all([
    WeatherService.getWithCache(),
    PlantService.getAll()
  ])
  
  const city = weather.city || 'Мой регион'
  const result: SocialActivity[] = []
  
  for (let i = 0; i < count; i++) {
    const plant = getRandom(plants)
    const [, actionText] = getRandom(mockActions)
    const maxMinutes = count * 10
    const timeMins = 2 + Math.floor(Math.random() * maxMinutes)
    const loc = Math.random() > 0.4 ? `г. ${city}` : getRandom(mockLocations)
    
    result.push({
      id: `mock_${i}_${Date.now()}_${Math.random()}`,
      userName: getRandom(mockNames),
      action: actionText,
      plant: plant.name,
      emoji: plant.emoji || '🌱',
      timeAgo: `${timeMins} мин назад`,
      likes: Math.floor(Math.random() * 25),
      location: loc,
      isReal: false
    })
  }
  
  return result.sort((a, b) => parseInt(a.timeAgo) - parseInt(b.timeAgo))
}

export const SocialService = {
  /**
   * Получить ленту сообщества.
   * Сначала пробуем реальные данные из БД, если их мало — дополняем mock.
   */
  async getFeed(count: number = 10): Promise<SocialActivity[]> {
    let realActivities: SocialActivity[] = []
    
    try {
      const { data, error } = await supabase
        .from('community_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(count)
      
      if (!error && data && data.length > 0) {
        realActivities = (data as CommunityRow[]).map(mapRowToActivity)
      }
    } catch (_) {
      // Таблица ещё не создана — продолжаем с mock
    }
    
    // Если реальных данных достаточно — возвращаем только их
    if (realActivities.length >= count) {
      return realActivities
    }
    
    // Дополняем mock-данными до нужного количества
    const mockCount = count - realActivities.length
    const mockActivities = await generateMockFeed(mockCount)
    
    // Реальные записи всегда сверху
    return [...realActivities, ...mockActivities]
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
      
      // Проверяем, включил ли пользователь видимость в сообществе
      const { data: settings } = await supabase
        .from('user_settings')
        .select('community_visible, region')
        .eq('user_id', user.id)
        .single()
      
      if (!settings?.community_visible) return
      
      // Получаем город из настроек или из погоды
      let city = settings.region || ''
      if (!city) {
        try {
          const weather = await WeatherService.getWithCache()
          city = weather.city || ''
        } catch (_) { /* без города тоже можно */ }
      }
      
      // Формируем display name из email
      const displayName = user.is_anonymous
        ? getRandom(mockNames)
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
  }
}
