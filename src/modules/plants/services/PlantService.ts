import { supabase } from '@/api/supabase'
import { plantSecretsData } from '../data/plantSecretsData'
import { SEED_PLANTS, SEED_CARE } from '../data/plantsSeedData'

export interface Plant {
  id: string
  name: string
  latin_name: string
  category: 'vegetable' | 'berry' | 'tree' | 'shrub' | 'herb'
  description: string
  emoji: string
  difficulty?: 'easy' | 'medium' | 'hard'
  sun?: string
  water?: string
}

export interface PlantSecret {
  id: string
  plant_id: string
  title: string
  description: string
  secret_type: string
  emoji: string
}

export interface UserPlant {
  id: string
  user_id: string
  plant_id: string
  nickname?: string | null
  planted_at?: string | null
  days_to_harvest?: number | null
  location_note?: string | null
  photo_url?: string | null
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

function enrichPlant(p: Plant): Plant {
  const seed = SEED_PLANTS.find(s => s.name === p.name || s.id === p.id)
  return {
    ...p,
    difficulty: p.difficulty || seed?.difficulty || 'easy',
    sun: p.sun || seed?.sun || '☀️ Солнце',
    water: p.water || seed?.water || '💧 Умеренный'
  }
}

export const PlantService = {
  async getAll(): Promise<Plant[]> {
    let remotePlants: Plant[] = []
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('name')
      if (!error && data) {
        remotePlants = data
      }
    } catch (_) { }

    const map = new Map<string, Plant>()
    SEED_PLANTS.forEach(p => map.set(p.name, enrichPlant(p)))
    remotePlants.forEach(p => map.set(p.name, enrichPlant(p)))

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  },

  async getById(id: string): Promise<Plant | null> {
    if (id.startsWith('seed-')) {
      const found = SEED_PLANTS.find(p => p.id === id)
      return found ? enrichPlant(found) : null
    }
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('id', id)
        .single()
      if (!error && data) return enrichPlant(data)
    } catch (_) { }

    const found = SEED_PLANTS.find(p => p.id === id || p.name === id)
    return found ? enrichPlant(found) : null
  },

  async getCareForPlant(plantId: string): Promise<PlantCare[]> {
    let remoteCare: PlantCare[] = []
    if (!plantId.startsWith('seed-')) {
      try {
        const { data, error } = await supabase
          .from('plant_care')
          .select('*')
          .eq('plant_id', plantId)
        if (!error && data) {
          remoteCare = data
        }
      } catch (_) { }
    }

    if (remoteCare.length > 0) return remoteCare
    return SEED_CARE.filter(c => c.plant_id === plantId)
  },

  async getSecretsForPlant(plantId: string, plantName: string): Promise<PlantSecret[]> {
    let remoteSecrets: PlantSecret[] = []
    try {
      const { data, error } = await supabase
        .from('plant_secrets')
        .select('*')
        .eq('plant_id', plantId)
      if (!error && data) {
        remoteSecrets = data
      }
    } catch (_) {
      // Таблица в БД может быть ещё не проинициализирована
    }

    const local = plantSecretsData[plantName] || []
    const map = new Map<string, PlantSecret>()

    local.forEach((item, index) => {
      map.set(item.title, {
        ...item,
        id: `local-${index}`,
        plant_id: plantId
      })
    })

    remoteSecrets.forEach(item => {
      map.set(item.title, item)
    })

    return Array.from(map.values())
  },

  // Получить рекомендации по текущему месяцу и температуре
  async getRecommendations(month: number, temp: number): Promise<(PlantCare & { plant: Plant })[]> {
    let remote: (PlantCare & { plant: Plant })[] = []
    try {
      const { data, error } = await supabase
        .from('plant_care')
        .select('*, plant:plants(*)')
        .lte('month_from', month)
        .gte('month_to', month)
        .or(`temp_min.is.null,temp_min.lte.${temp}`)
        .or(`temp_max.is.null,temp_max.gte.${temp}`)
      if (!error && data) {
        remote = data
      }
    } catch (_) { }

    const localCare = SEED_CARE.filter(c => {
      const inMonth = month >= c.month_from && month <= c.month_to
      const inTempMin = c.temp_min === null || temp >= c.temp_min
      const inTempMax = c.temp_max === null || temp <= c.temp_max
      return inMonth && inTempMin && inTempMax
    })

    const localWithPlants = localCare.map(c => {
      const found = SEED_PLANTS.find(p => p.id === c.plant_id)
      const plant = found ? enrichPlant(found) : {
        id: c.plant_id,
        name: 'Растение',
        latin_name: '',
        category: 'vegetable' as const,
        emoji: '🌱',
        description: '',
        difficulty: 'easy' as const,
        sun: '☀️ Солнце',
        water: '💧 Умеренный'
      }
      return { ...c, plant }
    })

    const all = [...remote, ...localWithPlants]
    const map = new Map<string, PlantCare & { plant: Plant }>()
    all.forEach(item => {
      if (item.plant) {
        item.plant = enrichPlant(item.plant)
      }
      map.set(`${item.plant?.name}-${item.description}`, item)
    })

    return Array.from(map.values())
  },

  async getUserPlants(): Promise<UserPlant[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('user_plants')
      .select('*, plant:plants(*)')
      .eq('user_id', user.id)
    if (error) throw error

    const list = data || []
    return list.map(item => {
      if (!item.plant) {
        const seedPlant = SEED_PLANTS.find(p => p.id === item.plant_id || p.name === item.plant_id)
        if (seedPlant) {
          return { ...item, plant: enrichPlant(seedPlant) }
        }
      } else {
        return { ...item, plant: enrichPlant(item.plant) }
      }
      return item
    })
  },

  async checkPlantLimit(userId: string): Promise<void> {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('is_premium')
      .eq('user_id', userId)
      .single()
      
    if (settings?.is_premium) return;

    const { count, error } = await supabase
      .from('user_plants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      
    if (!error && count !== null && count >= 1) {
      throw new Error('PREMIUM_REQUIRED_PLANT')
    }
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
      await this.checkPlantLimit(user.id)
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
    if (data && data.plant) {
      data.plant = enrichPlant(data.plant)
    }
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
    
    await this.checkPlantLimit(user.id)
    
    const { data, error } = await supabase
      .from('user_plants')
      .insert({ user_id: user.id, plant_id: plantId })
      .select('*, plant:plants(*)')
      .single()
    if (error) throw error
    if (data && data.plant) {
      data.plant = enrichPlant(data.plant)
    }
    return data
  },

  async uploadGardenPhoto(file: File, userPlantId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Необходима авторизация')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${userPlantId}_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('garden_photos')
      .upload(fileName, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from('garden_photos')
      .getPublicUrl(fileName)

    const photoUrl = publicUrlData.publicUrl

    await this.updateUserPlant(userPlantId, { photo_url: photoUrl })

    return photoUrl
  },

  async getGardenPhotos(userPlantId: string): Promise<{ url: string; createdAt: string }[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase.storage
      .from('garden_photos')
      .list(user.id, {
        sortBy: { column: 'created_at', order: 'asc' }
      })

    if (error || !data) return []

    const files = data.filter(f => f.name.startsWith(`${userPlantId}_`))
    
    return files.map(f => {
      const { data: publicData } = supabase.storage
        .from('garden_photos')
        .getPublicUrl(`${user.id}/${f.name}`)
      return {
        url: publicData.publicUrl,
        createdAt: f.created_at || new Date().toISOString()
      }
    })
  }
}
