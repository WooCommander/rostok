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
}

const names = ['Александр', 'Елена', 'Михаил', 'Анна', 'Сергей', 'Ольга', 'Дмитрий', 'Мария', 'Иван', 'Наталья', 'Виктория', 'Андрей', 'Ирина', 'Екатерина', 'Алексей']
const locations = ['СНТ "Ромашка"', 'Дачный посёлок', 'Рядом с вами', 'В вашем регионе', 'Соседний участок', 'Теплица', 'Пригород']

const careActions = [
  { type: 'watering', text: 'поливает', icon: '💦' },
  { type: 'fertilizing', text: 'подкармливает', icon: '🌿' },
  { type: 'spraying', text: 'опрыскивает от вредителей', icon: '🛡️' },
  { type: 'pruning', text: 'проводит обрезку', icon: '✂️' },
  { type: 'harvesting', text: 'собирает первый урожай', icon: '🧺' },
  { type: 'planting', text: 'высаживает рассаду', icon: '🌱' },
  { type: 'weeding', text: 'пропалывает', icon: '🌾' }
]

function getRandom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export const SocialService = {
  async getFeed(count: number = 5): Promise<SocialActivity[]> {
    const [weather, plants] = await Promise.all([
      WeatherService.getWithCache(),
      PlantService.getAll()
    ])
    
    const city = weather.city || 'Мой регион'
    const result: SocialActivity[] = []
    
    for (let i = 0; i < count; i++) {
      const plant = getRandom(plants)
      const action = getRandom(careActions)
      
      // Calculate realistic time spread: more items = bigger spread
      const maxMinutes = count * 10
      const timeMins = 2 + Math.floor(Math.random() * maxMinutes)
      
      const loc = Math.random() > 0.4 ? `г. ${city}` : getRandom(locations)
      
      result.push({
        id: `soc_${i}_${Date.now()}_${Math.random()}`,
        userName: getRandom(names),
        action: action.text,
        plant: plant.name,
        emoji: plant.emoji || action.icon,
        timeAgo: `${timeMins} мин назад`,
        likes: Math.floor(Math.random() * 25),
        location: loc
      })
    }
    
    return result.sort((a, b) => parseInt(a.timeAgo) - parseInt(b.timeAgo))
  }
}
