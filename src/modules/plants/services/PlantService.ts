import { supabase } from '@/api/supabase'

export interface Plant {
  id: string
  name: string
  latin_name: string
  category: 'vegetable' | 'berry' | 'tree' | 'shrub' | 'herb'
  description: string
  emoji: string
}

export interface UserPlant {
  id: string
  user_id: string
  plant_id: string
  nickname?: string | null
  planted_at?: string | null
  location_note?: string | null
  created_at?: string
  plant?: Plant
}

export interface PlantCare {
  id: string
  plant_id: string
  care_type: 'watering' | 'fertilizing' | 'spraying' | 'pruning'
  month_from: number
  month_to: number
  temp_min: number | null
  temp_max: number | null
  description: string
  products: string[]
  frequency: string
}

export const PlantService = {
  async getAll(): Promise<Plant[]> {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Plant | null> {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getCareForPlant(plantId: string): Promise<PlantCare[]> {
    const { data, error } = await supabase
      .from('plant_care')
      .select('*')
      .eq('plant_id', plantId)
    if (error) throw error
    return data || []
  },

  // Получить рекомендации по текущему месяцу и температуре
  async getRecommendations(month: number, temp: number): Promise<(PlantCare & { plant: Plant })[]> {
    const { data, error } = await supabase
      .from('plant_care')
      .select('*, plant:plants(*)')
      .lte('month_from', month)
      .gte('month_to', month)
      .or(`temp_min.is.null,temp_min.lte.${temp}`)
      .or(`temp_max.is.null,temp_max.gte.${temp}`)
    if (error) throw error
    return data || []
  },

  async getUserPlants(): Promise<UserPlant[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('user_plants')
      .select('*, plant:plants(*)')
      .eq('user_id', user.id)
    if (error) throw error
    return data || []
  },

  async toggleUserPlant(plantId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Необходима авторизация')

    const { data: existing, error: findErr } = await supabase
      .from('user_plants')
      .select('id')
      .eq('user_id', user.id)
      .eq('plant_id', plantId)

    if (findErr) throw findErr

    if (existing && existing.length > 0) {
      // Удаляем
      const { error: delErr } = await supabase
        .from('user_plants')
        .delete()
        .eq('id', existing[0].id)
      if (delErr) throw delErr
      return false
    } else {
      // Добавляем
      const { error: insErr } = await supabase
        .from('user_plants')
        .insert({ user_id: user.id, plant_id: plantId })
      if (insErr) throw insErr
      return true
    }
  },

  async updateUserPlant(id: string, updates: Partial<UserPlant>): Promise<UserPlant> {
    const { data, error } = await supabase
      .from('user_plants')
      .update(updates)
      .eq('id', id)
      .select('*, plant:plants(*)')
      .single()
    if (error) throw error
    return data
  },

  async removeUserPlant(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_plants')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async addUserPlantInstance(plantId: string): Promise<UserPlant> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Необходима авторизация')
    const { data, error } = await supabase
      .from('user_plants')
      .insert({ user_id: user.id, plant_id: plantId })
      .select('*, plant:plants(*)')
      .single()
    if (error) throw error
    return data
  }
}
