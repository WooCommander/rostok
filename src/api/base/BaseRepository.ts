import { supabase } from '../supabase'
import { ErrorHandler } from '@/shared/lib/errorHandler'

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export interface FilterOptions {
  [key: string]: any
}

export abstract class BaseRepository<T = any> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      let query = supabase.from(this.tableName).select('*')

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.order === 'asc' })
      }

      const result = await query
      if (result.error) throw result.error
      return result.data || []
    }, `${this.tableName}.findAll`)

    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      const result = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
      
      if (result.error) throw result.error
      return result.data
    }, `${this.tableName}.findById`)

    if (error) throw error
    return data
  }

  async findBy(filters: FilterOptions, options?: QueryOptions): Promise<T[]> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      let query = supabase.from(this.tableName).select('*')

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.order === 'asc' })
      }

      const result = await query
      if (result.error) throw result.error
      return result.data || []
    }, `${this.tableName}.findBy`)

    if (error) throw error
    return data || []
  }

  async create(item: any): Promise<T> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      const result = await supabase
        .from(this.tableName)
        .insert(item)
        .select()
        .single()
      
      if (result.error) throw result.error
      return result.data
    }, `${this.tableName}.create`)

    if (error) throw error
    return data!
  }

  async update(id: string, updates: any): Promise<T> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      const result = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (result.error) throw result.error
      return result.data
    }, `${this.tableName}.update`)

    if (error) throw error
    return data!
  }

  async delete(id: string): Promise<void> {
    const { error } = await ErrorHandler.withErrorHandling(async () => {
      const result = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
      
      if (result.error) throw result.error
    }, `${this.tableName}.delete`)

    if (error) throw error
  }

  async count(filters?: FilterOptions): Promise<number> {
    const { data, error } = await ErrorHandler.withErrorHandling(async () => {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      const result = await query
      if (result.error) throw result.error
      return result.count || 0
    }, `${this.tableName}.count`)

    if (error) throw error
    return data || 0
  }
}