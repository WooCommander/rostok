import type { Plant, PlantCare } from '../services/PlantService'

export const SEED_PLANTS: Plant[] = [
  {
    id: 'seed-tomat',
    name: 'Томат',
    latin_name: 'Solanum lycopersicum',
    category: 'vegetable',
    emoji: '🍅',
    description: 'Теплолюбивая культура. Требует формировки и подвязки. Чувствителен к фитофторозу.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-ogurec',
    name: 'Огурец',
    latin_name: 'Cucumis sativus',
    category: 'vegetable',
    emoji: '🥒',
    description: 'Влаголюбив, не переносит холода. Быстро поражается мучнистой росой.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧💧 Влаголюбивое'
  },
  {
    id: 'seed-perec',
    name: 'Перец',
    latin_name: 'Capsicum annuum',
    category: 'vegetable',
    emoji: '🌶',
    description: 'Требует тепла и равномерного полива. Чувствителен к тле и паутинному клещу.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-baklazhan',
    name: 'Баклажан',
    latin_name: 'Solanum melongena',
    category: 'vegetable',
    emoji: '🍆',
    description: 'Теплолюбив. Поражается колорадским жуком и паутинным клещом.',
    difficulty: 'hard',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-kapusta',
    name: 'Капуста',
    latin_name: 'Brassica oleracea',
    category: 'vegetable',
    emoji: '🥬',
    description: 'Холодостойкая. Главные враги — капустная муха, тля, кила.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧💧 Влаголюбивое'
  },
  {
    id: 'seed-kartofel',
    name: 'Картофель',
    latin_name: 'Solanum tuberosum',
    category: 'vegetable',
    emoji: '🥔',
    description: 'Основные угрозы — фитофтороз и колорадский жук. Требует окучивания.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-morkov',
    name: 'Морковь',
    latin_name: 'Daucus carota',
    category: 'vegetable',
    emoji: '🥕',
    description: 'Требует рыхлой почвы. Основной вредитель — морковная муха.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-luk',
    name: 'Лук',
    latin_name: 'Allium cepa',
    category: 'vegetable',
    emoji: '🧅',
    description: 'Чувствителен к пероноспорозу при высокой влажности.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-chesnok',
    name: 'Чеснок',
    latin_name: 'Allium sativum',
    category: 'vegetable',
    emoji: '🧄',
    description: 'Профилактика от ржавчины и фузариоза. Не поливать в дождь.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-kabachok',
    name: 'Кабачок',
    latin_name: 'Cucurbita pepo',
    category: 'vegetable',
    emoji: '🥦',
    description: 'Быстрорастущий. Склонен к мучнистой росе.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-klubnika',
    name: 'Клубника',
    latin_name: 'Fragaria × ananassa',
    category: 'berry',
    emoji: '🍓',
    description: 'Требует полива в период плодоношения. Болезни — серая гниль, мучнистая роса.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧💧 Влаголюбивое'
  },
  {
    id: 'seed-vinograd',
    name: 'Виноград',
    latin_name: 'Vitis vinifera',
    category: 'shrub',
    emoji: '🍇',
    description: 'Требует обрезки и профилактики от милдью и оидиума.',
    difficulty: 'hard',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-smorodina',
    name: 'Смородина',
    latin_name: 'Ribes nigrum',
    category: 'shrub',
    emoji: '🫐',
    description: 'Поражается почковым клещом и мучнистой росой.',
    difficulty: 'easy',
    sun: '⛅ Полутень',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-malina',
    name: 'Малина',
    latin_name: 'Rubus idaeus',
    category: 'shrub',
    emoji: '🍒',
    description: 'Требует обрезки отплодоносивших побегов. Вредители — малинный жук, тля.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧💧 Влаголюбивое'
  },
  {
    id: 'seed-yablonya',
    name: 'Яблоня',
    latin_name: 'Malus domestica',
    category: 'tree',
    emoji: '🍎',
    description: 'Парша, монилиоз — основные болезни. Весенняя обработка обязательна.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-grusha',
    name: 'Груша',
    latin_name: 'Pyrus communis',
    category: 'tree',
    emoji: '🍐',
    description: 'Поражается паршой и огнёвкой. Весенняя обработка обязательна.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-vishnya',
    name: 'Вишня',
    latin_name: 'Prunus cerasus',
    category: 'tree',
    emoji: '🍒',
    description: 'Коккомикоз — главная угроза. Обработка после цветения.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-abrikos',
    name: 'Абрикос',
    latin_name: 'Prunus armeniaca',
    category: 'tree',
    emoji: '🍑',
    description: 'Теплолюбив. Главная угроза — весенние заморозки и подопревание коры.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-persik',
    name: 'Персик',
    latin_name: 'Prunus persica',
    category: 'tree',
    emoji: '🍑',
    description: 'Требует ежегодной сильной обрезки. Уязвим к курчавости листьев.',
    difficulty: 'hard',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-ukrop',
    name: 'Укроп',
    latin_name: 'Anethum graveolens',
    category: 'herb',
    emoji: '🌿',
    description: 'Требует регулярного полива. Практически не болеет.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-bazilik',
    name: 'Базилик',
    latin_name: 'Ocimum basilicum',
    category: 'herb',
    emoji: '🌱',
    description: 'Теплолюбив, боится заморозков. Может поражаться тлёй.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-petrushka',
    name: 'Петрушка',
    latin_name: 'Petroselinum crispum',
    category: 'herb',
    emoji: '🥬',
    description: 'Регулярный полив, рыхление. Устойчива к большинству болезней.',
    difficulty: 'easy',
    sun: '⛅ Полутень',
    water: '💧 Умеренный'
  },
  // Новые 25 культур:
  {
    id: 'seed-oblepiha',
    name: 'Облепиха',
    latin_name: 'Hippophae rhamnoides',
    category: 'shrub',
    emoji: '🟠',
    description: 'Ценная поливитаминная культура. Двудомное растение (нужен мужской и женский куст). Любит солнце и легкие почвы.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-funduk',
    name: 'Фундук',
    latin_name: 'Corylus avellana',
    category: 'shrub',
    emoji: '🌰',
    description: 'Долговечный орехоплодный кустарник. Обожает влажную плодородную почву и перекрестное опыление разных сортов.',
    difficulty: 'medium',
    sun: '⛅ Полутень',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-zhimolost',
    name: 'Жимолость',
    latin_name: 'Lonicera caerulea',
    category: 'berry',
    emoji: '🫐',
    description: 'Самая ранняя ягода в саду (созревает в мае). Сверхзимостойкая. Требует посадки 2-3 разных сортов для опыления.',
    difficulty: 'easy',
    sun: '⛅ Полутень',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-kryzhovnik',
    name: 'Крыжовник',
    latin_name: 'Ribes uva-crispa',
    category: 'berry',
    emoji: '🟢',
    description: '«Северный виноград» с высоким содержанием сахаров и витамина С. Требует прореживающей обрезки и защиты от мучнистой росы.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-mushmula',
    name: 'Мушмула',
    latin_name: 'Mespilus germanica',
    category: 'tree',
    emoji: '🍊',
    description: 'Теплолюбивое субтропическое дерево. Плоды приобретают сладкий вкус после первых заморозков или вылеживания.',
    difficulty: 'hard',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-fistashki',
    name: 'Фисташки',
    latin_name: 'Pistacia vera',
    category: 'tree',
    emoji: '🥜',
    description: 'Засухоустойчивая субтропическая культура. Требует жаркого лета, каменистой почвы и наличия разнополых деревьев.',
    difficulty: 'hard',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-ayva',
    name: 'Айва',
    latin_name: 'Cydonia oblonga',
    category: 'tree',
    emoji: '🍋',
    description: 'Ароматные плоды, идеальные для варенья и запекания. Отличается высокой засухоустойчивостью и любовью к солнцу.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-granat',
    name: 'Гранат',
    latin_name: 'Punica granatum',
    category: 'shrub',
    emoji: '🔴',
    description: 'Субтропический кустарник с красивыми цветами и сочными зернами. Требует укрытия на зиму или выращивания в кадках.',
    difficulty: 'hard',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-inzhir',
    name: 'Инжир',
    latin_name: 'Ficus carica',
    category: 'shrub',
    emoji: '💜',
    description: 'Смоковница. Даёт два урожая за сезон при теплой осени. В условиях Молдовы рекомендуется укрытие кустов на зиму.',
    difficulty: 'hard',
    sun: '☀️ Солнце',
    water: '💧💧 Влаголюбивое'
  },
  {
    id: 'seed-kashtan',
    name: 'Каштан съедобный',
    latin_name: 'Castanea sativa',
    category: 'tree',
    emoji: '🌰',
    description: 'Крупное дерево с питательными крахмалистыми плодами. Предпочитает кислые, влажные почвы и мягкий климат.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-oreh-serdcevidny',
    name: 'Орех сердцевидный',
    latin_name: 'Juglans ailantifolia',
    category: 'tree',
    emoji: '🌰',
    description: 'Японский орех с плодами в форме сердечка. Вкус нежный, без горечи. Дерево декоративно и устойчиво к болезням.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-oreh-grecky',
    name: 'Орех грецкий',
    latin_name: 'Juglans regia',
    category: 'tree',
    emoji: '🌰',
    description: 'Традиционная для Молдовы мощная культура. Требует много места на участке. Даёт густую тень и ценнейшие орехи.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-mindal',
    name: 'Миндаль',
    latin_name: 'Prunus dulcis',
    category: 'tree',
    emoji: '🥜',
    description: 'Раннецветущая культура. Очень светолюбив и засухоустойчив. Боится весенних возвратных заморозков во время цветения.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-hurma',
    name: 'Хурма',
    latin_name: 'Diospyros kaki',
    category: 'tree',
    emoji: '🟠',
    description: 'Поздняя осенняя сладость. Требует теплого долгого лета и защиты от сильных зимних ветров. Нуждается в регулярном поливе.',
    difficulty: 'hard',
    sun: '☀️ Солнце',
    water: '💧💧 Влаголюбивое'
  },
  {
    id: 'seed-irga',
    name: 'Ирга',
    latin_name: 'Amelanchier',
    category: 'berry',
    emoji: '🫐',
    description: 'Сверхнеприхотливый ягодный кустарник с медовым вкусом плодов. Обожаема птицами. Устойчива к любым морозам.',
    difficulty: 'easy',
    sun: '⛅ Полутень',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-kivi',
    name: 'Киви',
    latin_name: 'Actinidia deliciosa',
    category: 'shrub',
    emoji: '🥝',
    description: 'Мощная плодовая лиана. Требует прочной шпалеры, регулярного полива и наличия мужского растения-опылителя.',
    difficulty: 'hard',
    sun: '☀️ Солнце',
    water: '💧💧 Влаголюбивое'
  },
  {
    id: 'seed-shelkovica',
    name: 'Шелковица',
    latin_name: 'Morus alba',
    category: 'tree',
    emoji: '🍇',
    description: 'Тутовник. Невероятно сладкие плоды, богатые калием и железом. Дерево засухоустойчиво и очень долговечно.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-cukkini',
    name: 'Цуккини',
    latin_name: 'Cucurbita pepo var. cylindrica',
    category: 'vegetable',
    emoji: '🥒',
    description: 'Кустовая разновидность кабачка с нежной кожицей. Плодоносит непрерывно при регулярном сборе молодых плодов.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-redis',
    name: 'Редис',
    latin_name: 'Raphanus sativus',
    category: 'vegetable',
    emoji: '🔴',
    description: 'Холодостойкая культура короткого светового дня. Для сочности и отсутствия горечи требует постоянной влажности почвы.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧💧 Влаголюбивое'
  },
  {
    id: 'seed-kukurusa',
    name: 'Кукуруза',
    latin_name: 'Zea mays',
    category: 'vegetable',
    emoji: '🌽',
    description: 'Теплолюбивая злаковая культура. Для полного опыления початков рекомендуется сажать блоком в 3-4 ряда.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-dynya',
    name: 'Дыня',
    latin_name: 'Cucumis melo',
    category: 'vegetable',
    emoji: '🍈',
    description: 'Требует максимума солнца и тепла. Для укрупнения плодов плети прищипывают после завязывания 3-4 дынь.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-arbuz',
    name: 'Арбуз',
    latin_name: 'Citrullus lanatus',
    category: 'berry',
    emoji: '🍉',
    description: 'Жаростойкая бахчевая культура. Обожает песчаные почвы и редкий, но очень глубокий полив под корень.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Засухоустойчивое'
  },
  {
    id: 'seed-chereshnya',
    name: 'Черешня',
    latin_name: 'Prunus avium',
    category: 'tree',
    emoji: '🍒',
    description: 'Раннее сладкое лакомство. Требует перекрестного опыления и защиты урожая от скворцов в период созревания.',
    difficulty: 'medium',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-sliva',
    name: 'Слива',
    latin_name: 'Prunus domestica',
    category: 'tree',
    emoji: '🟣',
    description: 'Традиционная культура садов Молдовы (чернослив). Уязвима к сливовой плодожорке и монилиозу.',
    difficulty: 'easy',
    sun: '☀️ Солнце',
    water: '💧 Умеренный'
  },
  {
    id: 'seed-kizil',
    name: 'Кизил',
    latin_name: 'Cornus mas',
    category: 'tree',
    emoji: '🔴',
    description: 'Кустарник-долгожитель, зацветающий самым первым ранней весной. Плоды богаты пектином и фитонцидами.',
    difficulty: 'easy',
    sun: '⛅ Полутень',
    water: '💧 Засухоустойчивое'
  }
]

