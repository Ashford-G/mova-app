import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Command,
  CreditCard,
  Gauge,
  Goal as GoalIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  PiggyBank,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,

  
} from '@/components/ui/card'

import { IntelligencePanel } from '@/components/intelligence-panel'

import { MovaPricePanel } from '@/components/mova-price-panel'

import { MoneyPositionPanel } from '@/components/money-position-panel'

import { ProfilePanel } from '@/components/profile-panel'

import { AiCoachPanel } from '@/components/ai-coach-panel'

import { ProFeatureGate } from '@/components/pro-feature-gate'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'

import {
  loadDashboardData,
  loadTransactions,
  createTransaction,
  loadGoals,
  createGoal,
  updateGoalProgress,
  loadDebts,
  createDebt,
  updateDebtBalance,
  updateSavings,
  type DashboardData,
  type Transaction,
  type TransactionInput,
  type Goal,
  type Debt,
  type DebtInput,
} from '@/lib/mova-data'

const nav = [
  { label: 'Overview', icon: LayoutDashboard, group: 'WORKSPACE' },
  { label: 'Intelligence', icon: Gauge, group: 'WORKSPACE' },
  { label: 'Transactions', icon: ArrowUpRight, group: 'MONEY' },
  { label: 'Savings', icon: PiggyBank, group: 'MONEY' },
  { label: 'Goals', icon: GoalIcon, group: 'MONEY' },
  { label: 'Debts', icon: CreditCard, group: 'MONEY' },
  { label: 'MOVA Safe', icon: ShieldCheck, group: 'MONEY' },
  { label: 'MOVA Price', icon: CreditCard, group: 'MONEY' },
  { label: 'AI Coach', icon: Sparkles, group: 'PERSONAL' },
  { label: 'Profile', icon: CircleHelp, group: 'PERSONAL' },
]

const descriptions: Record<string, string> = {
  Overview: 'Your financial position at a glance.',
  Intelligence: 'Understand patterns across your financial life.',
  Transactions: 'A single view of money moving in and out.',
  Savings: 'Track the money you have actually set aside.',
  Goals: 'Give your next milestone a clear plan.',
  Debts: 'Understand and manage what you owe.',
  'MOVA Safe': 'Make more confident purchase decisions.',
  'MOVA Price': 'Make more informed price decisions.',
  'AI Coach': 'A thinking partner for your money decisions.',
  Profile: 'Your account and preferences.',
}

type SafeAssessment = {
  id: string
  itemName: string
  purchasePrice: number
  availableMoney: number
  essentialExpenses: number
  upcomingObligations: number
  savingsCommitments: number
  spendableMoney: number
  remainingAfterPurchase: number
  riskLevel: 'low' | 'medium' | 'high' | 'unknown'
  riskScore: number
  explanation: string
  createdAt: string
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

function getSafeDecision(
  purchasePrice: number,
  availableMoney: number,
  essentialExpenses: number,
  upcomingObligations: number,
  savingsCommitments: number
) {
  const totalCommitments =
    essentialExpenses + upcomingObligations + savingsCommitments

  const spendableMoney = availableMoney - totalCommitments
  const remainingAfterPurchase = spendableMoney - purchasePrice

  let riskLevel: 'low' | 'medium' | 'high'
  let riskScore: number
  let explanation: string

  if (spendableMoney < 0 || purchasePrice > spendableMoney) {
    riskLevel = 'high'
    riskScore = 90

    explanation =
      spendableMoney < 0
        ? 'Your available money does not cover the commitments you entered. Protect those commitments before making this purchase.'
        : 'This purchase would use money already needed for your essential expenses, upcoming obligations or savings commitments.'
  } else if (
    remainingAfterPurchase < Math.max(availableMoney * 0.1, 0.01)
  ) {
    riskLevel = 'medium'
    riskScore = 55

    explanation =
      'You can cover this purchase based on the figures entered, but it would leave you with a small cash buffer. Consider waiting or choosing a cheaper option.'
  } else {
    riskLevel = 'low'
    riskScore = 15

    explanation =
      'Based on the figures you entered, this purchase fits after your listed commitments and leaves at least a 10% buffer of your available money.'
  }

  return {
    spendableMoney,
    remainingAfterPurchase,
    riskLevel,
    riskScore,
    explanation,
  }
}

function mapSafeAssessment(row: any): SafeAssessment {
  let submitted: any = {}

  try {
    submitted = JSON.parse(row.submitted_value || '{}')
  } catch {
    submitted = {}
  }

  const storedRiskLevel = String(row.risk_level || 'unknown')

  const riskLevel: SafeAssessment['riskLevel'] =
    storedRiskLevel === 'low' || storedRiskLevel === 'affordable'
      ? 'low'
      : storedRiskLevel === 'medium' || storedRiskLevel === 'be_careful'
        ? 'medium'
        : storedRiskLevel === 'high' || storedRiskLevel === 'not_affordable'
          ? 'high'
          : 'unknown'

  return {
    id: row.id,
    itemName: submitted.itemName || submitted.purchaseName || 'Purchase assessment',
    purchasePrice: Number(submitted.purchasePrice ?? 0),
    availableMoney: Number(submitted.availableMoney ?? 0),
    essentialExpenses: Number(submitted.essentialExpenses ?? 0),
    upcomingObligations: Number(submitted.upcomingObligations ?? 0),
    savingsCommitments: Number(submitted.savingsCommitments ?? 0),
    spendableMoney: Number(
      submitted.spendableMoney ?? submitted.moneyAfterCommitments ?? 0
    ),
    remainingAfterPurchase: Number(
      submitted.remainingAfterPurchase ?? submitted.moneyAfterPurchase ?? 0
    ),
    riskLevel,
    riskScore: Number(row.risk_score ?? 0),
    explanation: row.explanation || '',
    createdAt: row.created_at,
  }
}

function getSafeRiskLabel(riskLevel: SafeAssessment['riskLevel']) {
  if (riskLevel === 'low') return 'Affordable'
  if (riskLevel === 'medium') return 'Be careful'
  if (riskLevel === 'high') return 'Not affordable right now'
  return 'Assessment unavailable'
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return String(error.message)
  }

  return String(error)
}

