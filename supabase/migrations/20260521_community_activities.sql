-- ============================================
-- Таблица community_activities
-- Хранит публичные действия огородников
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Огородник',
  action_type TEXT NOT NULL,        -- watering, fertilizing, spraying, pruning, planting, harvesting, weeding
  plant_name TEXT NOT NULL,
  plant_emoji TEXT NOT NULL DEFAULT '🌱',
  city TEXT,                         -- город из геолокации
  location_label TEXT,               -- "СНТ Ромашка", "Теплица №1" и т.д.
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_community_activities_created_at 
  ON public.community_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_activities_city 
  ON public.community_activities(city);

-- ============================================
-- Таблица user_settings: добавляем поле community_visible
-- (если колонка уже существует — пропускаем)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_settings' 
      AND column_name = 'community_visible'
  ) THEN
    ALTER TABLE public.user_settings 
      ADD COLUMN community_visible BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================
-- RLS-политики
-- ============================================
ALTER TABLE public.community_activities ENABLE ROW LEVEL SECURITY;

-- Все аутентифицированные пользователи могут ЧИТАТЬ ленту
CREATE POLICY "community_activities_select_all" ON public.community_activities
  FOR SELECT TO authenticated
  USING (true);

-- Пользователь может ДОБАВЛЯТЬ только свои записи
CREATE POLICY "community_activities_insert_own" ON public.community_activities
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может УДАЛЯТЬ только свои записи
CREATE POLICY "community_activities_delete_own" ON public.community_activities
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Анонимные пользователи тоже могут читать ленту
CREATE POLICY "community_activities_select_anon" ON public.community_activities
  FOR SELECT TO anon
  USING (true);
