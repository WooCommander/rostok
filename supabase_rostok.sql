-- ============================================
-- Rostok — Schema + Seed Data
-- Запускать в Supabase SQL Editor
-- ============================================

-- 1. PLANTS
create table if not exists plants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latin_name text,
  category text not null, -- vegetable | berry | tree | shrub | herb
  description text,
  emoji text,
  created_at timestamptz default now()
);

-- 2. PLANT CARE (правила ухода)
create table if not exists plant_care (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid references plants(id) on delete cascade,
  care_type text not null, -- watering | fertilizing | spraying | pruning
  month_from int not null,
  month_to int not null,
  temp_min float,
  temp_max float,
  description text,
  products text[],
  frequency text,
  notes text
);

-- 3. USER PLANTS (мой огород)
create table if not exists user_plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plant_id uuid references plants(id) on delete cascade,
  nickname text,
  planted_at date,
  location_note text,
  photo_url text,
  created_at timestamptz default now()
);

-- 4. TREATMENT LOG (журнал обработок)
create table if not exists treatment_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  plant_id uuid references plants(id),
  user_plant_id uuid references user_plants(id),
  treated_at date not null default current_date,
  care_type text not null,
  product text,
  dose text,
  temperature float,
  notes text,
  created_at timestamptz default now()
);

-- 5. USER SETTINGS
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  region text,
  latitude float,
  longitude float,
  temp_source text default 'auto',
  manual_temp float,
  timezone text default 'Europe/Kiev'
);

-- 6. PLANT SECRETS (секреты хорошего урожая)
create table if not exists plant_secrets (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid references plants(id) on delete cascade,
  title text not null,
  description text not null,
  secret_type text not null,
  emoji text,
  created_at timestamptz default now()
);

-- ============================================
-- RLS POLICIES
-- ============================================
alter table user_plants enable row level security;
alter table treatment_log enable row level security;
alter table user_settings enable row level security;

drop policy if exists "users see own plants" on user_plants;
create policy "users see own plants" on user_plants
  for all using (auth.uid() = user_id);

drop policy if exists "users see own log" on treatment_log;
create policy "users see own log" on treatment_log
  for all using (auth.uid() = user_id);

drop policy if exists "users see own settings" on user_settings;
create policy "users see own settings" on user_settings
  for all using (auth.uid() = user_id);

-- plants, plant_care и plant_secrets — публичные (read-only для всех)
alter table plants enable row level security;
alter table plant_care enable row level security;
alter table plant_secrets enable row level security;

drop policy if exists "plants are public" on plants;
create policy "plants are public" on plants for select using (true);

drop policy if exists "plant_care is public" on plant_care;
create policy "plant_care is public" on plant_care for select using (true);

drop policy if exists "plant_secrets is public" on plant_secrets;
create policy "plant_secrets is public" on plant_secrets for select using (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public) values ('garden_photos', 'garden_photos', true) on conflict (id) do nothing;

drop policy if exists "Public photos access" on storage.objects;
create policy "Public photos access" on storage.objects for select using (bucket_id = 'garden_photos');

drop policy if exists "Authenticated users upload photos" on storage.objects;
create policy "Authenticated users upload photos" on storage.objects for insert with check (bucket_id = 'garden_photos' and auth.role() = 'authenticated');