export function AppShell({
  email,
  userId,
  onSignOut,
}: {
  email: string
  userId: string
  onSignOut: () => void
}) {
  const [active, setActive] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showBalance, setShowBalance] = useState(true)

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [transactionSaving, setTransactionSaving] = useState(false)
  const [transactionMessage, setTransactionMessage] = useState('')
  const [transactionFilter, setTransactionFilter] = useState<
    'all' | 'income' | 'expense' | 'transfer'
  >('all')
  const [transactionType, setTransactionType] =
    useState<TransactionInput['type']>('expense')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionCategory, setTransactionCategory] = useState('Food')
  const [transactionDescription, setTransactionDescription] = useState('')
  const [transactionDate, setTransactionDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })

  // SAVINGS
  const [savingsAmount, setSavingsAmount] = useState('')
  const [savingsSaving, setSavingsSaving] = useState(false)
  const [savingsMessage, setSavingsMessage] = useState('')

  const [goals, setGoals] = useState<Goal[]>([])
  const [goalLoading, setGoalLoading] = useState(false)
  const [goalSaving, setGoalSaving] = useState(false)
  const [goalMessage, setGoalMessage] = useState('')
  const [goalTitle, setGoalTitle] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>({})
  const [progressSaving, setProgressSaving] = useState<string | null>(null)

  const [debts, setDebts] = useState<Debt[]>([])
  const [debtLoading, setDebtLoading] = useState(false)
  const [debtSaving, setDebtSaving] = useState(false)
  const [debtMessage, setDebtMessage] = useState('')
  const [debtCreditor, setDebtCreditor] = useState('')
  const [debtBalance, setDebtBalance] = useState('')
  const [debtInterestRate, setDebtInterestRate] = useState('0')
  const [debtMonthlyPayment, setDebtMonthlyPayment] = useState('')
  const [debtDueDate, setDebtDueDate] = useState('')
  const [debtBalanceInputs, setDebtBalanceInputs] = useState<Record<string, string>>({})
  const [debtUpdating, setDebtUpdating] = useState<string | null>(null)

  // MOVA SAFE
  const [safeItemName, setSafeItemName] = useState('')
  const [safePurchasePrice, setSafePurchasePrice] = useState('')
  const [safeAvailableMoney, setSafeAvailableMoney] = useState('')
  const [safeEssentialExpenses, setSafeEssentialExpenses] = useState('0')
  const [safeUpcomingObligations, setSafeUpcomingObligations] = useState('0')
  const [safeSavingsCommitments, setSafeSavingsCommitments] = useState('0')
  const [safeSaving, setSafeSaving] = useState(false)
  const [safeLoading, setSafeLoading] = useState(false)
  const [safeMessage, setSafeMessage] = useState('')
  const [safeHistory, setSafeHistory] = useState<SafeAssessment[]>([])
  const [latestSafeAssessment, setLatestSafeAssessment] =
    useState<SafeAssessment | null>(null)

  const groups = ['WORKSPACE', 'MONEY', 'PERSONAL']

  useEffect(() => {
    let activeRequest = true

    async function fetchDashboard() {
      setLoading(true)
      setDataError(null)

      try {
        const result = await loadDashboardData(userId)
        if (activeRequest) setDashboard(result)
      } catch (error) {
        if (activeRequest) {
          setDataError(getErrorMessage(error) || 'Unable to load your financial data.')
        }
      } finally {
        if (activeRequest) setLoading(false)
      }
    }

    fetchDashboard()

    return () => {
      activeRequest = false
    }
  }, [userId])

  // Load the current savings balance when the Savings section is opened.
  useEffect(() => {
    if (active !== 'Savings') return

    setSavingsAmount(String(dashboard?.currentSavings ?? 0))
    setSavingsMessage('')
  }, [active, dashboard?.currentSavings])

  useEffect(() => {
    if (active !== 'Transactions') return

    let cancelled = false

    async function fetchTransactions() {
      setTransactionLoading(true)
      setTransactionMessage('')

      try {
        const result = await loadTransactions(userId)
        if (!cancelled) setTransactions(result)
      } catch (error) {
        if (!cancelled) {
          setTransactionMessage(
            getErrorMessage(error) || 'Could not load transactions.'
          )
        }
      } finally {
        if (!cancelled) setTransactionLoading(false)
      }
    }

    fetchTransactions()
    return () => { cancelled = true }
  }, [active, userId])

  useEffect(() => {
    if (active !== 'Goals') return

    let cancelled = false

    async function fetchGoals() {
      setGoalLoading(true)
      setGoalMessage('')

      try {
        const result = await loadGoals(userId)
        if (!cancelled) {
          setGoals(result)
          setProgressInputs(
            Object.fromEntries(result.map(goal => [goal.id, String(goal.saved)]))
          )
        }
      } catch (error) {
        if (!cancelled) {
          setGoalMessage(
            getErrorMessage(error) || 'Could not load goals.'
          )
        }
      } finally {
        if (!cancelled) setGoalLoading(false)
      }
    }

    fetchGoals()
    return () => { cancelled = true }
  }, [active, userId])

  useEffect(() => {
    if (active !== 'Debts') return

    let cancelled = false

    async function fetchDebts() {
      setDebtLoading(true)
      setDebtMessage('')

      try {
        const result = await loadDebts(userId)

        if (!cancelled) {
          setDebts(result)
          setDebtBalanceInputs(
            Object.fromEntries(
              result.map(debt => [debt.id, String(debt.balance)])
            )
          )
        }
      } catch (error) {
        if (!cancelled) {
          setDebtMessage(
            getErrorMessage(error) || 'Could not load debts.'
          )
        }
      } finally {
        if (!cancelled) setDebtLoading(false)
      }
    }

    fetchDebts()
    return () => { cancelled = true }
  }, [active, userId])

  // Load MOVA Safe purchase affordability history.
  useEffect(() => {
    if (active !== 'MOVA Safe') return

    let cancelled = false

    async function fetchSafeHistory() {
      if (!supabase || !isSupabaseConfigured) {
        setSafeMessage('MOVA is not connected to Supabase.')
        return
      }

      setSafeLoading(true)
      setSafeMessage('')

      try {
        const { data, error } = await supabase
          .from('safe_checks')
          .select(
            'id, check_type, submitted_value, risk_level, risk_score, explanation, created_at'
          )
          .eq('user_id', userId)
          .eq('check_type', 'purchase_affordability')
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        if (!cancelled) {
          const assessments = (data ?? []).map(mapSafeAssessment)
          setSafeHistory(assessments)

          if (assessments.length > 0 && !latestSafeAssessment) {
            setLatestSafeAssessment(assessments[0])
          }
        }
      } catch (error) {
        if (!cancelled) {
          setSafeMessage(
            `Could not load previous assessments: ${getErrorMessage(error)}`
          )
        }
      } finally {
        if (!cancelled) setSafeLoading(false)
      }
    }

    fetchSafeHistory()

    return () => {
      cancelled = true
    }
  }, [active, userId])

  async function refreshDashboard() {
    const result = await loadDashboardData(userId)
    setDashboard(result)
  }

  async function handleUpdateSavings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingsSaving) return

    const trimmedAmount = savingsAmount.trim()
    const amount = Number(trimmedAmount)

    if (
      trimmedAmount === '' ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setSavingsMessage('Enter a valid savings balance of zero or more.')
      return
    }

    setSavingsSaving(true)
    setSavingsMessage('')

    try {
      const savedAmount = await updateSavings(userId, amount)

      await refreshDashboard()

      setSavingsAmount(String(savedAmount))
      setSavingsMessage('Your savings balance has been updated successfully.')
    } catch (error) {
      setSavingsMessage(
        getErrorMessage(error) || 'Could not update your savings balance.'
      )
    } finally {
      setSavingsSaving(false)
    }
  }

  async function handleCreateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (transactionSaving) return

    setTransactionSaving(true)
    setTransactionMessage('')

    try {
      await createTransaction(userId, {
        amount: Number(transactionAmount),
        type: transactionType,
        category: transactionCategory,
        description: transactionDescription,
        date: transactionDate,
      })

      const [updatedTransactions, updatedDashboard] = await Promise.all([
        loadTransactions(userId),
        loadDashboardData(userId),
      ])

      setTransactions(updatedTransactions)
      setDashboard(updatedDashboard)
      setTransactionAmount('')
      setTransactionDescription('')
      setTransactionType('expense')
      setTransactionCategory('Food')
      setTransactionMessage('Transaction saved successfully.')
    } catch (error) {
      setTransactionMessage(
        getErrorMessage(error) || 'Could not save transaction.'
      )
    } finally {
      setTransactionSaving(false)
    }
  }

  async function handleCreateGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (goalSaving) return

    setGoalSaving(true)
    setGoalMessage('')

    try {
      const newGoal = await createGoal(userId, {
        title: goalTitle,
        target: Number(goalTarget),
        deadline: goalDeadline || null,
      })

      setGoals(current => [newGoal, ...current])
      setProgressInputs(current => ({
        ...current,
        [newGoal.id]: String(newGoal.saved),
      }))

      setGoalTitle('')
      setGoalTarget('')
      setGoalDeadline('')
      setGoalMessage('Your goal was created successfully.')

      await refreshDashboard()
    } catch (error) {
      setGoalMessage(
        getErrorMessage(error) || 'Could not create your goal.'
      )
    } finally {
      setGoalSaving(false)
    }
  }

  async function handleUpdateProgress(
    event: FormEvent<HTMLFormElement>,
    goal: Goal
  ) {
    event.preventDefault()
    if (progressSaving) return

    setProgressSaving(goal.id)
    setGoalMessage('')

    try {
      const updatedGoal = await updateGoalProgress(
        userId,
        goal.id,
        Number(progressInputs[goal.id])
      )

      setGoals(current =>
        current.map(item => item.id === goal.id ? updatedGoal : item)
      )

      setGoalMessage(`Progress updated for ${goal.title}.`)
      await refreshDashboard()
    } catch (error) {
      setGoalMessage(
        getErrorMessage(error) || 'Could not update goal progress.'
      )
    } finally {
      setProgressSaving(null)
    }
  }

  async function handleCreateDebt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (debtSaving) return

    setDebtSaving(true)
    setDebtMessage('')

    try {
      const input: DebtInput = {
        creditor: debtCreditor,
        balance: Number(debtBalance),
        interestRate: Number(debtInterestRate),
        monthlyPayment: Number(debtMonthlyPayment || 0),
        dueDate: debtDueDate || null,
      }

      const newDebt = await createDebt(userId, input)

      setDebts(current => [newDebt, ...current])
      setDebtBalanceInputs(current => ({
        ...current,
        [newDebt.id]: String(newDebt.balance),
      }))

      setDebtCreditor('')
      setDebtBalance('')
      setDebtInterestRate('0')
      setDebtMonthlyPayment('')
      setDebtDueDate('')
      setDebtMessage('Debt record created successfully.')

      await refreshDashboard()
    } catch (error) {
      setDebtMessage(
        getErrorMessage(error) || 'Could not create debt record.'
      )
    } finally {
      setDebtSaving(false)
    }
  }

  async function handleUpdateDebtBalance(
    event: FormEvent<HTMLFormElement>,
    debt: Debt
  ) {
    event.preventDefault()
    if (debtUpdating) return

    setDebtUpdating(debt.id)
    setDebtMessage('')

    try {
      const updatedDebt = await updateDebtBalance(
        userId,
        debt.id,
        Number(debtBalanceInputs[debt.id])
      )

      setDebts(current =>
        current.map(item => item.id === debt.id ? updatedDebt : item)
      )

      setDebtBalanceInputs(current => ({
        ...current,
        [debt.id]: String(updatedDebt.balance),
      }))

      setDebtMessage(`Outstanding balance updated for ${debt.creditor}.`)
      await refreshDashboard()
    } catch (error) {
      setDebtMessage(
        getErrorMessage(error) || 'Could not update debt balance.'
      )
    } finally {
      setDebtUpdating(null)
    }
  }

  // MOVA SAFE SAVE FUNCTION
  async function handleSafeAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (safeSaving) return

    if (!supabase || !isSupabaseConfigured) {
      setSafeMessage('MOVA is not connected to Supabase.')
      return
    }

    const purchasePrice = Number(safePurchasePrice)
    const availableMoney = Number(safeAvailableMoney)
    const essentialExpenses = Number(safeEssentialExpenses)
    const upcomingObligations = Number(safeUpcomingObligations)
    const savingsCommitments = Number(safeSavingsCommitments)

    const amounts = [
      purchasePrice,
      availableMoney,
      essentialExpenses,
      upcomingObligations,
      savingsCommitments,
    ]

    if (
      !safeItemName.trim() ||
      amounts.some(amount => !Number.isFinite(amount) || amount < 0) ||
      purchasePrice <= 0 ||
      availableMoney <= 0
    ) {
      setSafeMessage(
        'Enter a purchase name, a purchase price greater than zero, available money greater than zero, and valid commitment amounts.'
      )
      return
    }

    setSafeSaving(true)
    setSafeMessage('')

    try {
      const decision = getSafeDecision(
        purchasePrice,
        availableMoney,
        essentialExpenses,
        upcomingObligations,
        savingsCommitments
      )

      const submitted = {
        itemName: safeItemName.trim(),
        purchasePrice,
        availableMoney,
        essentialExpenses,
        upcomingObligations,
        savingsCommitments,
        spendableMoney: decision.spendableMoney,
        remainingAfterPurchase: decision.remainingAfterPurchase,
      }

      const { error } = await supabase
        .from('safe_checks')
        .insert({
          user_id: userId,
          check_type: 'purchase_affordability',
          submitted_value: JSON.stringify(submitted),
          risk_level: decision.riskLevel,
          risk_score: decision.riskScore,
          explanation: decision.explanation,
        })

      if (error) {
        console.error('MOVA Safe database insert error:', error)
        throw error
      }

      const assessment: SafeAssessment = {
        id: `local-${Date.now()}`,
        ...submitted,
        riskLevel: decision.riskLevel,
        riskScore: decision.riskScore,
        explanation: decision.explanation,
        createdAt: new Date().toISOString(),
      }

      setLatestSafeAssessment(assessment)

      setSafeHistory(current =>
        [assessment, ...current].slice(0, 10)
      )

      setSafeMessage('Your assessment has been saved successfully.')

    } catch (error: unknown) {
      console.error('MOVA Safe save error:', error)

      setSafeMessage(
        `Could not save assessment: ${getErrorMessage(error)}`
      )
    } finally {
      setSafeSaving(false)
    }
  }

  const currency = dashboard?.currency || 'USD'

  const totalDebt =
    dashboard?.debts.reduce((total, debt) => total + debt.balance, 0) ?? 0

  const totalGoalSaved =
    dashboard?.goals.reduce((total, goal) => total + goal.saved, 0) ?? 0

  const totalGoalTarget =
    dashboard?.goals.reduce((total, goal) => total + goal.target, 0) ?? 0

  const goalProgress =
    totalGoalTarget > 0
      ? Math.min(100, (totalGoalSaved / totalGoalTarget) * 100)
      : 0

  const totalDebtOnPage = debts.reduce(
    (total, debt) => total + debt.balance,
    0
  )

  const filteredTransactions = transactions.filter(transaction => {
    if (transactionFilter === 'all') return true
    if (transactionFilter === 'income') return transaction.direction === 'in'
    if (transactionFilter === 'expense') return transaction.direction === 'out'
    return transaction.direction === 'transfer'
  })

  const sidebar = (
    <aside className="flex h-full min-h-0 flex-col border-r border-white/[.07] bg-[#0b1422]">
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-white/[.07] px-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-300 text-slate-950">
          <Wallet size={19} />
        </div>
        <div>
          <div className="font-bold tracking-[.2em]">MOVA</div>
          <div className="text-[9px] tracking-[.22em] text-slate-500">MONEY OS</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
        {groups.map(group => (
          <div key={group} className="mb-6">
            <p className="mb-2 px-3 text-[9px] font-semibold tracking-[.2em] text-slate-600">
              {group}
            </p>
            <div className="space-y-1">
              {nav.filter(item => item.group === group).map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    setActive(item.label)
                    setMobileOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                   active === item.label
  ? 'bg-emerald-300/15 text-[#f4fff9] ring-1 ring-inset ring-emerald-300/30 shadow-[0_0_18px_rgba(32,212,154,0.08)]'
  : 'text-slate-400 hover:bg-white/5 hover:text-white' 
                  }`} style={
  active === item.label
    ? {
        color: '#f4fff9',
        backgroundColor: 'rgba(32, 212, 154, 0.16)',
        border: '1px solid rgba(32, 212, 154, 0.35)',
      }
    : undefined
                  }
                >
                  <item.icon size={17} />
                  {item.label}
                  {item.label === 'AI Coach' && (
                    <span className="ml-auto rounded-md bg-white/8 px-1.5 py-0.5 text-[9px]">AI</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto shrink-0 p-4">
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] p-4">
          <div className="flex items-center gap-2 text-emerald-200">
            <Sparkles size={15} />
            <span className="text-xs font-semibold">MOVA Pro</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            More clarity for every financial decision.
          </p>
          <button
            onClick={() => {
              setActive('Profile')
              setMobileOpen(false)
            }}
            className="mt-3 text-xs font-semibold text-emerald-200"
          >
            Explore membership →
          </button>
        </div>

        <button
          onClick={onSignOut}
          className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-500 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[#080f1b] text-slate-100">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block">
        {sidebar}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="relative h-full w-[280px]">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-[248px]">
<header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/[.07] bg-[#080f1b]/95 px-3 backdrop-blur-xl sm:px-5 md:px-8">
  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 lg:hidden"
      onClick={() => setMobileOpen(true)}
    >
      <Menu size={19} />
    </Button>

    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">{active}</p>
      <p className="hidden text-[11px] text-slate-500 sm:block">
        {descriptions[active]}
      </p>
    </div>
  </div>

  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
    <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Search">
      <Search size={17} />
    </Button>

    <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Notifications">
      <Bell size={17} />
    </Button>

    <div className="ml-1 flex items-center gap-2 border-l border-white/10 pl-2 sm:ml-2 sm:pl-3">
      <button
        type="button"
        onClick={() => {
          setActive('Profile')
          setMobileOpen(false)
        }}
        aria-label="Open Profile"
        title="Open Profile"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-white transition hover:bg-emerald-300/20 hover:ring-2 hover:ring-emerald-300/40 active:scale-95"
      >
        {email.slice(0, 1).toUpperCase()}
      </button>

      <span className="hidden max-w-[140px] truncate text-xs text-slate-300 sm:block">
        {email}
      </span>

      <ChevronDown size={14} className="hidden text-slate-500 sm:block" />
    </div>

    <button
      onClick={onSignOut}
      aria-label="Sign out"
      title="Sign out"
      className="ml-1 flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[.07] px-3 text-rose-200 transition hover:bg-rose-300/15 active:scale-95"
    >
      <LogOut size={17} />
      <span className="hidden text-xs font-semibold sm:inline">Sign out</span>
    </button>
  </div>
</header>

        <main className="mx-auto max-w-[1440px] p-5 md:p-8">
          {active === 'Overview' ? (
            <>
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Your financial overview</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                    Good to see you.
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">
                    A calmer, clearer picture starts here.
                  </p>
                </div>
                <Badge>{loading ? 'Loading data' : 'Live account data'}</Badge>
              </div>

              {dataError && (
                <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
                  <p className="font-semibold">Could not load financial data</p>
                  <p className="mt-1 text-xs leading-5 text-red-200/70">{dataError}</p>
                </div>
              )}

              

              <MoneyPositionPanel
  userId={userId}
  currency={currency}
  savings={dashboard?.currentSavings ?? 0}
  debts={dashboard?.debts ?? []}
/>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Monthly income', icon: ArrowDownLeft, value: dashboard?.transactionIncome ?? 0 },
                  { label: 'Monthly expenses', icon: ArrowUpRight, value: dashboard?.transactionExpenses ?? 0 },
                  { label: 'Outstanding debt', icon: CreditCard, value: totalDebt },
                  { label: 'Goals progress', icon: GoalIcon, value: totalGoalSaved },
                ].map(item => (
                  <Card key={item.label}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs">{item.label}</span>
                        <item.icon size={16} />
                      </div>
                      <p className="mt-4 text-2xl font-semibold">
                        {loading ? '...' : showBalance ? formatMoney(item.value, currency) : '••••••'}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {item.label === 'Goals progress'
                          ? `${dashboard?.goals.length ?? 0} goals · ${goalProgress.toFixed(0)}% of targets`
                          : item.label === 'Outstanding debt'
                            ? `${dashboard?.debts.length ?? 0} debt records`
                            : 'Current calendar month'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
                <Card>
                  <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="grid min-h-36 place-items-center text-sm text-slate-500">
                        Loading your transactions...
                      </div>
                    ) : dashboard?.transactions.length ? (
                      <div className="space-y-1">
                        {dashboard.transactions.map(transaction => (
                          <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[.03]">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                                transaction.direction === 'in' ? 'bg-emerald-300/10 text-emerald-200' :
                                transaction.direction === 'transfer' ? 'bg-sky-300/10 text-sky-200' :
                                'bg-rose-300/10 text-rose-200'
                              }`}>
                                {transaction.direction === 'in' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-200">{transaction.title}</p>
                                <p className="mt-1 text-[10px] text-slate-500">{transaction.category} · {transaction.date}</p>
                              </div>
                            </div>
                            <p className="shrink-0 text-sm font-semibold">
                              {transaction.direction === 'in' ? '+' : transaction.direction === 'out' ? '−' : ''}
                              {showBalance ? formatMoney(transaction.amount, currency) : '••••'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-white/10 px-5 text-center">
                        <div>
                          <p className="text-sm font-medium text-slate-300">No transactions yet</p>
                          <p className="mt-1 text-xs text-slate-500">Your recorded transactions will appear here.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Financial focus</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-emerald-300/10 p-2 text-emerald-200"><ShieldCheck size={16} /></div>
                        <div>
                          <p className="text-xs font-medium">Build your financial safety net</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Your current savings are {loading ? 'loading' : formatMoney(dashboard?.currentSavings ?? 0, currency)}.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-sky-300/10 p-2 text-sky-200"><Sparkles size={16} /></div>
                        <div>
                          <p className="text-xs font-medium">Make informed decisions</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            You have {dashboard?.goals.length ?? 0} savings goals and {dashboard?.debts.length ?? 0} debt records.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>

  ) : active === 'Intelligence' ? (
  <ProFeatureGate
    feature="financial_intelligence"
    onUpgrade={() => setActive('Profile')}
  >
    <IntelligencePanel
      userId={userId}
      currency={currency}
      currentSavings={dashboard?.currentSavings ?? 0}
      debts={dashboard?.debts ?? []}
      goals={dashboard?.goals ?? []}
    />
  </ProFeatureGate>
          ) : active === 'Savings' ? (
            <div className="mx-auto max-w-3xl space-y-6">
              <div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <PiggyBank size={18} />
                  <span className="text-xs font-semibold tracking-wider">ACTUAL SAVINGS BALANCE</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
                  Your savings
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Record the total money you have actually set aside. This balance is separate from the progress you record against individual savings goals.
                </p>
              </div>

              <Card className="border-emerald-300/15 bg-gradient-to-br from-[#142c36] to-[#111b2b]">
                <CardContent className="p-6 md:p-8">
                  <p className="text-xs font-medium tracking-wider text-emerald-100/70">
                    CURRENT SAVINGS
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                    {loading
                      ? 'Loading...'
                      : showBalance
                        ? formatMoney(dashboard?.currentSavings ?? 0, currency)
                        : '••••••'}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Your latest recorded savings balance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Update your savings balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateSavings} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">
                        Total money currently saved ({currency})
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={savingsAmount}
                        onChange={event => setSavingsAmount(event.target.value)}
                        placeholder="e.g. 500"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-4 text-lg text-white outline-none focus:border-emerald-300/50"
                      />
                      <p className="mt-2 text-[11px] leading-5 text-slate-500">
                        Enter your current total savings balance, not just the amount you saved this month.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={savingsSaving || loading}
                      className="w-full"
                    >
                      {savingsSaving ? 'Saving balance...' : 'Save savings balance'}
                    </Button>

                    {savingsMessage && (
                      <p role="status" className="text-xs leading-5 text-slate-300">
                        {savingsMessage}
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-sky-300/10 p-2 text-sky-200">
                      <CircleHelp size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Savings vs. savings goals</p>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        Your Savings balance is the actual total you have put aside. Your Goals section tracks progress towards individual targets. Keep them separate so MOVA does not count the same money twice.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : active === 'Transactions' ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold">Transactions</h1>
                <p className="mt-2 text-sm text-slate-400">Record and track your money movements.</p>
              </div>

              <Card>
                <CardHeader><CardTitle>New transaction</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTransaction} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {(['income', 'expense', 'transfer'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setTransactionType(type)}
                          className={`rounded-xl border px-2 py-3 text-xs font-semibold capitalize transition ${
                            transactionType === type ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200' : 'border-white/10 text-slate-400'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Amount ({currency})</label>
                      <input type="number" min="0.01" step="0.01" required value={transactionAmount} onChange={event => setTransactionAmount(event.target.value)} placeholder="0.00" className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-lg text-white outline-none focus:border-emerald-300/50" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Category</label>
                      <select value={transactionCategory} onChange={event => setTransactionCategory(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none">
                        {['Food', 'Transport', 'Housing', 'Utilities', 'Shopping', 'Health', 'Education', 'Salary', 'Business', 'Investment', 'Savings', 'Debt', 'Other'].map(category => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Description</label>
                      <input value={transactionDescription} onChange={event => setTransactionDescription(event.target.value)} placeholder="What was this transaction for?" className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Transaction date</label>
                      <input type="date" required value={transactionDate} onChange={event => setTransactionDate(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none" />
                    </div>
                    <Button type="submit" disabled={transactionSaving} className="w-full">
                      {transactionSaving ? 'Saving...' : 'Save transaction'}
                    </Button>
                    {transactionMessage && <p role="status" className="text-xs text-slate-300">{transactionMessage}</p>}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Transaction history</CardTitle></CardHeader>
                <CardContent>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {(['all', 'income', 'expense', 'transfer'] as const).map(filter => (
                      <button key={filter} onClick={() => setTransactionFilter(filter)} className={`rounded-full px-3 py-2 text-xs capitalize ${
                        transactionFilter === filter ? 'bg-emerald-300/15 text-emerald-200' : 'bg-white/5 text-slate-400'
                      }`}>{filter}</button>
                    ))}
                  </div>
                  {transactionLoading ? (
                    <p className="py-10 text-center text-sm text-slate-500">Loading transactions...</p>
                  ) : filteredTransactions.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">No transactions found.</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredTransactions.map(transaction => (
                        <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-300">
                              {transaction.direction === 'in' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{transaction.title}</p>
                              <p className="mt-1 text-[10px] text-slate-500">{transaction.category} · {transaction.date}</p>
                            </div>
                          </div>
                          <p className="shrink-0 text-sm font-semibold">
                            {transaction.direction === 'in' ? '+' : transaction.direction === 'out' ? '−' : ''}
                            {formatMoney(transaction.amount, currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : active === 'Goals' ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold">Your savings goals</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Give your money a destination and track your progress.
                </p>
              </div>

              <Card>
                <CardHeader><CardTitle>Create a savings goal</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Goal name</label>
                      <input
                        required
                        value={goalTitle}
                        onChange={event => setGoalTitle(event.target.value)}
                        placeholder="e.g. Emergency fund"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Target amount ({currency})</label>
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={goalTarget}
                        onChange={event => setGoalTarget(event.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Target date (optional)</label>
                      <input
                        type="date"
                        value={goalDeadline}
                        onChange={event => setGoalDeadline(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <Button type="submit" disabled={goalSaving} className="w-full">
                      {goalSaving ? 'Creating goal...' : 'Create goal'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {goalMessage && (
                <div role="status" className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-slate-300">
                  {goalMessage}
                </div>
              )}

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your goals</h2>
                  <span className="text-xs text-slate-500">{goals.length} total</span>
                </div>

                {goalLoading ? (
                  <Card><CardContent className="py-12 text-center text-sm text-slate-500">Loading your goals...</CardContent></Card>
                ) : goals.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <GoalIcon className="mx-auto mb-3 text-slate-500" size={28} />
                      <p className="text-sm font-medium text-slate-300">No savings goals yet</p>
                      <p className="mt-2 text-xs text-slate-500">Create your first goal above to start tracking your progress.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {goals.map(goal => {
                      const percentage = goal.target > 0
                        ? Math.min(100, Math.max(0, goal.saved / goal.target * 100))
                        : 0

                      return (
                        <Card key={goal.id}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold">{goal.title}</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                  {goal.deadline ? `Target date: ${goal.deadline}` : 'No target date set'}
                                </p>
                              </div>
                              <Badge>{goal.status}</Badge>
                            </div>

                            <div className="mt-5 flex items-end justify-between gap-3">
                              <div>
                                <p className="text-xs text-slate-500">Saved so far</p>
                                <p className="mt-1 text-xl font-semibold text-emerald-200">
                                  {formatMoney(goal.saved, currency)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Target</p>
                                <p className="mt-1 text-sm font-semibold">{formatMoney(goal.target, currency)}</p>
                              </div>
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-emerald-300 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="mt-2 text-right text-xs text-slate-500">
                              {percentage.toFixed(1)}% complete
                            </p>

                            <form onSubmit={event => handleUpdateProgress(event, goal)} className="mt-5 space-y-3 border-t border-white/[.07] pt-4">
                              <label className="block text-xs text-slate-400">
                                Update total saved amount ({currency})
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={progressInputs[goal.id] ?? String(goal.saved)}
                                onChange={event => setProgressInputs(current => ({
                                  ...current,
                                  [goal.id]: event.target.value,
                                }))}
                                className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                              />
                              <Button
                                type="submit"
                                disabled={progressSaving === goal.id}
                                variant="outline"
                                className="w-full"
                              >
                                {progressSaving === goal.id ? 'Updating...' : 'Update progress'}
                              </Button>
                            </form>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : active === 'Debts' ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold">Debt management</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Keep track of what you owe, repayment commitments and outstanding balances.
                </p>
              </div>

              <Card className="border-rose-300/15 bg-gradient-to-br from-[#2b1b27] to-[#111b2b]">
                <CardContent className="p-6">
                  <p className="text-xs text-slate-400">TOTAL OUTSTANDING DEBT</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {showBalance ? formatMoney(totalDebtOnPage, currency) : '••••••'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {debts.length} recorded {debts.length === 1 ? 'debt' : 'debts'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Record a debt</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateDebt} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Creditor or lender</label>
                      <input
                        required
                        value={debtCreditor}
                        onChange={event => setDebtCreditor(event.target.value)}
                        placeholder="e.g. Bank, lender or person"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Outstanding balance ({currency})</label>
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={debtBalance}
                        onChange={event => setDebtBalance(event.target.value)}
                        placeholder="e.g. 500"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Annual interest rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={debtInterestRate}
                        onChange={event => setDebtInterestRate(event.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Monthly repayment ({currency})</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={debtMonthlyPayment}
                        onChange={event => setDebtMonthlyPayment(event.target.value)}
                        placeholder="e.g. 50"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs text-slate-400">Next due date (optional)</label>
                      <input
                        type="date"
                        value={debtDueDate}
                        onChange={event => setDebtDueDate(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <Button type="submit" disabled={debtSaving} className="w-full">
                      {debtSaving ? 'Saving debt...' : 'Save debt'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {debtMessage && (
                <div role="status" className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-slate-300">
                  {debtMessage}
                </div>
              )}

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your debts</h2>
                  <span className="text-xs text-slate-500">{debts.length} total</span>
                </div>

                {debtLoading ? (
                  <Card>
                    <CardContent className="py-12 text-center text-sm text-slate-500">
                      Loading your debts...
                    </CardContent>
                  </Card>
                ) : debts.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CreditCard className="mx-auto mb-3 text-slate-500" size={28} />
                      <p className="text-sm font-medium text-slate-300">No debts recorded</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Add a debt above to start tracking your outstanding balances.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {debts.map(debt => (
                      <Card key={debt.id}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold">{debt.creditor}</h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {debt.dueDate
                                  ? `Next due date: ${debt.dueDate}`
                                  : 'No due date set'}
                              </p>
                            </div>
                            <Badge>{debt.status}</Badge>
                          </div>

                          <div className="mt-5">
                            <p className="text-xs text-slate-500">Outstanding balance</p>
                            <p className="mt-1 text-2xl font-semibold text-rose-200">
                              {formatMoney(debt.balance, currency)}
                            </p>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white/[.03] p-3">
                              <p className="text-[10px] text-slate-500">Interest rate</p>
                              <p className="mt-1 text-sm font-semibold">
                                {debt.interestRate}%
                              </p>
                            </div>
                            <div className="rounded-xl bg-white/[.03] p-3">
                              <p className="text-[10px] text-slate-500">Monthly repayment</p>
                              <p className="mt-1 text-sm font-semibold">
                                {formatMoney(debt.monthlyPayment, currency)}
                              </p>
                            </div>
                          </div>

                          <form
                            onSubmit={event => handleUpdateDebtBalance(event, debt)}
                            className="mt-5 space-y-3 border-t border-white/[.07] pt-4"
                          >
                            <label className="block text-xs text-slate-400">
                              Update outstanding balance ({currency})
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              value={debtBalanceInputs[debt.id] ?? String(debt.balance)}
                              onChange={event => setDebtBalanceInputs(current => ({
                                ...current,
                                [debt.id]: event.target.value,
                              }))}
                              className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                            />
                            <Button
                              type="submit"
                              disabled={debtUpdating === debt.id}
                              variant="outline"
                              className="w-full"
                            >
                              {debtUpdating === debt.id ? 'Updating...' : 'Update balance'}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : active === 'MOVA Safe' ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-semibold tracking-wider">PURCHASE AFFORDABILITY</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
                  Can I afford this?
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Check a purchase against the money you have available and the commitments you need to protect.
                </p>
              </div>

              <Card className="border-emerald-300/15 bg-gradient-to-br from-[#142c36] to-[#111b2b]">
                <CardContent className="p-5 md:p-7">
                  <form onSubmit={handleSafeAssessment} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-300">
                        What do you want to buy?
                      </label>
                      <input
                        required
                        value={safeItemName}
                        onChange={event => setSafeItemName(event.target.value)}
                        placeholder="e.g. A new phone"
                        className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs text-slate-400">
                          Purchase price ({currency})
                        </label>
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={safePurchasePrice}
                          onChange={event => setSafePurchasePrice(event.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs text-slate-400">
                          Money available right now ({currency})
                        </label>
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={safeAvailableMoney}
                          onChange={event => setSafeAvailableMoney(event.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/[.08] pt-5">
                      <h2 className="text-sm font-semibold">Protect your commitments</h2>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Enter the amounts you still need to keep aside. Use zero only when you have no commitment in that category.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs text-slate-400">
                          Essential expenses ({currency})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={safeEssentialExpenses}
                          onChange={event => setSafeEssentialExpenses(event.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">Food, rent, transport, utilities, etc.</p>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs text-slate-400">
                          Upcoming bills and debt payments ({currency})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={safeUpcomingObligations}
                          onChange={event => setSafeUpcomingObligations(event.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">Payments due before your next income.</p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-xs text-slate-400">
                          Savings commitments ({currency})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={safeSavingsCommitments}
                          onChange={event => setSafeSavingsCommitments(event.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">Money you have already committed to savings goals.</p>
                      </div>
                    </div>

                    <Button type="submit" disabled={safeSaving} className="w-full">
                      {safeSaving ? 'Checking your purchase...' : 'Check affordability'}
                    </Button>
                  </form>

                  {safeMessage && (
                    <p role="status" className="mt-4 text-xs leading-5 text-slate-300">
                      {safeMessage}
                    </p>
                  )}
                </CardContent>
              </Card>

              {latestSafeAssessment && (
                <Card className={
                  latestSafeAssessment.riskLevel === 'low'
                    ? 'border-emerald-300/25'
                    : latestSafeAssessment.riskLevel === 'medium'
                      ? 'border-amber-300/25'
                      : latestSafeAssessment.riskLevel === 'high'
                        ? 'border-rose-300/25'
                        : 'border-white/10'
                }>
                  <CardContent className="p-5 md:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">YOUR PURCHASE ASSESSMENT</p>
                        <h2 className="mt-2 text-xl font-semibold">{latestSafeAssessment.itemName}</h2>
                      </div>
                      <Badge>
                        {getSafeRiskLabel(latestSafeAssessment.riskLevel)}
                      </Badge>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      {latestSafeAssessment.explanation}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white/[.03] p-4">
                        <p className="text-xs text-slate-500">Money available after commitments</p>
                        <p className="mt-2 text-xl font-semibold">
                          {formatMoney(latestSafeAssessment.spendableMoney, currency)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/[.03] p-4">
                        <p className="text-xs text-slate-500">Money left after purchase</p>
                        <p className="mt-2 text-xl font-semibold">
                          {formatMoney(latestSafeAssessment.remainingAfterPurchase, currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Previous assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  {safeLoading ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Loading your assessment history...
                    </p>
                  ) : safeHistory.length === 0 ? (
                    <div className="py-8 text-center">
                      <ShieldCheck className="mx-auto mb-3 text-slate-500" size={28} />
                      <p className="text-sm font-medium text-slate-300">
                        No purchase assessments yet
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Your saved purchase decisions will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeHistory.map(assessment => (
                        <div
                          key={assessment.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.07] p-4"
                        >
                          <div>
                            <p className="text-sm font-medium">{assessment.itemName}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatMoney(assessment.purchasePrice, currency)} · {new Date(assessment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge>
                            {getSafeRiskLabel(assessment.riskLevel)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <p className="text-[11px] leading-5 text-slate-500">
                MOVA Safe is a decision-support calculation, not a guarantee of financial safety. Its result depends on the accuracy and completeness of the amounts you enter. The 10% buffer is a simple MOVA rule, not a universal financial standard.
              </p>
            </div>
               ) : active === 'MOVA Price' ? (
  <MovaPricePanel userId={userId} currency={currency} />

) : active === 'AI Coach' ? (
  <AiCoachPanel userId={userId} currency={currency} />

) : active === 'Profile' ? (
  <ProfilePanel
    userId={userId}
    email={email}
    currency={currency}
    onCurrencyChange={(nextCurrency) =>
      setDashboard(current =>
        current ? { ...current, currency: nextCurrency } : current
      )
    }
  />

) : (  
            <Card>
              <CardContent className="p-8 md:p-10">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-200">
                  <Command size={22} />
                </div>
                <h1 className="text-2xl font-semibold">{active}</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  {descriptions[active]} This screen is scaffolded in the new interface. We will reconnect its existing MOVA data, calculations and actions after inspecting the original implementation and database schema.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1.5 text-xs text-amber-100/80">
                  Migration pending · existing data not changed
                </div>
              </CardContent>
            </Card>
          )}

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] pt-5 text-[10px] text-slate-600">
            <span>© {new Date().getFullYear()} MOVA · Money Operating System</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Preview build — not production financial advice
            </span>
          </footer>
        </main>
      </div>
    </div>
  )
}
