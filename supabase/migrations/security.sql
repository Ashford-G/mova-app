/* ============================================================
   MOVA SECURITY FOUNDATION
   Database Row Level Security
   ============================================================

   PURPOSE:
   - Protect user financial information
   - Prevent users from accessing another user's data
   - Require authentication for private MOVA data
   - Enforce ownership at DATABASE level

   IMPORTANT:
   This security layer works together with Supabase Auth.
   Never put a Supabase secret/service-role key in app.js.
   ============================================================ */


/* ============================================================
   1. PROFILES
   ============================================================ */

ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"
ON public.profiles;

DROP POLICY IF EXISTS "profiles_insert_own"
ON public.profiles;

DROP POLICY IF EXISTS "profiles_update_own"
ON public.profiles;


CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
);


CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = (SELECT auth.uid())
);


CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = (SELECT auth.uid())
)
WITH CHECK (
  id = (SELECT auth.uid())
);


/* ============================================================
   2. TRANSACTIONS
   ============================================================ */

ALTER TABLE public.transactions
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own"
ON public.transactions;

DROP POLICY IF EXISTS "transactions_insert_own"
ON public.transactions;

DROP POLICY IF EXISTS "transactions_update_own"
ON public.transactions;

DROP POLICY IF EXISTS "transactions_delete_own"
ON public.transactions;


CREATE POLICY "transactions_select_own"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "transactions_insert_own"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "transactions_update_own"
ON public.transactions
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
)
WITH CHECK (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "transactions_delete_own"
ON public.transactions
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


/* ============================================================
   3. GOALS
   ============================================================ */

ALTER TABLE public.goals
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_select_own"
ON public.goals;

DROP POLICY IF EXISTS "goals_insert_own"
ON public.goals;

DROP POLICY IF EXISTS "goals_update_own"
ON public.goals;

DROP POLICY IF EXISTS "goals_delete_own"
ON public.goals;


CREATE POLICY "goals_select_own"
ON public.goals
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "goals_insert_own"
ON public.goals
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "goals_update_own"
ON public.goals
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
)
WITH CHECK (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "goals_delete_own"
ON public.goals
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


/* ============================================================
   4. DEBTS
   ============================================================ */

ALTER TABLE public.debts
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "debts_select_own"
ON public.debts;

DROP POLICY IF EXISTS "debts_insert_own"
ON public.debts;

DROP POLICY IF EXISTS "debts_update_own"
ON public.debts;

DROP POLICY IF EXISTS "debts_delete_own"
ON public.debts;


CREATE POLICY "debts_select_own"
ON public.debts
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "debts_insert_own"
ON public.debts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "debts_update_own"
ON public.debts
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
)
WITH CHECK (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "debts_delete_own"
ON public.debts
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


/* ============================================================
   5. MOVA SAFE CHECKS
   ============================================================ */

ALTER TABLE public.safe_checks
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "safe_checks_select_own"
ON public.safe_checks;

DROP POLICY IF EXISTS "safe_checks_insert_own"
ON public.safe_checks;

DROP POLICY IF EXISTS "safe_checks_delete_own"
ON public.safe_checks;


CREATE POLICY "safe_checks_select_own"
ON public.safe_checks
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "safe_checks_insert_own"
ON public.safe_checks
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "safe_checks_delete_own"
ON public.safe_checks
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


/* ============================================================
   6. AI INSIGHTS
   ============================================================ */

ALTER TABLE public.ai_insights
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_insights_select_own"
ON public.ai_insights;

DROP POLICY IF EXISTS "ai_insights_insert_own"
ON public.ai_insights;


CREATE POLICY "ai_insights_select_own"
ON public.ai_insights
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


CREATE POLICY "ai_insights_insert_own"
ON public.ai_insights
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
);


/* ============================================================
   7. MOVA PRICE
   ============================================================

   Price reports are community information.

   Authenticated users can READ reports.

   We are NOT allowing direct browser INSERT/UPDATE/DELETE
   yet. Later we can create a controlled reporting system.
   ============================================================ */

ALTER TABLE public.price_reports
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_reports_authenticated_read"
ON public.price_reports;


CREATE POLICY "price_reports_authenticated_read"
ON public.price_reports
FOR SELECT
TO authenticated
USING (
  true
);


/* ============================================================
   8. INDEXES
   ============================================================

   These improve the performance of RLS policies.
   ============================================================ */

CREATE INDEX IF NOT EXISTS
transactions_user_id_idx
ON public.transactions(user_id);


CREATE INDEX IF NOT EXISTS
goals_user_id_idx
ON public.goals(user_id);


CREATE INDEX IF NOT EXISTS
debts_user_id_idx
ON public.debts(user_id);


CREATE INDEX IF NOT EXISTS
safe_checks_user_id_idx
ON public.safe_checks(user_id);


CREATE INDEX IF NOT EXISTS
ai_insights_user_id_idx
ON public.ai_insights(user_id);


/* ============================================================
   MOVA SECURITY FOUNDATION COMPLETE
   ============================================================ */