-- ============================================
-- SEED: PLANTS
-- ============================================
insert into plants (name, latin_name, category, emoji, description) values
('Томат',     'Solanum lycopersicum',  'vegetable', '🍅', 'Теплолюбивая культура. Требует формировки и подвязки. Чувствителен к фитофторозу.'),
('Огурец',    'Cucumis sativus',       'vegetable', '🥒', 'Влаголюбив, не переносит холода. Быстро поражается мучнистой росой.'),
('Перец',     'Capsicum annuum',       'vegetable', '🌶', 'Требует тепла и равномерного полива. Чувствителен к тле и паутинному клещу.'),
('Баклажан',  'Solanum melongena',     'vegetable', '🍆', 'Теплолюбив. Поражается колорадским жуком и паутинным клещом.'),
('Капуста',   'Brassica oleracea',     'vegetable', '🥬', 'Холодостойкая. Главные враги — капустная муха, тля, кила.'),
('Картофель', 'Solanum tuberosum',     'vegetable', '🥔', 'Основные угрозы — фитофтороз и колорадский жук. Требует окучивания.'),
('Морковь',   'Daucus carota',         'vegetable', '🥕', 'Требует рыхлой почвы. Основной вредитель — морковная муха.'),
('Лук',       'Allium cepa',           'vegetable', '🧅', 'Чувствителен к пероноспорозу при высокой влажности.'),
('Чеснок',    'Allium sativum',        'vegetable', '🧄', 'Профилактика от ржавчины и фузариоза. Не поливать в дождь.'),
('Кабачок',   'Cucurbita pepo',        'vegetable', '🥦', 'Быстрорастущий. Склонен к мучнистой росе.'),
('Клубника',  'Fragaria × ananassa',   'berry',     '🍓', 'Требует полива в период плодоношения. Болезни — серая гниль, мучнистая роса.'),
('Виноград',  'Vitis vinifera',        'shrub',     '🍇', 'Требует обрезки и профилактики от милдью и оидиума.'),
('Смородина', 'Ribes nigrum',          'shrub',     '🫐', 'Поражается почковым клещом и мучнистой росой.'),
('Малина',    'Rubus idaeus',          'shrub',     '🍒', 'Требует обрезки отплодоносивших побегов. Вредители — малинный жук, тля.'),
('Яблоня',    'Malus domestica',       'tree',      '🍎', 'Парша, монилиоз — основные болезни. Весенняя обработка обязательна.'),
('Груша',     'Pyrus communis',        'tree',      '🍐', 'Поражается паршой и огнёвкой. Весенняя обработка обязательна.'),
('Вишня',     'Prunus cerasus',        'tree',      '🍒', 'Коккомикоз — главная угроза. Обработка после цветения.'),
('Абрикос',   'Prunus armeniaca',      'tree',      '🍑', 'Теплолюбив. Главная угроза — весенние заморозки и подопревание коры.'),
('Персик',    'Prunus persica',        'tree',      '🍑', 'Требует ежегодной сильной обрезки. Уязвим к курчавости листьев.'),
('Укроп',     'Anethum graveolens',    'herb',      '🌿', 'Требует регулярного полива. Практически не болеет.'),
('Базилик',   'Ocimum basilicum',      'herb',      '🌱', 'Теплолюбив, боится заморозков. Может поражаться тлёй.'),
('Петрушка',  'Petroselinum crispum',  'herb',      '🥬', 'Регулярный полив, рыхление. Устойчива к большинству болезней.'),
('Облепиха', 'Hippophae rhamnoides', 'shrub', '🟠', 'Ценная поливитаминная культура. Двудомное растение (нужен мужской и женский куст). Любит солнце и легкие почвы.'),
('Фундук', 'Corylus avellana', 'shrub', '🌰', 'Долговечный орехоплодный кустарник. Обожает влажную плодородную почву и перекрестное опыление разных сортов.'),
('Жимолость', 'Lonicera caerulea', 'berry', '🫐', 'Самая ранняя ягода в саду (созревает в мае). Сверхзимостойкая. Требует посадки 2-3 разных сортов для опыления.'),
('Крыжовник', 'Ribes uva-crispa', 'berry', '🟢', '«Северный виноград» с высоким содержанием сахаров и витамина С. Требует прореживающей обрезки и защиты от мучнистой росы.'),
('Мушмула', 'Mespilus germanica', 'tree', '🍊', 'Теплолюбивое субтропическое дерево. Плоды приобретают сладкий вкус после первых заморозков или вылеживания.'),
('Фисташки', 'Pistacia vera', 'tree', '🥜', 'Засухоустойчивая субтропическая культура. Требует жаркого лета, каменистой почвы и наличия разнополых деревьев.'),
('Айва', 'Cydonia oblonga', 'tree', '🍋', 'Ароматные плоды, идеальные для варенья и запекания. Отличается высокой засухоустойчивостью и любовью к солнцу.'),
('Гранат', 'Punica granatum', 'shrub', '🔴', 'Субтропический кустарник с красивыми цветами и сочными зернами. Требует укрытия на зиму или выращивания в кадках.'),
('Инжир', 'Ficus carica', 'shrub', '💜', 'Смоковница. Даёт два урожая за сезон при теплой осени. В условиях Молдовы рекомендуется укрытие кустов на зиму.'),
('Каштан съедобный', 'Castanea sativa', 'tree', '🌰', 'Крупное дерево с питательными крахмалистыми плодами. Предпочитает кислые, влажные почвы и мягкий климат.'),
('Орех сердцевидный', 'Juglans ailantifolia', 'tree', '🌰', 'Японский орех с плодами в форме сердечка. Вкус нежный, без горечи. Дерево декоративно и устойчиво к болезням.'),
('Орех грецкий', 'Juglans regia', 'tree', '🌰', 'Традиционная для Молдовы мощная культура. Требует много места на участке. Даёт густую тень и ценнейшие орехи.'),
('Миндаль', 'Prunus dulcis', 'tree', '🥜', 'Раннецветущая культура. Очень светолюбив и засухоустойчив. Боится весенних возвратных заморозков во время цветения.'),
('Хурма', 'Diospyros kaki', 'tree', '🟠', 'Поздняя осенняя сладость. Требует теплого долгого лета и защиты от сильных зимних ветров. Нуждается в регулярном поливе.'),
('Ирга', 'Amelanchier', 'berry', '🫐', 'Сверхнеприхотливый ягодный кустарник с медовым вкусом плодов. Обожаема птицами. Устойчива к любым морозам.'),
('Киви', 'Actinidia deliciosa', 'shrub', '🥝', 'Мощная плодовая лиана. Требует прочной шпалеры, регулярного полива и наличия мужского растения-опылителя.'),
('Шелковица', 'Morus alba', 'tree', '🍇', 'Тутовник. Невероятно сладкие плоды, богатые калием и железом. Дерево засухоустойчиво и очень долговечно.'),
('Цуккини', 'Cucurbita pepo var. cylindrica', 'vegetable', '🥒', 'Кустовая разновидность кабачка с нежной кожицей. Плодоносит непрерывно при регулярном сборе молодых плодов.'),
('Редис', 'Raphanus sativus', 'vegetable', '🔴', 'Холодостойкая культура короткого светового дня. Для сочности и отсутствия горечи требует постоянной влажности почвы.'),
('Кукуруза', 'Zea mays', 'vegetable', '🌽', 'Теплолюбивая злаковая культура. Для полного опыления початков рекомендуется сажать блоком в 3-4 ряда.'),
('Дыня', 'Cucumis melo', 'vegetable', '🍈', 'Требует максимума солнца и тепла. Для укрупнения плодов плети прищипывают после завязывания 3-4 дынь.'),
('Арбуз', 'Citrullus lanatus', 'berry', '🍉', 'Жаростойкая бахчевая культура. Обожает песчаные почвы и редкий, но очень глубокий полив под корень.'),
('Черешня', 'Prunus avium', 'tree', '🍒', 'Раннее сладкое лакомство. Требует перекрестного опыления и защиты урожая от скворцов в период созревания.'),
('Слива', 'Prunus domestica', 'tree', '🟣', 'Традиционная культура садов Молдовы (чернослив). Уязвима к сливовой плодожорке и монилиозу.'),
('Кизил', 'Cornus mas', 'tree', '🔴', 'Кустарник-долгожитель, зацветающий самым первым ранней весной. Плоды богаты пектином и фитонцидами.');

