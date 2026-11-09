
import { useEffect, useState } from 'react'
import {
  UserRound,
  Mail,
  Wallet,
  ShieldCheck,
  Save,
  CreditCard,
  Crown,
  Clock3,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

type Props = {
  userId: string
  email: string
  currency: string
  onCurrencyChange: (currency: string) => void
}

type SubscriptionInfo = {
  stored_plan: string
  stored_status: string
  effective_plan: string
  effective_status: string
  trial_started_at: string | null
  trial_ends_at: string | null
}

const currencies = ['USD', 'ZAR', 'ZWG', 'BWP']

function formatDate(date: string | null) {
  if (!date) return 'Not available'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return 'Not available'

  return parsed.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ProfilePanel({
  userId,
  email,
  currency,
  onCurrencyChange,
}: Props) {
  const [name, setName] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState(currency)
  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingCurrency, setSavingCurrency] = useState(false)
  const [message, setMessage] = useState('')

  const [subscription, setSubscription] =
    useState<SubscriptionInfo | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      if (!supabase) {
        setMessage('MOVA is not connected to Supabase.')
        setLoading(false)
        setSubscriptionLoading(false)
        return
      }

      const { data, error } = await supabase.auth.getUser()

      if (cancelled) return

      if (error) {
        setMessage(error.message)
      } else {
        setName(data.user?.user_metadata?.full_name || '')
      }

      setLoading(false)
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false

    async function loadSubscription() {
      if (!supabase) {
        setSubscriptionError('MOVA is not connected to Supabase.')
        setSubscriptionLoading(false)
        return
      }

      setSubscriptionLoading(true)
      setSubscriptionError('')

      const { data, error } = await supabase.rpc('get_my_subscription')

      if (cancelled) return

      if (error) {
        setSubscriptionError(error.message)
      } else {
        const result = Array.isArray(data) ? data[0] : data

        if (result) {
          setSubscription(result as SubscriptionInfo)
        } else {
          setSubscriptionError('Subscription information was not found.')
        }
      }

      setSubscriptionLoading(false)
    }

    loadSubscription()

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    setSelectedCurrency(currency)
  }, [currency])

  async function saveName() {
    if (!supabase || !name.trim()) {
      setMessage('Please enter your name.')
      return
    }

    setSavingName(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    })

    if (error) {
      setMessage(`Could not update name: ${error.message}`)
    } else {
      setMessage('Your name has been updated.')
    }

    setSavingName(false)
  }

  async function saveCurrency() {
    if (!supabase) return

    setSavingCurrency(true)
    setMessage('')

    const { data, error } = await supabase
      .from('financial_profiles')
      .update({ currency: selectedCurrency })
      .eq('user_id', userId)
      .select('currency')
      .maybeSingle()

    if (error) {
      setMessage(`Could not update currency: ${error.message}`)
    } else if (!data) {
      setMessage('Financial profile not found. Your currency was not changed.')
    } else {
      onCurrencyChange(data.currency)
      setMessage('Your preferred currency has been updated.')
    }

    setSavingCurrency(false)
  }

  const isPro = subscription?.effective_plan === 'pro'
  const isTrial = subscription?.effective_status === 'trial'
  const isExpired = subscription?.effective_status === 'expired'

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-200">
          Account settings
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Your Profile</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage your personal information and financial preferences.
        </p>
      </div>

      <Card className="border-emerald-300/15 bg-gradient-to-br from-[#142c36] to-[#111b2b]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown size={19} className="text-emerald-200" />
            Your MOVA subscription
          </CardTitle>
        </CardHeader>

        <CardContent>
          {subscriptionLoading ? (
            <p className="text-sm text-slate-400">
              Checking your subscription...
            </p>
          ) : subscriptionError ? (
            <p role="status" className="text-sm text-rose-300">
              {subscriptionError}
            </p>
          ) : subscription ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">CURRENT PLAN</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {isPro ? 'MOVA Pro' : 'MOVA Free'}
                  </p>
                </div>

                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                  {isTrial
                    ? 'Free trial'
                    : isExpired
                      ? 'Trial expired'
                      : subscription.effective_status === 'active'
                        ? 'Active'
                        : 'Free plan'}
                </span>
              </div>

              <div className="rounded-xl border border-white/[.08] bg-black/10 p-4">
                {isTrial ? (
                  <>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                      <Clock3 size={16} />
                      Your Pro trial is active
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-300">
                      Your trial ends on {formatDate(subscription.trial_ends_at)}.
                    </p>
                  </>
                ) : isExpired ? (
                  <>
                    <p className="text-sm font-medium text-amber-200">
                      Your 7-day trial has ended
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-300">
                      Your account is now on MOVA Free. Your financial records
                      remain available.
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Trial ended: {formatDate(subscription.trial_ends_at)}
                    </p>
                  </>
                ) : isPro ? (
                  <p className="text-sm text-emerald-200">
                    Your MOVA Pro subscription is active.
                  </p>
                ) : (
                  <p className="text-xs leading-5 text-slate-300">
                    You are using the MOVA Free plan. Your core financial
                    tools remain available.
                  </p>
                )}
              </div>

              <p className="text-[11px] leading-5 text-slate-500">
                Subscription access is checked securely through your MOVA account.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound size={19} />
            Personal information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Full name
            </label>
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Enter your full name"
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm outline-none focus:border-emerald-300/40"
            />
          </div>

          <Button onClick={saveName} disabled={loading || savingName}>
            <Save size={16} className="mr-2" />
            {savingName ? 'Saving...' : 'Save name'}
          </Button>

          <div className="border-t border-white/10 pt-5">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-slate-400" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Email address</p>
                <p className="mt-1 truncate text-sm">{email}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Your email is connected to your sign-in account.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet size={19} />
            Financial preferences
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Preferred currency
            </label>
            <select
              value={selectedCurrency}
              onChange={event => setSelectedCurrency(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm"
            >
              {currencies.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={saveCurrency}
            disabled={savingCurrency || selectedCurrency === currency}
          >
            {savingCurrency ? 'Saving...' : 'Save currency'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <ShieldCheck className="mt-1 text-emerald-300" size={21} />
          <div>
            <p className="text-sm font-medium">Account security</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Your account is protected by MOVA's Supabase authentication.
              Your financial records remain linked to your account.
            </p>
          </div>
        </CardContent>
      </Card>

      {message && (
        <p
          role="status"
          className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs text-slate-300"
        >
          {message}
        </p>
      )}
    </div>
  )
}
