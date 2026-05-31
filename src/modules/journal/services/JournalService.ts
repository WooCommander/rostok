import { treatmentRepository } from '@/api/repositories'
import { supabase } from '@/api/supabase'

export interface TreatedPlant {
  id: string
  name: string
  emoji: string
  location_note?: string
}

export interface TreatmentEntry {
  id: string
  user_id: string
  plant_id: string | null
  user_plant_id: string | null
  plants_data?: TreatedPlant[] | null
  treated_at: string
  care_type: string
  product: string | null
  dose: string | null
  temperature: number | null
  notes: string | null
  created_at: string
  plant?: { name: string; emoji: string }
  user_plant?: { nickname: string | null; location_note: string | null }
}

export interface NewTreatmentEntry {
  plant_id?: string | null
  user_plant_id?: string | null
  plants_data?: TreatedPlant[]
  treated_at: string
  care_type: string
  product?: string
  dose?: string
  temperature?: number | null
  notes?: string
}

export const JournalService = {
  async getAll(): Promise<TreatmentEntry[]> {
    return treatmentRepository.findAll({ 
      orderBy: 'treated_at', 
      order: 'desc', 
      limit: 50 
    })
  },

  async getById(id: string): Promise<TreatmentEntry> {
    const result = await treatmentRepository.findById(id)
    if (!result) throw new Error('Treatment not found')
    return result
  },

  async add(entries: NewTreatmentEntry | NewTreatmentEntry[]): Promise<TreatmentEntry | TreatmentEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) throw new Error('User not authenticated')

    const isArray = Array.isArray(entries)
    
    if (isArray) {
      const results = []
      for (const entry of entries) {
        const result = await treatmentRepository.createTreatment(user.id, entry)
        results.push(result)
      }
      return results
    } else {
      return treatmentRepository.createTreatment(user.id, entries)
    }
  },

  async update(id: string, entry: Partial<NewTreatmentEntry>): Promise<TreatmentEntry> {
    return treatmentRepository.update(id, entry)
  },

  async remove(id: string): Promise<void> {
    return treatmentRepository.delete(id)
  }
}
