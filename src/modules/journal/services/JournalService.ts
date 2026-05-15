import { supabase } from '@/api/supabase'

export interface TreatmentEntry {
  id: string
  user_id: string
  plant_id: string | null
  user_plant_id: string | null
  treated_at: string
  care_type: string
  product: string | null
  dose: string | null
  temperature: number | null
  notes: string | null
  created_at: string
  plant?: { name: string; emoji: string }
}

export interface NewTreatmentEntry {
  plant_id?: string | null
  treated_at: string
  care_type: string
  product?: string
  dose?: string
  temperature?: number | null
  notes?: string
}

export const JournalService = {
  async getAll(): Promise<TreatmentEntry[]> {
    const { data, error } = await supabase
      .from('treatment_log')
      .select('*, plant:plants(name, emoji)')
      .order('treated_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data || []
  },

  async add(entry: NewTreatmentEntry): Promise<TreatmentEntry> {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('treatment_log')
      .insert({ ...entry, user_id: user?.id })
      .select('*, plant:plants(name, emoji)')
      .single()
    if (error) throw error
    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('treatment_log')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
