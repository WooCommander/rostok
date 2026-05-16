import { PRODUCTS_DATA, type ProductItem } from '../data/productsData'

export class ProductService {
  static async getAllProducts(): Promise<ProductItem[]> {
    return Promise.resolve(PRODUCTS_DATA)
  }

  static async getProductsByCategory(category: string): Promise<ProductItem[]> {
    if (!category || category === 'all') {
      return Promise.resolve(PRODUCTS_DATA)
    }
    return Promise.resolve(PRODUCTS_DATA.filter(p => p.category === category))
  }

  static async searchProducts(query: string, category: string = 'all'): Promise<ProductItem[]> {
    let items = PRODUCTS_DATA
    if (category && category !== 'all') {
      items = items.filter(p => p.category === category)
    }
    if (!query || query.trim() === '') {
      return Promise.resolve(items)
    }
    const q = query.toLowerCase().trim()
    return Promise.resolve(items.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.active_ingredient.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.analogues.some(a => a.toLowerCase().includes(q))
    ))
  }

  static async getProductByIdOrName(identifier: string): Promise<ProductItem | null> {
    if (!identifier) return Promise.resolve(null)
    const idStr = identifier.toLowerCase().trim()
    const found = PRODUCTS_DATA.find(p => 
      p.id.toLowerCase() === idStr || 
      p.name.toLowerCase() === idStr ||
      p.analogues.some(a => a.toLowerCase() === idStr)
    )
    return Promise.resolve(found || null)
  }
}

export type { ProductItem }
