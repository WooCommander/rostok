-- ============================================
-- Расширение user_settings для подписок
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'premium_expires_at') THEN
    ALTER TABLE public.user_settings ADD COLUMN premium_expires_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'subscription_provider') THEN
    ALTER TABLE public.user_settings ADD COLUMN subscription_provider TEXT; -- 'google_play' | 'web'
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'subscription_id') THEN
    ALTER TABLE public.user_settings ADD COLUMN subscription_id TEXT;
  END IF;
END $$;

-- Функция для активации/продления премиума (вызывается из вебхука)
CREATE OR REPLACE FUNCTION public.activate_premium(
  p_user_id UUID,
  p_expires_at TIMESTAMPTZ,
  p_provider TEXT,
  p_subscription_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, is_premium, premium_expires_at, subscription_provider, subscription_id)
  VALUES (p_user_id, true, p_expires_at, p_provider, p_subscription_id)
  ON CONFLICT (user_id) DO UPDATE SET
    is_premium = true,
    premium_expires_at = p_expires_at,
    subscription_provider = p_provider,
    subscription_id = COALESCE(p_subscription_id, public.user_settings.subscription_id);
END;
$$;

-- Функция для деактивации (когда подписка истекла / отменена)
CREATE OR REPLACE FUNCTION public.deactivate_premium(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_settings
  SET is_premium = false, premium_expires_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================
-- Таблица истории событий подписки
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type    TEXT        NOT NULL, -- 'activated' | 'renewed' | 'cancelled' | 'expired' | 'restored'
  provider      TEXT        NOT NULL, -- 'google_play' | 'web'
  expires_at    TIMESTAMPTZ,
  amount_rub    INTEGER,              -- сумма в рублях (если известна)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id
  ON public.subscription_events(user_id, created_at DESC);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_events_select_own" ON public.subscription_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Обновляем activate_premium — добавляем запись в историю
CREATE OR REPLACE FUNCTION public.activate_premium(
  p_user_id UUID,
  p_expires_at TIMESTAMPTZ,
  p_provider TEXT,
  p_subscription_id TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT 'activated',
  p_amount_rub INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, is_premium, premium_expires_at, subscription_provider, subscription_id)
  VALUES (p_user_id, true, p_expires_at, p_provider, p_subscription_id)
  ON CONFLICT (user_id) DO UPDATE SET
    is_premium = true,
    premium_expires_at = p_expires_at,
    subscription_provider = p_provider,
    subscription_id = COALESCE(p_subscription_id, public.user_settings.subscription_id);

  INSERT INTO public.subscription_events (user_id, event_type, provider, expires_at, amount_rub)
  VALUES (p_user_id, p_event_type, p_provider, p_expires_at, p_amount_rub);
END;
$$;

-- deactivate_premium — тоже пишет в историю
CREATE OR REPLACE FUNCTION public.deactivate_premium(
  p_user_id UUID,
  p_event_type TEXT DEFAULT 'cancelled'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider TEXT;
BEGIN
  SELECT subscription_provider INTO v_provider
  FROM public.user_settings WHERE user_id = p_user_id;

  UPDATE public.user_settings
  SET is_premium = false, premium_expires_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.subscription_events (user_id, event_type, provider, expires_at)
  VALUES (p_user_id, p_event_type, COALESCE(v_provider, 'unknown'), now());
END;
$$;
