import { supabase } from '@/api/supabase'
import { PlantService, type Plant, type UserPlant } from '@/modules/plants/services/PlantService'

export interface TreatmentReminder {
  id: string
  userId: string
  plantId: string
  userPlantId: string | null
  careType: string
  product?: string
  dose?: string
  remindAtDate: string // YYYY-MM-DD
  createdAt: string
  completed: boolean
}

export interface EnrichedReminder extends TreatmentReminder {
  plant?: Plant
  userPlant?: UserPlant
}

const STORAGE_KEY = 'rostok_treatment_reminders'

export const ReminderService = {
  async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || 'anonymous'
  },

  async getAll(): Promise<TreatmentReminder[]> {
    const userId = await this.getUserId()
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (!raw) return []
    try {
      return JSON.parse(raw) as TreatmentReminder[]
    } catch {
      return []
    }
  },

  async getActiveRemindersForDate(dateStr: string): Promise<EnrichedReminder[]> {
    const all = await this.getAll()
    const active = all.filter(r => !r.completed && r.remindAtDate <= dateStr)
    if (active.length === 0) return []

    const [allPlants, myPlants] = await Promise.all([
      PlantService.getAll(),
      PlantService.getUserPlants()
    ])

    const plantMap = new Map(allPlants.map(p => [p.id, p]))
    const userPlantMap = new Map(myPlants.map(u => [u.id, u]))

    return active.map(r => ({
      ...r,
      plant: plantMap.get(r.plantId),
      userPlant: r.userPlantId ? userPlantMap.get(r.userPlantId) : undefined
    }))
  },

  async addReminder(reminder: Omit<TreatmentReminder, 'id' | 'userId' | 'createdAt' | 'completed'>): Promise<TreatmentReminder> {
    const userId = await this.getUserId()
    const all = await this.getAll()
    
    const newReminder: TreatmentReminder = {
      ...reminder,
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      createdAt: new Date().toISOString(),
      completed: false
    }

    all.push(newReminder)
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(all))
    return newReminder
  },

  async markAsCompleted(id: string): Promise<void> {
    const userId = await this.getUserId()
    const all = await this.getAll()
    const updated = all.map(r => r.id === id ? { ...r, completed: true } : r)
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updated))
  },

  async removeReminder(id: string): Promise<void> {
    const userId = await this.getUserId()
    const all = await this.getAll()
    const filtered = all.filter(r => r.id !== id)
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(filtered))
  }
}
