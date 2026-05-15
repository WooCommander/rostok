-- ============================================
-- Rostok — Полный seed: новые растения + уход
-- Запускать в Supabase SQL Editor
-- ============================================

-- НОВЫЕ РАСТЕНИЯ
insert into plants (name, latin_name, category, emoji, description) values
('Черешня',  'Prunus avium',           'tree', '🍒', 'Ранняя косточковая культура. Поражается монилиозом, коккомикозом. Требует опылителей.'),
('Слива',    'Prunus domestica',       'tree', '🫐', 'Неприхотливая культура. Основные болезни — монилиоз, клястероспориоз. Плодоносит на 3-4 год.'),
('Абрикос',  'Prunus armeniaca',       'tree', '🍑', 'Теплолюбивый. Страдает от возвратных заморозков. Болезни — монилиоз, клястероспориоз.'),
('Персик',   'Prunus persica',         'tree', '🍑', 'Теплолюбивый, требует защиты от курчавости листьев и монилиоза. Ежегодная обрезка обязательна.');

-- ============================================
-- УХОД: ТОМАТ
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Томат'), 'spraying', 6, 9, 15, 35, 'Профилактика фитофтороза. В сухую погоду утром или вечером.', array['Фитоспорин-М','Ридомил Голд','Хом'], 'раз в 10-14 дней'),
((select id from plants where name='Томат'), 'watering', 5, 9, 10, 40, 'Полив под корень, не на листья. Избегать переувлажнения.', array[]::text[], 'раз в 2-3 дня'),
((select id from plants where name='Томат'), 'fertilizing', 6, 8, 15, 35, 'Подкормка в фазе цветения и завязи. Фосфорно-калийные.', array['Кемира Универсал','Монофосфат калия','Мастер'], 'раз в 2 недели'),
((select id from plants where name='Томат'), 'spraying', 5, 9, 10, 25, 'При обнаружении тли или белокрылки.', array['Актара','Конфидор','Фитоверм'], 'по необходимости');

-- ============================================
-- УХОД: ОГУРЕЦ
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Огурец'), 'watering', 5, 9, 15, 40, 'Каждые 1-2 дня тёплой водой под корень. Не допускать пересыхания.', array[]::text[], 'каждые 1-2 дня'),
((select id from plants where name='Огурец'), 'fertilizing', 6, 8, 15, 35, 'Азофоска или комплексное удобрение. В период плодоношения — калийное.', array['Азофоска','Кемира','Кристалон'], 'раз в 2 недели'),
((select id from plants where name='Огурец'), 'spraying', 7, 9, 15, 28, 'Профилактика мучнистой росы при перепадах температуры.', array['Топаз','Фитоспорин-М','Тиовит Джет'], 'раз в 14 дней'),
((select id from plants where name='Огурец'), 'spraying', 6, 9, 15, 30, 'От паутинного клеща при жаркой и сухой погоде.', array['Фитоверм','Актеллик','Би-58'], 'по необходимости');

-- ============================================
-- УХОД: ПЕРЕЦ
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Перец'), 'watering', 5, 9, 15, 38, 'Умеренный полив тёплой водой. Перец не любит переувлажнения.', array[]::text[], 'раз в 3-4 дня'),
((select id from plants where name='Перец'), 'fertilizing', 6, 8, 18, 35, 'Комплексные подкормки в период цветения и плодоношения.', array['Кемира Универсал','Агрикола','Мастер'], 'раз в 2 недели'),
((select id from plants where name='Перец'), 'spraying', 5, 9, 15, 28, 'От тли и паутинного клеща.', array['Фитоверм','Актара','Конфидор'], 'по необходимости');

-- ============================================
-- УХОД: БАКЛАЖАН
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Баклажан'), 'watering', 5, 9, 18, 38, 'Регулярный полив тёплой водой. Рыхление после полива.', array[]::text[], 'раз в 3-4 дня'),
((select id from plants where name='Баклажан'), 'spraying', 6, 8, 15, 30, 'От колорадского жука и паутинного клеща.', array['Актара','Конфидор Макси','Фитоверм'], 'по необходимости'),
((select id from plants where name='Баклажан'), 'fertilizing', 6, 8, 18, 35, 'Подкормка в фазе бутонизации и плодоношения.', array['Кемира','Агрикола для томатов'], 'раз в 2 недели');

