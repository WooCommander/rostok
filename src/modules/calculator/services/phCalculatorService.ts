export type SoilTexture = 'sandy' | 'loam' | 'clay'
export type DeoxidizerType = 'dolomite' | 'ash' | 'lime'

export interface PhCalculationInput {
  area: number
  currentPh: number
  targetPh: number
  soilTexture: SoilTexture
  deoxidizerType: DeoxidizerType
}

export interface PhCalculationResult {
  totalAmountKg: number
  amountPerSqMGrams: number
  message: string
}

export class PhCalculatorService {
  // Base grams of dolomite flour needed to raise pH by 1.0 unit on 1 sq meter
  private static BASE_RATES: Record<SoilTexture, number> = {
    sandy: 200,
    loam: 350,
    clay: 500
  }

  // Multipliers relative to dolomite flour
  private static DEOXIDIZER_MULTIPLIER: Record<DeoxidizerType, number> = {
    dolomite: 1.0,
    lime: 0.7, // Lime is stronger
    ash: 1.5   // Ash is weaker
  }

  static calculate(input: PhCalculationInput): PhCalculationResult {
    if (input.currentPh >= input.targetPh) {
      return {
        totalAmountKg: 0,
        amountPerSqMGrams: 0,
        message: 'Текущий pH уже равен или выше целевого. Раскисление не требуется!'
      }
    }

    const phDifference = input.targetPh - input.currentPh
    const baseRateGrams = this.BASE_RATES[input.soilTexture]
    const multiplier = this.DEOXIDIZER_MULTIPLIER[input.deoxidizerType]

    const gramsPerSqM = Math.round(baseRateGrams * phDifference * multiplier)
    const totalGrams = gramsPerSqM * input.area
    const totalKg = Number((totalGrams / 1000).toFixed(2))

    let deoxName = ''
    if (input.deoxidizerType === 'dolomite') deoxName = 'доломитовой муки'
    if (input.deoxidizerType === 'lime') deoxName = 'гашеной извести (пушонки)'
    if (input.deoxidizerType === 'ash') deoxName = 'древесной золы'

    return {
      totalAmountKg: totalKg,
      amountPerSqMGrams: gramsPerSqM,
      message: `Для повышения pH с ${input.currentPh.toFixed(1)} до ${input.targetPh.toFixed(1)} на площади ${input.area} м² вам потребуется внести ${totalKg} кг ${deoxName}.`
    }
  }
}
