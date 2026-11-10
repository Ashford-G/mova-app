import { supabase } from '@/lib/supabase'

export type EffectivePlan = 'free' | 'pro'

export type SubscriptionStatus = {
  stored_plan: string
  stored_status: string
  effective_plan: string
  effective_status: string
  trial_started_at: string | null
  trial_ends_at: string | null
}

export type ProFeature =
  | 'financial_intelligence'
  | 'financial_health_score'
  | 'cashflow_forecast'
  | 'what_if_scenarios'
  | 'advanced_safe'
  | 'advanced_price_insights'
  | 'downloadable_reports'
  | 'smart_reminders'

export type SubscriptionAccess = {
  plan: EffectivePlan
  status: string
  isPro: boolean
  isTrial: boolean
  trialEndsAt: string | null
}

const PRO_FEATURES: ProFeature[] = [
  'financial_intelligence',
  'financial_health_score',
  'cashflow_forecast',
  'what_if_scenarios',
  'advanced_safe',
  'advanced_price_insights',
  'downloadable_reports',
  'smart_reminders',
]

export function canAccessFeature(
  feature: ProFeature,
  plan: EffectivePlan
): boolean {
  if (!PRO_FEATURES.includes(feature)) {
    return true
  }

  return plan === 'pro'
}

export async function loadSubscriptionAccess(): Promise<SubscriptionAccess> {
  if (!supabase) {
    throw new Error('MOVA is not connected to Supabase.')
  }

  const { data, error } = await supabase.rpc('get_my_subscription')

  if (error) {
    throw new Error(
      `Could not verify your MOVA subscription: ${error.message}`
    )
  }

  const result = (
    Array.isArray(data) ? data[0] : data
  ) as SubscriptionStatus | null

  if (!result) {
    throw new Error('Your subscription information could not be found.')
  }

  const isPro =
    result.effective_plan === 'pro' &&
    (
      result.effective_status === 'active' ||
      result.effective_status === 'trial'
    )

  return {
    plan: isPro ? 'pro' : 'free',
    status: result.effective_status || 'free',
    isPro,
    isTrial: isPro && result.effective_status === 'trial',
    trialEndsAt: result.trial_ends_at || null,
  }
}