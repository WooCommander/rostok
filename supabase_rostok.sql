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

create policy "users see own plants" on user_plants
  for all using (auth.uid() = user_id);

create policy "users see own log" on treatment_log
  for all using (auth.uid() = user_id);

create policy "users see own settings" on user_settings
  for all using (auth.uid() = user_id);

-- plants, plant_care и plant_secrets — публичные (read-only для всех)
alter table plants enable row level security;
alter table plant_care enable row level security;
alter table plant_secrets enable row level security;

create policy "plants are public" on plants for select using (true);
create policy "plant_care is public" on plant_care for select using (true);
create policy "plant_secrets is public" on plant_secrets for select using (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public) values ('garden_photos', 'garden_photos', true) on conflict (id) do nothing;

create policy "Public photos access" on storage.objects for select using (bucket_id = 'garden_photos');
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
('Петрушка',  'Petroselinum crispum',  'herb',      '🥬', 'Регулярный полив, рыхление. Устойчива к большинству болезней.');

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
