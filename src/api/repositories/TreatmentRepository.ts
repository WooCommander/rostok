import { BaseRepository } from '../base/BaseRepository'
import type { TreatmentEntry, NewTreatmentEntry } from '@/modules/journal/services/JournalService'
import { ErrorHandler } from '@/shared/lib/errorHandler'
import { supabase } from '../supabase'

export class TreatmentRepository extends BaseRepository<TreatmentEntry> {
  constructor() {
    super('treatment_log')
  }

  async findByUserId(userId: string): Promise<TreatmentEntry[]> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      const result = await supabase
        .from(this.tableName)
        .select(`
          *,
          plant:plants(name, emoji),
          user_plant:user_plants(nickname, location_note)
        `)
        .eq('user_id', userId)
        .order('treated_at', { ascending: false })
      
      if (result.error) throw result.error
      return result.data || []
    }, `${this.tableName}.findByUserId`)

    if (error) throw error
    return data || []
  }

  async findByUserAndPlant(userId: string, plantId?: string, userPlantId?: string): Promise<TreatmentEntry[]> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          plant:plants(name, emoji),
          user_plant:user_plants(nickname, location_note)
        `)
        .eq('user_id', userId)

      if (plantId) {
        query = query.eq('plant_id', plantId)
      }

      if (userPlantId) {
        query = query.eq('user_plant_id', userPlantId)
      }

      query = query.order('treated_at', { ascending: false })

      const result = await query
      if (result.error) throw result.error
      return result.data || []
    }, `${this.tableName}.findByUserAndPlant`)

    if (error) throw error
    return data || []
  }

  async findByCareType(userId: string, careType: string): Promise<TreatmentEntry[]> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      const result = await supabase
        .from(this.tableName)
        .select(`
          *,
          plant:plants(name, emoji),
          user_plant:user_plants(nickname, location_note)
        `)
        .eq('user_id', userId)
        .eq('care_type', careType)
        .order('treated_at', { ascending: false })
      
      if (result.error) throw result.error
      return result.data || []
    }, `${this.tableName}.findByCareType`)

    if (error) throw error
    return data || []
  }

  async findRecent(userId: string, days: number = 7): Promise<TreatmentEntry[]> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      const sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - days)

      const result = await supabase
        .from(this.tableName)
        .select(`
          *,
          plant:plants(name, emoji),
          user_plant:user_plants(nickname, location_note)
        `)
        .eq('user_id', userId)
        .gte('treated_at', sinceDate.toISOString())
        .order('treated_at', { ascending: false })
      
      if (result.error) throw result.error
      return result.data || []
    }, `${this.tableName}.findRecent`)

    if (error) throw error
    return data || []
  }

  async createTreatment(userId: string, treatment: NewTreatmentEntry): Promise<TreatmentEntry> {
    return this.create({
      ...treatment,
      user_id: userId
    } as Partial<TreatmentEntry>)
  }
}