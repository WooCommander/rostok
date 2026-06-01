-- ============================================
-- Таблица treatment_reminders
-- Хранит напоминания о повторных обработках
-- ============================================

CREATE TABLE IF NOT EXISTS public.treatment_reminders (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id      TEXT        NOT NULL,
  user_plant_id UUID        REFERENCES public.user_plants(id) ON DELETE SET NULL,
  care_type     TEXT        NOT NULL,
  product       TEXT,
  dose          TEXT,
  remind_at_date DATE       NOT NULL,
  completed     BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_reminders_user_id
  ON public.treatment_reminders(user_id);

CREATE INDEX IF NOT EXISTS idx_treatment_reminders_remind_at_date
  ON public.treatment_reminders(remind_at_date);

-- RLS
ALTER TABLE public.treatment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders_select_own" ON public.treatment_reminders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "reminders_insert_own" ON public.treatment_reminders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_update_own" ON public.treatment_reminders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "reminders_delete_own" ON public.treatment_reminders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
