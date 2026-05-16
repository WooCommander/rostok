export interface CalculationInput {
  calcType: 'area' | 'bushes' | 'trees'
  amount: number
  fertilizerId: string
  soilType?: 'loam' | 'sandy' | 'clay'
}

export interface FertilizerMeta {
  id: string
  name: string
  category: 'nitrogen' | 'phosphorus' | 'potassium' | 'complex' | 'organic'
  rateArea: number // грамм на 1 м²
  rateBush: number // грамм на 1 куст
  rateTree: number // грамм на 1 дерево
  waterArea: number // литров воды на 1 м²
  waterBush: number // литров на 1 куст
  waterTree: number // литров на 1 дерево
  description: string
  tips: string
}

export interface CalculationResult {
  fertilizerAmountGrams: number
  waterAmountLiters: number
  recommendedSolutionsCount: number // Количество 10-литровых ведер
  spoonApprox: number // Приблизительно столовых ложек (1 ст.л. ≈ 15г)
  glassApprox: number // Приблизительно стаканов (1 стакан ≈ 200г)
  tips: string
}

const FERTILIZERS: FertilizerMeta[] = [
  {
    id: 'superphosphate',
    name: 'Суперфосфат (двойной)',
    category: 'phosphorus',
    rateArea: 40,
    rateBush: 12,
    rateTree: 70,
    waterArea: 10,
    waterBush: 2.5,
    waterTree: 20,
    description: 'Обеспечивает мощное развитие корневой системы, ускоряет цветение и созревание плодов. Плохо растворяется в холодной воде.',
    tips: 'Рекомендуется предварительно залить гранулы горячей водой (70-80°C) на несколько часов для приготовления вытяжки.'
  },
  {
    id: 'potassium_sulfate',
    name: 'Сульфат калия (сернокислый калий)',
    category: 'potassium',
    rateArea: 30,
    rateBush: 10,
    rateTree: 50,
    waterArea: 10,
    waterBush: 2,
    waterTree: 15,
    description: 'Улучшает вкусовые качества плодов, повышает сахаристость и зимостойкость многолетних культур. Не содержит хлора.',
    tips: 'Идеально подходит для подкормки томатов, клубники и огурцов во время активного плодоношения.'
  },
  {
    id: 'urea',
    name: 'Карбамид (Мочевина) N46%',
    category: 'nitrogen',
    rateArea: 20,
    rateBush: 8,
    rateTree: 40,
    waterArea: 10,
    waterBush: 2,
    waterTree: 15,
    description: 'Концентрированное азотное удобрение для быстрого наращивания зеленой массы и мощного старта весной.',
    tips: 'Не вносите азот во второй половине лета, чтобы не вызвать бурный рост листвы в ущерб плодам и зимостойкости.'
  },
  {
    id: 'npk_16',
    name: 'Нитроаммофоска (NPK 16:16:16)',
    category: 'complex',
    rateArea: 35,
    rateBush: 12,
    rateTree: 60,
    waterArea: 10,
    waterBush: 2.5,
    waterTree: 18,
    description: 'Универсальное комплексное удобрение, содержащее равные доли азота, фосфора и калия.',
    tips: 'Вносите во влажную почву или совмещайте с обильным поливом для предотвращения ожога корней.'
  },
  {
    id: 'wood_ash',
    name: 'Зола древесная просеянная',
    category: 'organic',
    rateArea: 150,
    rateBush: 50,
    rateTree: 300,
    waterArea: 10,
    waterBush: 3,
    waterTree: 25,
    description: 'Натуральный источник калия, кальция и микроэлементов. Раскисляет почву и защищает от вредителей.',
    tips: 'Никогда не смешивайте золу с азотными удобрениями (суперфосфатом, селитрой, навозом) — это приводит к потере азота.'
  }
]

export class CalculatorService {
  static getFertilizers(): FertilizerMeta[] {
    return FERTILIZERS
  }

  static calculate(input: CalculationInput): CalculationResult {
    const fert = FERTILIZERS.find(f => f.id === input.fertilizerId) || FERTILIZERS[0]
    
    let fertGrams = 0
    let waterLiters = 0

    if (input.calcType === 'area') {
      fertGrams = fert.rateArea * input.amount
      waterLiters = fert.waterArea * input.amount
    } else if (input.calcType === 'bushes') {
      fertGrams = fert.rateBush * input.amount
      waterLiters = fert.waterBush * input.amount
    } else {
      fertGrams = fert.rateTree * input.amount
      waterLiters = fert.waterTree * input.amount
    }

    // Корректировка по типу почвы (на песчаных вода уходит быстрее, порции можно чуть снизить)
    if (input.soilType === 'sandy') {
      fertGrams *= 0.9
    } else if (input.soilType === 'clay') {
      fertGrams *= 1.1
    }

    fertGrams = Math.round(fertGrams)
    waterLiters = Math.round(waterLiters * 10) / 10

    const buckets = Math.ceil(waterLiters / 10)
    const spoons = Math.round((fertGrams / 15) * 10) / 10
    const glasses = Math.round((fertGrams / 200) * 10) / 10

    return {
      fertilizerAmountGrams: fertGrams,
      waterAmountLiters: waterLiters,
      recommendedSolutionsCount: buckets,
      spoonApprox: spoons,
      glassApprox: glasses,
      tips: fert.tips
    }
  }
}
