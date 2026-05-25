-- 1. Добавляем новые колонки в popular_mixes
ALTER TABLE public.popular_mixes
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0;

-- 2. Обновляем RLS политики для popular_mixes (чтобы пользователи могли добавлять свои)
-- Разрешаем чтение всех смесей (или можно только approved и pending, но проще все)
DROP POLICY IF EXISTS "Allow public read access" ON public.popular_mixes;
CREATE POLICY "Allow public read access" 
ON public.popular_mixes FOR SELECT 
USING (true);

-- Разрешаем авторизованным пользователям предлагать смеси (INSERT)
CREATE POLICY "Пользователи могут предлагать смеси" 
ON public.popular_mixes FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- 3. Создаем таблицу для голосования (mix_votes)
CREATE TABLE IF NOT EXISTS public.mix_votes (
    mix_id UUID REFERENCES public.popular_mixes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (mix_id, user_id)
);

-- Включаем RLS
ALTER TABLE public.mix_votes ENABLE ROW LEVEL SECURITY;

-- Политики для голосов
CREATE POLICY "Разрешить публичное чтение mix_votes" 
ON public.mix_votes FOR SELECT 
USING (true);

CREATE POLICY "Пользователи могут голосовать" 
ON public.mix_votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут удалять свои голоса" 
ON public.mix_votes FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Создаем RPC функцию для безопасного переключения голоса
CREATE OR REPLACE FUNCTION toggle_mix_vote(p_mix_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
    v_votes_count INTEGER;
BEGIN
    -- Проверяем, существует ли уже голос
    SELECT EXISTS (
        SELECT 1 FROM public.mix_votes 
        WHERE mix_id = p_mix_id AND user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
        -- Голос уже стоит -> удаляем его
        DELETE FROM public.mix_votes 
        WHERE mix_id = p_mix_id AND user_id = p_user_id;

        UPDATE public.popular_mixes 
        SET votes_count = GREATEST(votes_count - 1, 0)
        WHERE id = p_mix_id
        RETURNING votes_count INTO v_votes_count;

        RETURN FALSE; -- Голос убран
    ELSE
        -- Голоса нет -> ставим его
        INSERT INTO public.mix_votes (mix_id, user_id) 
        VALUES (p_mix_id, p_user_id);

        UPDATE public.popular_mixes 
        SET votes_count = COALESCE(votes_count, 0) + 1
        WHERE id = p_mix_id
        RETURNING votes_count INTO v_votes_count;

        -- Если набралось 3 голоса и статус pending, автоматически переводим в approved
        IF v_votes_count >= 3 THEN
            UPDATE public.popular_mixes
            SET status = 'approved'
            WHERE id = p_mix_id AND status = 'pending';
        END IF;

        RETURN TRUE; -- Голос поставлен
    END IF;
END;
$$;
