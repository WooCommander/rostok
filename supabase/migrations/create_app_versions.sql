-- Создание таблицы для отслеживания версий приложения
CREATE TABLE IF NOT EXISTS public.app_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL UNIQUE,
    release_notes TEXT,
    download_url TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Включение RLS (Row Level Security)
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- Разрешаем чтение всем (чтобы приложение могло проверять обновления без авторизации)
CREATE POLICY "Разрешить публичное чтение app_versions" 
ON public.app_versions FOR SELECT 
USING (true);

-- (Скрипт загрузки релиза использует Service Role, который игнорирует RLS,
-- поэтому политики для INSERT/UPDATE писать не обязательно).
