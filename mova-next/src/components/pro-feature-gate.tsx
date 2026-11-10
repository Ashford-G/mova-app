import { useEffect, useState } from 'react'
import { Lock, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  canAccessFeature,
  loadSubscriptionAccess,
  type ProFeature,
  type SubscriptionAccess,
} from '@/lib/subscription-access'

type Props = {
  feature: ProFeature
  onUpgrade: () => void
  children: React.ReactNode
}

export function ProFeatureGate({
  feature,
  onUpgrade,
  children,
}: Props) {
  const [access, setAccess] = useState<SubscriptionAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function checkAccess() {
      setLoading(true)
      setError('')

      try {
        const result = await loadSubscriptionAccess()

        if (!cancelled) {
          setAccess(result)
        }
      } catch (err) {
        if (!cancelled) {
          setAccess(null)
          setError(
            err instanceof Error
              ? err.message
              : 'Could not verify your subscription.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    checkAccess()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[.03] p-8 text-center">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-emerald-300/20 border-t-emerald-300" />
        <p className="mt-4 text-sm text-slate-400">
          Verifying your MOVA membership...
        </p>
      </div>
    )
  }

  if (error || !access) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-6">
        <div className="flex items-center gap-3">
          <Lock className="text-amber-200" size={20} />
          <h2 className="font-semibold text-white">
            Subscription verification required
          </h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          {error || 'MOVA could not verify your membership.'}
          {' '}Please try again before accessing this feature.
        </p>

        <Button
          className="mt-5"
          onClick={() => window.location.reload()}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (canAccessFeature(feature, access.plan)) {
    return <>{children}</>
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-emerald-300/20 bg-gradient-to-br from-[#142c36] to-[#101a2a] p-7 sm:p-9">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-200">
        <Lock size={22} />
      </div>

      <div className="mt-6 flex items-center gap-2 text-emerald-200">
        <Sparkles size={16} />
        <span className="text-xs font-semibold tracking-wider">
          MOVA PRO FEATURE
        </span>
      </div>

      <h2 className="mt-3 text-2xl font-semibold text-white">
        Unlock your financial intelligence.
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        Get deeper insights into your spending patterns, monthly
        comparisons and financial behaviour with MOVA Pro.
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-4">
        <p className="text-sm font-medium text-white">
          Included with MOVA Pro
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>• Advanced financial observations</li>
          <li>• Spending pattern analysis</li>
          <li>• Month-to-month comparisons</li>
          <li>• Deeper financial insights</li>
        </ul>
      </div>

      <Button
        className="mt-6 w-full bg-emerald-300 text-slate-950 hover:bg-emerald-200"
        onClick={onUpgrade}
      >
        Explore MOVA Pro in Profile
      </Button>

      <p className="mt-3 text-center text-xs text-slate-500">
        Your existing financial records remain yours.
      </p>
    </div>
  )
}