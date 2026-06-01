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
