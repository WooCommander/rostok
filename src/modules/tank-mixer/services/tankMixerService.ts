import { ProductItem } from '@/modules/products'
import { PRODUCT_GROUPS, MIX_RULES, type MixResultType, type ProductGroup } from '../data/mixerRules'

export interface MixCheckResult {
  result: MixResultType
  message: string
}

export class TankMixerService {
  static getGroup(productId: string): ProductGroup {
    return PRODUCT_GROUPS[productId] || 'other'
  }

  static checkCompatibility(product1: ProductItem, product2: ProductItem): MixCheckResult {
    const group1 = this.getGroup(product1.id)
    const group2 = this.getGroup(product2.id)

    // specific hardcoded rule for calcium + phosphorus/sulfate
    if (
      (product1.id === 'calcium-nitrate' && ['superphosphate', 'potassium-monophosphate', 'potassium-sulfate'].includes(product2.id)) ||
      (product2.id === 'calcium-nitrate' && ['superphosphate', 'potassium-monophosphate', 'potassium-sulfate'].includes(product1.id))
    ) {
      return {
        result: 'INCOMPATIBLE',
        message: 'Кальций и фосфор (или сульфаты) в концентрированном растворе образуют нерастворимый осадок (гипс). Эти элементы всегда вносят отдельно!'
      }
    }

    // specific hardcoded rule for bio (fitoverm) + living bio (fitosporin) -> they are compatible
    if (
      (product1.id === 'fitoverm' && product2.id === 'fitosporin') ||
      (product2.id === 'fitoverm' && product1.id === 'fitosporin')
    ) {
      return {
        result: 'COMPATIBLE',
        message: 'Отличная био-смесь: биоинсектицид и биофунгицид не мешают друг другу.'
      }
    }

    for (const rule of MIX_RULES) {
      if (
        (rule.group1 === group1 && rule.group2 === group2) ||
        (rule.group1 === group2 && rule.group2 === group1)
      ) {
        return {
          result: rule.result,
          message: rule.message
        }
      }
    }

    // Default if no rule matched
    return {
      result: 'CAUTION',
      message: 'Точных данных о совместимости этих групп нет. Рекомендуется провести тест на совместимость: смешайте препараты в небольшой емкости. Если выпадет осадок, хлопья или раствор разогреется — смешивать нельзя.'
    }
  }
}