-- ============================================
-- УХОД: КАПУСТА
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Капуста'), 'watering', 5, 9, 5, 30, 'Обильный полив, капуста влаголюбива.', array[]::text[], 'раз в 2-3 дня'),
((select id from plants where name='Капуста'), 'spraying', 5, 8, 8, 28, 'От капустной тли, белянки и совки.', array['Лепидоцид','Битоксибациллин','Актара'], 'раз в 10-14 дней'),
((select id from plants where name='Капуста'), 'spraying', 5, 7, 8, 25, 'Профилактика килы и пероноспороза.', array['Превикур','Фитоспорин-М'], 'раз в 2 недели'),
((select id from plants where name='Капуста'), 'fertilizing', 5, 7, 10, 28, 'Азотные удобрения в начале вегетации, калийные при завязывании кочана.', array['Аммиачная селитра','Кемира','Нитрофоска'], 'раз в 2-3 недели');

-- ============================================
-- УХОД: КАРТОФЕЛЬ
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Картофель'), 'spraying', 6, 8, 15, 30, 'Профилактика фитофтороза. При влажной и тёплой погоде.', array['Хом','Ридомил Голд','Фитоспорин'], 'раз в 10-14 дней'),
((select id from plants where name='Картофель'), 'spraying', 6, 8, 10, 35, 'Обработка от колорадского жука при обнаружении яйцекладок.', array['Конфидор Макси','Актара','Колорадо'], 'по необходимости'),
((select id from plants where name='Картофель'), 'fertilizing', 5, 6, 10, 28, 'Подкормка при окучивании. Калийно-фосфорные удобрения.', array['Нитрофоска','Кемира Картофельная'], 'при окучивании');

-- ============================================
-- УХОД: МОРКОВЬ
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Морковь'), 'watering', 5, 9, 8, 35, 'Умеренный полив. Избегать пересыхания — вызывает растрескивание.', array[]::text[], 'раз в 5-7 дней'),
((select id from plants where name='Морковь'), 'spraying', 5, 8, 12, 30, 'От морковной мухи и тли.', array['Актара','Инта-Вир','Искра'], 'раз в 2-3 недели'),
((select id from plants where name='Морковь'), 'fertilizing', 6, 7, 10, 30, 'Калийно-фосфорные без азота (азот вызывает ветвление корней).', array['Монофосфат калия','Суперфосфат'], 'раз в месяц');

-- ============================================
-- УХОД: ЛУК
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Лук'), 'spraying', 5, 7, 10, 25, 'Профилактика пероноспороза (ложная мучнистая роса) при влажной погоде.', array['Ридомил Голд','Хом','Профит Голд'], 'раз в 2 недели'),
((select id from plants where name='Лук'), 'watering', 5, 7, 8, 32, 'Умеренный полив. Прекратить за 3 недели до уборки.', array[]::text[], 'раз в 5-7 дней'),
((select id from plants where name='Лук'), 'spraying', 5, 7, 10, 30, 'От луковой мухи и трипса.', array['Актара','Конфидор','Каратэ'], 'по необходимости');

-- ============================================
-- УХОД: ЧЕСНОК
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Чеснок'), 'spraying', 4, 6, 8, 25, 'Профилактика ржавчины и фузариоза. В дождливую погоду.', array['Хом','Фитоспорин-М','Ридомил'], 'раз в 2 недели'),
((select id from plants where name='Чеснок'), 'watering', 4, 6, 8, 30, 'Умеренный полив весной. Прекратить за месяц до уборки.', array[]::text[], 'раз в 7-10 дней'),
((select id from plants where name='Чеснок'), 'fertilizing', 4, 5, 8, 25, 'Азотные весной для роста пера, калийные в июне.', array['Мочевина','Аммиачная селитра','Сульфат калия'], 'раз в месяц');

-- ============================================
-- УХОД: КАБАЧОК
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Кабачок'), 'watering', 5, 9, 15, 38, 'Обильный полив под корень. Влаголюбив, но не терпит застоя воды.', array[]::text[], 'раз в 3-4 дня'),
((select id from plants where name='Кабачок'), 'fertilizing', 6, 8, 15, 35, 'Комплексные подкормки в период цветения и плодоношения.', array['Кемира','Нитрофоска','Агрикола'], 'раз в 2 недели'),
((select id from plants where name='Кабачок'), 'spraying', 7, 9, 18, 30, 'Профилактика мучнистой росы во второй половине лета.', array['Топаз','Тиовит Джет','Фитоспорин-М'], 'раз в 2 недели');

