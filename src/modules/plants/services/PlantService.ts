import { supabase } from '@/api/supabase'

export interface Plant {
  id: string
  name: string
  latin_name: string
  category: 'vegetable' | 'berry' | 'tree' | 'shrub' | 'herb'
  description: string
  emoji: string
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
  }
}
