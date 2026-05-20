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

  static checkMultipleCompatibility(products: ProductItem[]): MixCheckResult {
    if (products.length < 2) {
      return { result: 'COMPATIBLE', message: 'Недостаточно препаратов для смешивания.' }
    }

    let hasCaution = false
    let allMessages = new Set<string>()

    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const p1 = products[i]
        const p2 = products[j]
        
        if (p1.id === p2.id) {
          return {
            result: 'INCOMPATIBLE',
            message: `Вы выбрали один и тот же препарат дважды: ${p1.name}.`
          }
        }

        const res = this.checkCompatibility(p1, p2)
        if (res.result === 'INCOMPATIBLE') {
          // If any pair is incompatible, the whole mix is incompatible
          return {
            result: 'INCOMPATIBLE',
            message: `Несовместимая пара (${p1.name} + ${p2.name}): ${res.message}`
          }
        } else if (res.result === 'CAUTION') {
          hasCaution = true
          allMessages.add(`Внимание (${p1.name} + ${p2.name}): ${res.message}`)
        } else {
          // COMPATIBLE - just add info message if it's 3 products
          if (products.length > 2) {
             allMessages.add(`Пара ${p1.name} и ${p2.name} смешивается отлично.`)
          } else {
             allMessages.add(res.message)
          }
        }
      }
    }

    if (hasCaution) {
      return {
        result: 'CAUTION',
        message: Array.from(allMessages).join(' ')
      }
    }

    if (products.length > 2) {
      return {
        result: 'COMPATIBLE',
        message: 'Все три препарата отлично совместимы в одной баковой смеси! Помните: сначала растворяйте порошки, затем жидкие препараты.'
      }
    }

    return {
      result: 'COMPATIBLE',
      message: Array.from(allMessages).join(' ')
    }
  }
}