-- ============================================
-- УХОД: КЛУБНИКА
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Клубника'), 'watering', 5, 8, 12, 38, 'Обильный полив в период цветения и плодоношения.', array[]::text[], 'раз в 2-3 дня'),
((select id from plants where name='Клубника'), 'spraying', 4, 5, 10, 22, 'Профилактика серой гнили до цветения. Не опрыскивать в период цветения!', array['Хорус','Свитч','Фитоспорин-М'], 'раз в 10-14 дней'),
((select id from plants where name='Клубника'), 'spraying', 4, 6, 10, 25, 'От земляничного клеща и долгоносика.', array['Фитоверм','Актеллик','Карбофос'], 'раз в 2 недели'),
((select id from plants where name='Клубника'), 'fertilizing', 4, 4, 8, 22, 'Весенняя подкормка после зимы. Азотные удобрения.', array['Аммиачная селитра','Мочевина','Нитроаммофоска'], 'однократно весной'),
((select id from plants where name='Клубника'), 'fertilizing', 8, 9, 12, 28, 'Осенняя подкормка после плодоношения для закладки почек.', array['Суперфосфат','Сульфат калия','Кемира Осенняя'], 'однократно после сбора');

-- ============================================
-- УХОД: ВИНОГРАД
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Виноград'), 'spraying', 5, 8, 15, 35, 'Профилактика милдью и оидиума. До и после цветения.', array['Топаз','Тиовит Джет','Ридомил Голд','Хорус'], 'раз в 10-12 дней'),
((select id from plants where name='Виноград'), 'spraying', 5, 8, 15, 30, 'От листовёртки и клещей.', array['Актара','Би-58','Фитоверм'], 'по необходимости'),
((select id from plants where name='Виноград'), 'fertilizing', 4, 5, 10, 25, 'Весенняя подкормка до распускания почек. Азот + микроэлементы.', array['Нитроаммофоска','Кемира Универсал','Плантафол'], 'однократно весной'),
((select id from plants where name='Виноград'), 'fertilizing', 7, 7, 18, 35, 'Подкормка в период налива ягод. Фосфор + калий.', array['Монофосфат калия','Суперфосфат','Кемира Плюс'], 'однократно'),
((select id from plants where name='Виноград'), 'watering', 4, 9, 10, 40, 'Полив при посадке и в засушливые периоды. Избегать перед уборкой.', array[]::text[], 'по необходимости');

-- ============================================
-- УХОД: СМОРОДИНА
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Смородина'), 'spraying', 3, 4, 5, 15, 'Горячий душ (80°C) до распускания почек — от почкового клеща.', array[]::text[], 'однократно ранней весной'),
((select id from plants where name='Смородина'), 'spraying', 4, 7, 10, 28, 'От мучнистой росы и тли.', array['Топаз','Тиовит Джет','Фитоверм'], 'раз в 2 недели'),
((select id from plants where name='Смородина'), 'fertilizing', 4, 4, 8, 20, 'Весенняя подкормка азотными удобрениями.', array['Мочевина','Аммиачная селитра'], 'однократно'),
((select id from plants where name='Смородина'), 'fertilizing', 8, 9, 12, 25, 'Осенняя подкормка калийно-фосфорными.', array['Суперфосфат','Сульфат калия'], 'однократно');

-- ============================================
-- УХОД: МАЛИНА
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Малина'), 'spraying', 4, 6, 10, 28, 'От малинного жука и тли. До цветения!', array['Актара','Инта-Вир','Фитоверм'], 'раз в 2 недели'),
((select id from plants where name='Малина'), 'spraying', 5, 7, 12, 28, 'Профилактика серой гнили и пурпуровой пятнистости.', array['Хорус','Фитоспорин-М','Топаз'], 'раз в 2 недели'),
((select id from plants where name='Малина'), 'watering', 5, 8, 12, 38, 'Обильный полив в период цветения и плодоношения.', array[]::text[], 'раз в 3-5 дней'),
((select id from plants where name='Малина'), 'fertilizing', 4, 4, 8, 20, 'Весенняя подкормка азотными.', array['Мочевина','Нитроаммофоска'], 'однократно');

-- ============================================
-- УХОД: ЯБЛОНЯ
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Яблоня'), 'spraying', 3, 4, 5, 12, 'Ранневесенняя обработка до распускания почек. От зимующих вредителей.', array['Препарат 30 Плюс','ДНОК','Нитрафен'], 'однократно'),
((select id from plants where name='Яблоня'), 'spraying', 4, 5, 8, 20, 'По розовому бутону — от парши, монилиоза, цветоеда.', array['Хорус','Скор','Калипсо'], 'до и после цветения'),
((select id from plants where name='Яблоня'), 'spraying', 6, 8, 15, 30, 'Летние обработки от парши и плодожорки.', array['Скор','Хорус','Дитан М-45','Инта-Вир'], 'раз в 14-21 день'),
((select id from plants where name='Яблоня'), 'fertilizing', 4, 4, 8, 18, 'Весенняя подкормка азотными до распускания почек.', array['Мочевина','Аммиачная селитра'], 'однократно'),
((select id from plants where name='Яблоня'), 'fertilizing', 6, 6, 15, 28, 'Летняя подкормка в период налива плодов.', array['Кемира Универсал','Нитроаммофоска'], 'однократно'),
((select id from plants where name='Яблоня'), 'watering', 5, 9, 10, 40, 'Полив в засушливые периоды, особенно при наливе плодов.', array[]::text[], 'по необходимости');

