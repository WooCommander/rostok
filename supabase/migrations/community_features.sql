-- 1. Добавляем поле is_premium в настройки пользователя
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 2. Создаем таблицу для лайков в сообществе
CREATE TABLE IF NOT EXISTS public.community_likes (
    activity_id UUID REFERENCES public.community_activities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (activity_id, user_id)
);

-- Включаем RLS для лайков
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

-- Политики для лайков
DROP POLICY IF EXISTS "Разрешить публичное чтение community_likes" ON public.community_likes;
CREATE POLICY "Разрешить публичное чтение community_likes" 
ON public.community_likes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Пользователи могут ставить лайки" ON public.community_likes;
CREATE POLICY "Пользователи могут ставить лайки" 
ON public.community_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Пользователи могут удалять свои лайки" ON public.community_likes;
CREATE POLICY "Пользователи могут удалять свои лайки" 
ON public.community_likes FOR DELETE 
USING (auth.uid() = user_id);

-- 3. RPC функция для безопасного переключения лайка (toggle)
CREATE OR REPLACE FUNCTION toggle_like(p_activity_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Проверяем, существует ли уже лайк
    SELECT EXISTS (
        SELECT 1 FROM public.community_likes 
        WHERE activity_id = p_activity_id AND user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
        -- Лайк уже стоит -> удаляем его и уменьшаем счетчик
        DELETE FROM public.community_likes 
        WHERE activity_id = p_activity_id AND user_id = p_user_id;

        UPDATE public.community_activities 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = p_activity_id;

        RETURN FALSE; -- Лайк убран
    ELSE
        -- Лайка нет -> ставим его и увеличиваем счетчик
        INSERT INTO public.community_likes (activity_id, user_id) 
        VALUES (p_activity_id, p_user_id);

        UPDATE public.community_activities 
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = p_activity_id;

        RETURN TRUE; -- Лайк поставлен
    END IF;
END;
$$;
