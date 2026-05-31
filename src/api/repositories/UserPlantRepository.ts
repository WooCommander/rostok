import { BaseRepository } from '../base/BaseRepository'
import type { UserPlant } from '@/modules/plants/services/PlantService'
import { ErrorHandler } from '@/shared/lib/errorHandler'
import { supabase } from '../supabase'

export class UserPlantRepository extends BaseRepository<UserPlant> {
  constructor() {
    super('user_plants')
  }

  async findByUserId(userId: string): Promise<UserPlant[]> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      const result = await supabase
        .from(this.tableName)
        .select(`
          *,
          plant:plants(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (result.error) throw result.error
      return result.data || []
    }, `${this.tableName}.findByUserId`)

    if (error) throw error
    return data || []
  }

  async findByUserAndPlant(userId: string, plantId: string): Promise<UserPlant[]> {
    return this.findBy({ user_id: userId, plant_id: plantId })
  }

  async findWithHarvestSoon(userId: string, days: number = 14): Promise<UserPlant[]> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      const result = await supabase
        .from(this.tableName)
        .select(`
          *,
          plant:plants(*)
        `)
        .eq('user_id', userId)
        .not('days_to_harvest', 'is', null)
        .lte('days_to_harvest', days)
        .order('days_to_harvest', { ascending: true })
      
      if (result.error) throw result.error
      return result.data || []
    }, `${this.tableName}.findWithHarvestSoon`)

    if (error) throw error
    return data || []
  }

  async updateHarvestDays(id: string, daysToHarvest: number): Promise<UserPlant> {
    return this.update(id, { days_to_harvest: daysToHarvest })
  }

  async addPhoto(id: string, photoUrl: string): Promise<UserPlant> {
    return this.update(id, { photo_url: photoUrl })
  }
}