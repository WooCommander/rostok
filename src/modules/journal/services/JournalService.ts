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
    const { data, error } = await supabase
      .from('treatment_log')
      .select('*, plant:plants(name, emoji), user_plant:user_plants(nickname, location_note)')
      .order('treated_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<TreatmentEntry> {
    const { data, error } = await supabase
      .from('treatment_log')
      .select('*, plant:plants(name, emoji), user_plant:user_plants(nickname, location_note)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async add(entries: NewTreatmentEntry | NewTreatmentEntry[]): Promise<TreatmentEntry | TreatmentEntry[]> {
    const { data: { user } } = await supabase.auth.getUser()
    const isArray = Array.isArray(entries)
    const itemsToInsert = isArray 
      ? entries.map(e => ({ ...e, user_id: user?.id })) 
      : [{ ...entries, user_id: user?.id }]

    const { data, error } = await supabase
      .from('treatment_log')
      .insert(itemsToInsert)
      .select('*, plant:plants(name, emoji), user_plant:user_plants(nickname, location_note)')
    
    if (error) throw error

    // Публикуем в ленту сообщества (async, не блокируем)
    try {
      const { SocialService } = await import('@/modules/social/services/SocialService')
      const items = Array.isArray(itemsToInsert) ? itemsToInsert : [itemsToInsert]
      for (const entry of items) {
        const plantData = entry.plants_data as { name: string; emoji: string; location_note?: string }[] | undefined
        if (plantData && plantData.length > 0) {
          for (const p of plantData) {
            SocialService.publishActivity({
              actionType: entry.care_type,
              plantName: p.name,
              plantEmoji: p.emoji,
              locationLabel: p.location_note
            })
          }
        }
      }
    } catch (_) { /* не критично */ }

    return isArray ? data : data[0]
  },

  async update(id: string, entry: Partial<NewTreatmentEntry>): Promise<TreatmentEntry> {
    const { data, error } = await supabase
      .from('treatment_log')
      .update(entry)
      .eq('id', id)
      .select('*, plant:plants(name, emoji), user_plant:user_plants(nickname, location_note)')
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
