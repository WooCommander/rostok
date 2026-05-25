CREATE TABLE popular_mixes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    products TEXT[] NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE popular_mixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON popular_mixes
    FOR SELECT
    USING (true);

INSERT INTO popular_mixes (name, products, sort_order) VALUES
('Весенняя обработка', ARRAY['horus', 'aktara'], 1),
('Защита + антистресс', ARRAY['aktara', 'epin-extra'], 2),
('Био-коктейль', ARRAY['fitosporin', 'potassium-humate'], 3),
('Лечение летом', ARRAY['skor', 'konfidor'], 4),
('Осенняя искореняющая', ARRAY['iron-sulfate', 'carbamide'], 5),
('Тепличная био-защита', ARRAY['fitoverm', 'fitosporin'], 6),
('Стимуляция завязи', ARRAY['boric-acid', 'epin-extra'], 7),
('Картофель: жук и фитофтора', ARRAY['ridomil-gold', 'aktara'], 8),
('Лечение ран и срезов', ARRAY['topsin-m', 'zircon'], 9);
