-- 1. Добавляем счетчик комментариев в ленту
ALTER TABLE public.community_activities 
ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;

-- 2. Создаем таблицу комментариев
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES public.community_activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Включаем RLS
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Политики для комментариев
DROP POLICY IF EXISTS "Публичное чтение комментариев" ON public.community_comments;
CREATE POLICY "Публичное чтение комментариев" 
ON public.community_comments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Пользователи могут добавлять комментарии" ON public.community_comments;
CREATE POLICY "Пользователи могут добавлять комментарии" 
ON public.community_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Пользователи могут удалять свои комментарии" ON public.community_comments;
CREATE POLICY "Пользователи могут удалять свои комментарии" 
ON public.community_comments FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Создаем триггер для автоматического подсчета комментариев
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_activities 
        SET comments_count = COALESCE(comments_count, 0) + 1 
        WHERE id = NEW.activity_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_activities 
        SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
        WHERE id = OLD.activity_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_comments_count ON public.community_comments;
CREATE TRIGGER trg_community_comments_count
AFTER INSERT OR DELETE ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION update_comments_count();
