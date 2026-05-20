import { ProductItem } from '@/modules/products'

export type ProductGroup = 
  | 'copper' 
  | 'alkaline' 
  | 'bio-living' 
  | 'bio-stimulant' 
  | 'chem-fungicide' 
  | 'chem-insecticide' 
  | 'fertilizer-neutral' 
  | 'acidic' 
  | 'other'

export const PRODUCT_GROUPS: Record<string, ProductGroup> = {
  // Copper
  'copper-sulfate': 'copper',
  'bordeaux-mixture': 'copper',
  'iron-sulfate': 'copper', // Treating iron similar to copper for mix incompatibility

  // Alkaline
  'dolomite': 'alkaline',
  'wood-ash': 'alkaline',

  // Bio-living
  'fitosporin': 'bio-living',
  'trichodermin': 'bio-living',
  'bitoxibacillin': 'bio-living',

  // Bio-stimulant
  'epin-extra': 'bio-stimulant',
  'zircon': 'bio-stimulant',
  'birch-tar': 'bio-stimulant', // not quite, but acts as harmless additive

  // Chem Fungicide
  'horus': 'chem-fungicide',
  'skor': 'chem-fungicide',
  'topsin-m': 'chem-fungicide',
  'ridomil-gold': 'chem-fungicide',
  'strobi': 'chem-fungicide',

  // Chem Insecticide
  'aktara': 'chem-insecticide',
  'inta-vir': 'chem-insecticide',
  'konfidor': 'chem-insecticide',
  'fufanon': 'chem-insecticide',
  'teppeki': 'chem-insecticide',

  // Fertilizer neutral/acidic
  'carbamide': 'fertilizer-neutral',
  'potassium-monophosphate': 'fertilizer-neutral',
  'kemira': 'fertilizer-neutral',
  'superphosphate': 'fertilizer-neutral',
  'ammonium-nitrate': 'fertilizer-neutral',
  'calcium-nitrate': 'fertilizer-neutral',
  'potassium-sulfate': 'fertilizer-neutral',
  'nitroammophoska': 'fertilizer-neutral',
  'kalimagnesia': 'fertilizer-neutral',
  'potassium-humate': 'fertilizer-neutral',
  'borofoska': 'fertilizer-neutral',
  'mag-bor': 'fertilizer-neutral',
  'boric-acid': 'acidic',

  // Folk/Other
  'tobacco-dust': 'other',
  'mustard-powder': 'other'
}

export type MixResultType = 'COMPATIBLE' | 'INCOMPATIBLE' | 'CAUTION'

export interface MixRule {
  group1: ProductGroup
  group2: ProductGroup
  result: MixResultType
  message: string
}

