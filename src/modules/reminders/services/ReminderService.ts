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

const LEGACY_STORAGE_KEY = 'rostok_treatment_reminders'
const MIGRATION_DONE_KEY = 'rostok_reminders_migrated'

interface DbRow {
  id: string
  user_id: string
  plant_id: string
  user_plant_id: string | null
  care_type: string
  product: string | null
  dose: string | null
  remind_at_date: string
  completed: boolean
  created_at: string
}

function rowToReminder(row: DbRow): TreatmentReminder {
  return {
    id: row.id,
    userId: row.user_id,
    plantId: row.plant_id,
    userPlantId: row.user_plant_id,
    careType: row.care_type,
    product: row.product ?? undefined,
    dose: row.dose ?? undefined,
    remindAtDate: row.remind_at_date,
    createdAt: row.created_at,
    completed: row.completed
  }
}

export const ReminderService = {
  async getAll(): Promise<TreatmentReminder[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    await this.migrateFromLocalStorageIfNeeded(user.id)

    const { data, error } = await supabase
      .from('treatment_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('remind_at_date', { ascending: true })

    if (error) {
      console.error('Failed to load reminders', error)
      return []
    }

    return (data as DbRow[]).map(rowToReminder)
  },

  async getActiveRemindersForDate(dateStr: string): Promise<EnrichedReminder[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    await this.migrateFromLocalStorageIfNeeded(user.id)

    const { data, error } = await supabase
      .from('treatment_reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .lte('remind_at_date', dateStr)
      .order('remind_at_date', { ascending: true })

    if (error || !data || data.length === 0) return []

    const reminders = (data as DbRow[]).map(rowToReminder)

    const [allPlants, myPlants] = await Promise.all([
      PlantService.getAll(),
      PlantService.getUserPlants()
    ])

    const plantMap = new Map(allPlants.map(p => [p.id, p]))
    const userPlantMap = new Map(myPlants.map(u => [u.id, u]))

    return reminders.map(r => ({
      ...r,
      plant: plantMap.get(r.plantId),
      userPlant: r.userPlantId ? userPlantMap.get(r.userPlantId) : undefined
    }))
  },

  async addReminder(reminder: Omit<TreatmentReminder, 'id' | 'userId' | 'createdAt' | 'completed'>): Promise<TreatmentReminder> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Необходима авторизация')

    const { data, error } = await supabase
      .from('treatment_reminders')
      .insert({
        user_id: user.id,
        plant_id: reminder.plantId,
        user_plant_id: reminder.userPlantId ?? null,
        care_type: reminder.careType,
        product: reminder.product ?? null,
        dose: reminder.dose ?? null,
        remind_at_date: reminder.remindAtDate
      })
      .select()
      .single()

    if (error) throw error
    return rowToReminder(data as DbRow)
  },

  async markAsCompleted(id: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_reminders')
      .update({ completed: true })
      .eq('id', id)

    if (error) throw error
  },

  async removeReminder(id: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_reminders')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async migrateFromLocalStorageIfNeeded(userId: string): Promise<void> {
    const migrationKey = `${MIGRATION_DONE_KEY}_${userId}`
    if (localStorage.getItem(migrationKey)) return

    const raw = localStorage.getItem(`${LEGACY_STORAGE_KEY}_${userId}`)
    if (!raw) {
      localStorage.setItem(migrationKey, '1')
      return
    }

    let legacy: TreatmentReminder[] = []
    try {
      legacy = JSON.parse(raw)
    } catch {
      localStorage.setItem(migrationKey, '1')
      return
    }

    const pending = legacy.filter(r => !r.completed)
    if (pending.length > 0) {
      const rows = pending.map(r => ({
        user_id: userId,
        plant_id: r.plantId,
        user_plant_id: r.userPlantId ?? null,
        care_type: r.careType,
        product: r.product ?? null,
        dose: r.dose ?? null,
        remind_at_date: r.remindAtDate
      }))

      await supabase.from('treatment_reminders').insert(rows)
    }

    localStorage.removeItem(`${LEGACY_STORAGE_KEY}_${userId}`)
    localStorage.setItem(migrationKey, '1')
  }
}