export const SEED_CARE: PlantCare[] = [
  // Томат
  {
    id: 'care-tomat-1',
    plant_id: 'seed-tomat',
    care_type: 'spraying',
    month_from: 6,
    month_to: 9,
    temp_min: 15,
    temp_max: 35,
    description: 'Профилактика фитофтороза. Обрабатывать в сухую погоду утром или вечером.',
    products: ['Фитоспорин-М', 'Ридомил Голд', 'Хом'],
    frequency: 'раз в 10-14 дней'
  },
  {
    id: 'care-tomat-2',
    plant_id: 'seed-tomat',
    care_type: 'watering',
    month_from: 5,
    month_to: 9,
    temp_min: 10,
    temp_max: 40,
    description: 'Полив под корень, не на листья. Избегать переувлажнения.',
    products: [],
    frequency: 'раз в 2-3 дня'
  },
  {
    id: 'care-tomat-3',
    plant_id: 'seed-tomat',
    care_type: 'fertilizing',
    month_from: 6,
    month_to: 8,
    temp_min: 15,
    temp_max: 35,
    description: 'Подкормка в фазе цветения. Фосфорно-калийные удобрения.',
    products: ['Кемира Универсал', 'Монофосфат калия'],
    frequency: 'раз в 2 недели'
  },
  // Огурец
  {
    id: 'care-ogurec-1',
    plant_id: 'seed-ogurec',
    care_type: 'spraying',
    month_from: 6,
    month_to: 9,
    temp_min: 15,
    temp_max: 30,
    description: 'Профилактика мучнистой росы при перепадах температуры.',
    products: ['Топаз', 'Фитоспорин-М', 'Тиовит Джет'],
    frequency: 'раз в 14 дней'
  },
  {
    id: 'care-ogurec-2',
    plant_id: 'seed-ogurec',
    care_type: 'watering',
    month_from: 5,
    month_to: 9,
    temp_min: 15,
    temp_max: 40,
    description: 'Каждые 1-2 дня тёплой водой. Не допускать пересыхания.',
    products: [],
    frequency: 'каждые 1-2 дня'
  },
  // Виноград
  {
    id: 'care-vinograd-1',
    plant_id: 'seed-vinograd',
    care_type: 'spraying',
    month_from: 5,
    month_to: 8,
    temp_min: 15,
    temp_max: 35,
    description: 'Профилактика милдью и оидиума. Обрабатывать до и после цветения.',
    products: ['Топаз', 'Тиовит Джет', 'Ридомил Голд'],
    frequency: 'раз в 10-12 дней'
  },
  // Облепиха
  {
    id: 'care-oblepiha-1',
    plant_id: 'seed-oblepiha',
    care_type: 'watering',
    month_from: 6,
    month_to: 8,
    temp_min: 20,
    temp_max: 35,
    description: 'Обильный полив в засушливый период (по 30-40 л на куст) для налива крупных ягод.',
    products: [],
    frequency: 'раз в 10 дней'
  },
  {
    id: 'care-oblepiha-2',
    plant_id: 'seed-oblepiha',
    care_type: 'pruning',
    month_from: 3,
    month_to: 4,
    temp_min: 5,
    temp_max: 15,
    description: 'Санитарная обрезка сухих ветвей и удаление корневой поросли.',
    products: [],
    frequency: 'ежегодно весной'
  },
  // Фундук
  {
    id: 'care-funduk-1',
    plant_id: 'seed-funduk',
    care_type: 'fertilizing',
    month_from: 5,
    month_to: 7,
    temp_min: 15,
    temp_max: 30,
    description: 'Подкормка азотно-фосфорными удобрениями для закладки орехов.',
    products: ['Нитроаммофоска', 'Органика'],
    frequency: '2 раза за лето'
  },
  // Жимолость
  {
    id: 'care-zhimolost-1',
    plant_id: 'seed-zhimolost',
    care_type: 'fertilizing',
    month_from: 4,
    month_to: 5,
    temp_min: 10,
    temp_max: 25,
    description: 'Ранневесенняя подкормка древесной золой для сладости ягод.',
    products: ['Древесная зола', 'Биогумус'],
    frequency: 'в начале вегетации'
  },
  // Крыжовник
  {
    id: 'care-kryzhovnik-1',
    plant_id: 'seed-kryzhovnik',
    care_type: 'spraying',
    month_from: 4,
    month_to: 6,
    temp_min: 10,
    temp_max: 28,
    description: 'Опрыскивание от американской мучнистой росы (сферотеки).',
    products: ['Топаз', 'Тиовит Джет'],
    frequency: 'до и после цветения'
  },
  // Орех грецкий
  {
    id: 'care-oreh-grecky-1',
    plant_id: 'seed-oreh-grecky',
    care_type: 'watering',
    month_from: 10,
    month_to: 11,
    temp_min: 2,
    temp_max: 15,
    description: 'Осенний влагозарядковый полив (до 100 л на взрослое дерево) для успешной зимовки.',
    products: [],
    frequency: 'раз в год перед зимой'
  },
  // Персик
  {
    id: 'care-persik-1',
    plant_id: 'seed-persik',
    care_type: 'spraying',
    month_from: 3,
    month_to: 4,
    temp_min: 5,
    temp_max: 18,
    description: 'Обработка медьсодержащими препаратами по розовому бутону от курчавости листьев.',
    products: ['Хорус', 'Бордосская смесь 3%', 'Скор'],
    frequency: 'ранней весной 2 раза'
  },
  // Черешня
  {
    id: 'care-chereshnya-1',
    plant_id: 'seed-chereshnya',
    care_type: 'spraying',
    month_from: 5,
    month_to: 6,
    temp_min: 15,
    temp_max: 30,
    description: 'Защита от вишневой мухи и монилиоза в период налива завязи.',
    products: ['Актара', 'Скор', 'Хорус'],
    frequency: 'после цветения'
  },
  // Слива
  {
    id: 'care-sliva-1',
    plant_id: 'seed-sliva',
    care_type: 'spraying',
    month_from: 5,
    month_to: 7,
    temp_min: 15,
    temp_max: 32,
    description: 'Обработка от сливовой плодожорки и тли.',
    products: ['Конфидор', 'Фитоверм', 'Битоксибациллин'],
    frequency: 'каждые 14-20 дней'
  }
]