export const MIX_RULES: MixRule[] = [
  // Incompatible
  { group1: 'copper', group2: 'copper', result: 'INCOMPATIBLE', message: 'Медьсодержащие препараты нельзя смешивать ни с чем во избежание сильных химических ожогов растений.' },
  { group1: 'alkaline', group2: 'alkaline', result: 'INCOMPATIBLE', message: 'Щелочные удобрения нейтрализуют большинство пестицидов и биопрепаратов. Вносите их отдельно.' },
  { group1: 'bio-living', group2: 'chem-fungicide', result: 'INCOMPATIBLE', message: 'Химический фунгицид гарантированно убьет полезные живые бактерии или грибки (сенную палочку, триходерму).' },
  { group1: 'acidic', group2: 'alkaline', result: 'INCOMPATIBLE', message: 'Кислота и щелочь вступят в реакцию нейтрализации с выпадением нерастворимого осадка. Питательные вещества станут недоступны.' },
  
  // Cross with copper / alkaline
  { group1: 'copper', group2: 'bio-living', result: 'INCOMPATIBLE', message: 'Медь уничтожает живую полезную микрофлору биопрепарата.' },
  { group1: 'copper', group2: 'bio-stimulant', result: 'INCOMPATIBLE', message: 'Стимуляторы распадаются в присутствии тяжелых металлов.' },
  { group1: 'copper', group2: 'chem-fungicide', result: 'INCOMPATIBLE', message: 'Медьсодержащие фунгициды несовместимы с другими химическими фунгицидами.' },
  { group1: 'copper', group2: 'chem-insecticide', result: 'INCOMPATIBLE', message: 'Смешивание инсектицидов с медью приводит к их быстрой деградации и неэффективности.' },
  { group1: 'copper', group2: 'fertilizer-neutral', result: 'INCOMPATIBLE', message: 'Соли меди могут образовать нерастворимые соединения с фосфором из удобрений.' },
  
  { group1: 'alkaline', group2: 'bio-living', result: 'INCOMPATIBLE', message: 'Высокий pH убивает большинство полезных микроорганизмов.' },
  { group1: 'alkaline', group2: 'bio-stimulant', result: 'INCOMPATIBLE', message: 'Эпин и другие стимуляторы полностью разрушаются в щелочной среде.' },
  { group1: 'alkaline', group2: 'chem-fungicide', result: 'INCOMPATIBLE', message: 'Щелочь нейтрализует действующее вещество фунгицида.' },
  { group1: 'alkaline', group2: 'chem-insecticide', result: 'INCOMPATIBLE', message: 'Щелочь нейтрализует инсектициды (особенно фосфорорганические и пиретроиды).' },
  { group1: 'alkaline', group2: 'fertilizer-neutral', result: 'INCOMPATIBLE', message: 'Смешивание золы/доломитки с аммонийными удобрениями (селитра, мочевина) приводит к потере азота в виде аммиака.' },

  // Compatible
  { group1: 'chem-fungicide', group2: 'chem-insecticide', result: 'COMPATIBLE', message: 'Отличная баковая смесь! Позволяет одновременно защитить сад от болезней и вредителей.' },
  { group1: 'chem-fungicide', group2: 'fertilizer-neutral', result: 'COMPATIBLE', message: 'Отличная смесь. Сначала растворяйте удобрение, затем добавляйте фунгицид.' },
  { group1: 'chem-insecticide', group2: 'fertilizer-neutral', result: 'COMPATIBLE', message: 'Хорошая совместимость. Пестицид и листовая подкормка отлично работают вместе.' },
  { group1: 'bio-stimulant', group2: 'chem-fungicide', result: 'COMPATIBLE', message: 'Стимулятор поможет снять стресс, который растение получает от обработки химикатами.' },
  { group1: 'bio-stimulant', group2: 'chem-insecticide', result: 'COMPATIBLE', message: 'Стимулятор (Циркон, Эпин) отлично дополнит обработку от вредителей.' },
  { group1: 'bio-living', group2: 'bio-stimulant', result: 'COMPATIBLE', message: 'Прекрасная био-смесь. Безопасна и очень эффективна.' },
  { group1: 'bio-living', group2: 'fertilizer-neutral', result: 'COMPATIBLE', message: 'Минеральные удобрения в слабой концентрации не вредят живым бактериям.' },
  { group1: 'bio-living', group2: 'other', result: 'COMPATIBLE', message: 'Народные средства (если они не щелочные) не вредят биопрепаратам.' },
  
  // Caution
  { group1: 'bio-living', group2: 'chem-insecticide', result: 'CAUTION', message: 'Некоторые химические инсектициды могут угнетать полезную микрофлору. Лучше разнести обработки на 2-3 дня.' },
  { group1: 'acidic', group2: 'chem-fungicide', result: 'CAUTION', message: 'Борную кислоту нужно применять с осторожностью в смеси с химикатами.' },
  { group1: 'fertilizer-neutral', group2: 'fertilizer-neutral', result: 'CAUTION', message: 'Смешивайте удобрения с осторожностью. Внимание: нельзя смешивать кальциевую селитру с удобрениями, содержащими фосфор или сульфаты (выпадет гипс).' }
]