-- ============================================
-- SEED: PLANT_CARE (Томат — полный пример)
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 6, 9, 15, 35,
  'Профилактика фитофтороза. Обрабатывать в сухую погоду утром или вечером.',
  array['Фитоспорин-М', 'Ридомил Голд', 'Хом'], 'раз в 10-14 дней'
from plants where name = 'Томат';

insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'watering', 5, 9, 10, 40,
  'Полив под корень, не на листья. Избегать переувлажнения.',
  array[]::text[], 'раз в 2-3 дня'
from plants where name = 'Томат';

insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'fertilizing', 6, 8, 15, 35,
  'Подкормка в фазе цветения. Фосфорно-калийные удобрения.',
  array['Кемира Универсал', 'Монофосфат калия'], 'раз в 2 недели'
from plants where name = 'Томат';

insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 5, 9, 10, 25,
  'При обнаружении тли или белокрылки. При t° ниже 25°C.',
  array['Актара', 'Конфидор', 'Фитоверм'], 'по необходимости'
from plants where name = 'Томат';

-- Огурец
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 6, 9, 15, 30,
  'Профилактика мучнистой росы при перепадах температуры.',
  array['Топаз', 'Фитоспорин-М', 'Тиовит Джет'], 'раз в 14 дней'
from plants where name = 'Огурец';

insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'watering', 5, 9, 15, 40,
  'Каждые 1-2 дня тёплой водой. Не допускать пересыхания.',
  array[]::text[], 'каждые 1-2 дня'
from plants where name = 'Огурец';

-- Виноград
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 5, 8, 15, 35,
  'Профилактика милдью и оидиума. Обрабатывать до и после цветения.',
  array['Топаз', 'Тиовит Джет', 'Ридомил Голд'], 'раз в 10-12 дней'
from plants where name = 'Виноград';

-- Картофель
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 6, 8, 15, 30,
  'Профилактика фитофтороза. Обрабатывать при влажной погоде.',
  array['Хом', 'Ридомил Голд', 'Фитоспорин'], 'раз в 10-14 дней'
from plants where name = 'Картофель';

insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 6, 8, 10, 35,
  'Обработка от колорадского жука при обнаружении.',
  array['Конфидор Макси', 'Актара', 'Колорадо'], 'по необходимости'
from plants where name = 'Картофель';

-- Яблоня
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 3, 5, 5, 25,
  'Весенняя обработка до распускания почек. От парши и вредителей.',
  array['Хорус', 'Скор', 'Бордосская смесь 3%'], 'трижды: до почек, розовый бутон, после цветения'
from plants where name = 'Яблоня';

-- Облепиха
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'watering', 6, 8, 20, 35,
  'Обильный полив в засушливый период (по 30-40 л на куст) для налива крупных ягод.',
  array[]::text[], 'раз в 10 дней'
from plants where name = 'Облепиха';

-- Фундук
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'fertilizing', 5, 7, 15, 30,
  'Подкормка азотно-фосфорными удобрениями для закладки орехов.',
  array['Нитроаммофоска', 'Органика'], '2 раза за лето'
from plants where name = 'Фундук';

-- Жимолость
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'fertilizing', 4, 5, 10, 25,
  'Ранневесенняя подкормка древесной золой для сладости ягод.',
  array['Древесная зола', 'Биогумус'], 'в начале вегетации'
from plants where name = 'Жимолость';

-- Крыжовник
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 4, 6, 10, 28,
  'Опрыскивание от американской мучнистой росы (сферотеки).',
  array['Топаз', 'Тиовит Джет'], 'до и после цветения'
from plants where name = 'Крыжовник';

-- Орех грецкий
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'watering', 10, 11, 2, 15,
  'Осенний влагозарядковый полив (до 100 л на взрослое дерево) для успешной зимовки.',
  array[]::text[], 'раз в год перед зимой'
from plants where name = 'Орех грецкий';

-- Черешня
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 5, 6, 15, 30,
  'Защита от вишневой мухи и монилиоза в период налива завязи.',
  array['Актара', 'Скор', 'Хорус'], 'после цветения'
from plants where name = 'Черешня';

-- Слива
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency)
select id, 'spraying', 5, 7, 15, 32,
  'Обработка от сливовой плодожорки и тли.',
  array['Конфидор', 'Фитоверм', 'Битоксибациллин'], 'каждые 14-20 дней'
from plants where name = 'Слива';
