-- Добавляем координаты в ленту сообщества (с округлением для приватности ~1km)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'community_activities' AND column_name = 'lat') THEN
    ALTER TABLE public.community_activities ADD COLUMN lat FLOAT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'community_activities' AND column_name = 'lng') THEN
    ALTER TABLE public.community_activities ADD COLUMN lng FLOAT;
  END IF;
END $$;

-- Индекс для быстрого поиска в радиусе
CREATE INDEX IF NOT EXISTS idx_community_activities_coords
  ON public.community_activities(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