-- ============================================
-- УХОД: ГРУША
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Груша'), 'spraying', 3, 4, 5, 12, 'Ранневесенняя обработка до распускания почек.', array['Препарат 30 Плюс','ДНОК'], 'однократно'),
((select id from plants where name='Груша'), 'spraying', 4, 5, 8, 20, 'От парши, монилиоза до и после цветения.', array['Хорус','Скор','Бордосская смесь 1%'], 'до и после цветения'),
((select id from plants where name='Груша'), 'spraying', 6, 8, 15, 30, 'Летние обработки от парши и медяницы.', array['Скор','Хорус','Инта-Вир'], 'раз в 2-3 недели'),
((select id from plants where name='Груша'), 'fertilizing', 4, 4, 8, 18, 'Весенняя азотная подкормка.', array['Мочевина','Аммиачная селитра'], 'однократно');

-- ============================================
-- УХОД: ВИШНЯ
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Вишня'), 'spraying', 4, 5, 8, 20, 'Обработка после цветения от коккомикоза и монилиоза.', array['Хорус','Скор','Топсин-М'], 'после цветения и через 2 недели'),
((select id from plants where name='Вишня'), 'spraying', 6, 7, 15, 30, 'Летние обработки от коккомикоза при дождливой погоде.', array['Скор','Хорус','Дитан М-45'], 'раз в 2-3 недели'),
((select id from plants where name='Вишня'), 'spraying', 4, 6, 10, 25, 'От вишнёвой мухи и тли.', array['Актара','Инта-Вир','Каратэ'], 'по необходимости'),
((select id from plants where name='Вишня'), 'fertilizing', 4, 4, 8, 18, 'Весенняя азотная подкормка до цветения.', array['Мочевина','Нитроаммофоска'], 'однократно');

-- ============================================
-- УХОД: ЧЕРЕШНЯ
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Черешня'), 'spraying', 4, 5, 8, 20, 'После цветения от монилиоза и коккомикоза.', array['Хорус','Скор','Топсин-М'], 'после цветения и через 2 недели'),
((select id from plants where name='Черешня'), 'spraying', 6, 7, 15, 30, 'Летние обработки при дождливой погоде.', array['Скор','Хорус'], 'раз в 2-3 недели'),
((select id from plants where name='Черешня'), 'spraying', 4, 6, 10, 25, 'От черешнёвой тли и долгоносика.', array['Актара','Инта-Вир','Конфидор'], 'по необходимости'),
((select id from plants where name='Черешня'), 'fertilizing', 4, 4, 8, 18, 'Азотная подкормка до цветения для роста побегов.', array['Мочевина','Нитроаммофоска'], 'однократно'),
((select id from plants where name='Черешня'), 'fertilizing', 6, 6, 15, 28, 'Калийно-фосфорная подкормка в период налива ягод.', array['Монофосфат калия','Суперфосфат'], 'однократно'),
((select id from plants where name='Черешня'), 'watering', 5, 7, 12, 38, 'Полив в засушливые периоды, особенно при наливе ягод.', array[]::text[], 'раз в 7-10 дней');

-- ============================================
-- УХОД: СЛИВА
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Слива'), 'spraying', 3, 4, 5, 12, 'Ранневесенняя обработка от зимующих вредителей.', array['Препарат 30 Плюс','ДНОК'], 'однократно'),
((select id from plants where name='Слива'), 'spraying', 4, 5, 8, 20, 'От монилиоза и клястероспориоза. До и после цветения.', array['Хорус','Скор','Топсин-М'], 'до цветения и после'),
((select id from plants where name='Слива'), 'spraying', 5, 7, 12, 30, 'От сливовой плодожорки и тли.', array['Инта-Вир','Актара','Каратэ Зеон'], 'раз в 2-3 недели'),
((select id from plants where name='Слива'), 'fertilizing', 4, 4, 8, 18, 'Весенняя азотная подкормка.', array['Мочевина','Нитроаммофоска'], 'однократно'),
((select id from plants where name='Слива'), 'fertilizing', 7, 7, 15, 28, 'Подкормка при наливе плодов. Фосфор + калий.', array['Монофосфат калия','Суперфосфат'], 'однократно'),
((select id from plants where name='Слива'), 'watering', 5, 8, 10, 38, 'Полив особенно важен при наливе плодов.', array[]::text[], 'раз в 7-10 дней');

