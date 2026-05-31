import { BaseRepository } from '../base/BaseRepository'
import type { Plant } from '@/modules/plants/services/PlantService'
import { ErrorHandler } from '@/shared/lib/errorHandler'
import { supabase } from '../supabase'

export class PlantRepository extends BaseRepository<Plant> {
  constructor() {
    super('plants')
  }

  async findByCategory(category: string): Promise<Plant[]> {
    return this.findBy({ category })
  }

  async findBySeedData(isInSeedData: boolean = true): Promise<Plant[]> {
    return this.findBy({ is_in_seed_data: isInSeedData })
  }

  async searchByName(query: string): Promise<Plant[]> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      const result = await supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${query}%,latin_name.ilike.%${query}%`)
        .order('name')
      
      if (result.error) throw result.error
      return result.data || []
    }, `${this.tableName}.searchByName`)

    if (error) throw error
    return data || []
  }

  async findByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<Plant[]> {
    return this.findBy({ difficulty })
  }

  async findBySunRequirement(sun: string): Promise<Plant[]> {
    return this.findBy({ sun })
  }

  async findByWaterRequirement(water: string): Promise<Plant[]> {
    return this.findBy({ water })
  }
}