-- ============================================
-- УХОД: АБРИКОС
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Абрикос'), 'spraying', 3, 3, 3, 10, 'Ранневесенняя обработка медным купоросом до набухания почек.', array['Медный купорос','ДНОК','Бордосская смесь 3%'], 'однократно'),
((select id from plants where name='Абрикос'), 'spraying', 4, 5, 8, 20, 'От монилиоза и клястероспориоза. Критично не пропустить срок!', array['Хорус','Скор','Топсин-М'], 'до цветения, сразу после, через 10 дней'),
((select id from plants where name='Абрикос'), 'spraying', 5, 7, 15, 30, 'От тли, долгоносика и листовёртки.', array['Актара','Инта-Вир','Конфидор'], 'по необходимости'),
((select id from plants where name='Абрикос'), 'fertilizing', 4, 4, 8, 18, 'Весенняя азотная подкормка до цветения.', array['Мочевина','Аммиачная селитра'], 'однократно'),
((select id from plants where name='Абрикос'), 'fertilizing', 6, 6, 15, 30, 'Калийно-фосфорная при наливе плодов.', array['Монофосфат калия','Кемира'], 'однократно'),
((select id from plants where name='Абрикос'), 'watering', 4, 7, 10, 38, 'Полив умеренный. Избегать переувлажнения — провоцирует болезни.', array[]::text[], 'раз в 10-14 дней');

-- ============================================
-- УХОД: ПЕРСИК
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Персик'), 'spraying', 3, 4, 3, 12, 'Обработка от курчавости листьев — главная угроза персика! До набухания почек.', array['Хорус','Скор','Медный купорос','Бордосская смесь 3%'], 'в фазе "зелёного конуса" и по розовому бутону'),
((select id from plants where name='Персик'), 'spraying', 4, 5, 8, 20, 'От монилиоза и клястероспориоза после цветения.', array['Хорус','Топсин-М','Скор'], 'сразу после цветения и через 10-14 дней'),
((select id from plants where name='Персик'), 'spraying', 5, 7, 15, 30, 'От тли и клещей в период вегетации.', array['Актара','Фитоверм','Би-58'], 'по необходимости'),
((select id from plants where name='Персик'), 'fertilizing', 4, 4, 8, 18, 'Весенняя азотная подкормка до начала вегетации.', array['Мочевина','Аммиачная селитра','Нитроаммофоска'], 'однократно'),
((select id from plants where name='Персик'), 'fertilizing', 6, 6, 18, 32, 'Калийно-фосфорная при наливе плодов.', array['Монофосфат калия','Суперфосфат','Кемира'], 'однократно'),
((select id from plants where name='Персик'), 'watering', 4, 8, 12, 38, 'Регулярный полив, особенно при наливе плодов. Персик не терпит засухи.', array[]::text[], 'раз в 7-10 дней');

-- ============================================
-- УХОД: ЗЕЛЕНЬ (укроп, базилик, петрушка)
-- ============================================
insert into plant_care (plant_id, care_type, month_from, month_to, temp_min, temp_max, description, products, frequency) values
((select id from plants where name='Укроп'), 'watering', 4, 9, 8, 35, 'Регулярный полив. Не допускать пересыхания — зелень грубеет.', array[]::text[], 'раз в 2-3 дня'),
((select id from plants where name='Базилик'), 'watering', 5, 9, 18, 35, 'Умеренный полив тёплой водой. Не терпит холодной воды.', array[]::text[], 'раз в 2-3 дня'),
((select id from plants where name='Базилик'), 'spraying', 5, 9, 18, 30, 'При обнаружении тли обработать мыльным раствором или биопрепаратом.', array['Фитоверм','Мыльный раствор'], 'по необходимости'),
((select id from plants where name='Петрушка'), 'watering', 4, 9, 5, 32, 'Регулярный полив. Рыхление после каждого полива.', array[]::text[], 'раз в 3-4 дня'),
((select id from plants where name='Петрушка'), 'spraying', 5, 8, 10, 28, 'От морковной мухи — общий вредитель с морковью.', array['Актара','Инта-Вир'], 'по необходимости');
