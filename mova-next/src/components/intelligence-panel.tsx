
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard,
  Target,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  loadTransactions,
  type Transaction,
} from '@/lib/mova-data'

type IntelligencePanelProps = {
  userId: string
  currency: string
  currentSavings: number
  debts: { balance: number }[]
  goals: { saved: number; target: number }[]
}

function money(amount: number, currency: string) {
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

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function transactionMonth(date: string) {
  return date.slice(0, 7)
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function IntelligencePanel({
  userId,
  currency,
  currentSavings,
  debts,
  goals,
}: IntelligencePanelProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError('')

      try {
        const result = await loadTransactions(userId)

        if (!cancelled) {
          setTransactions(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load your financial history.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [userId])

  const analytics = useMemo(() => {
    const now = new Date()
    const currentMonth = monthKey(now)

    const currentDay = now.getDate()

    const previousDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    )

    const previousMonth = monthKey(previousDate)

    // Compare the same number of calendar days in both months.
    const previousCutoffDay = Math.min(
      currentDay,
      daysInMonth(
        previousDate.getFullYear(),
        previousDate.getMonth()
      )
    )

    const currentCutoff = `${currentMonth}-${String(currentDay).padStart(2, '0')}`
    const previousCutoff = `${previousMonth}-${String(previousCutoffDay).padStart(2, '0')}`

    const currentTransactions = transactions.filter(
      item =>
        transactionMonth(item.date) === currentMonth &&
        item.date.slice(0, 10) <= currentCutoff
    )

    const previousTransactions = transactions.filter(
      item =>
        transactionMonth(item.date) === previousMonth &&
        item.date.slice(0, 10) <= previousCutoff
    )

    function totals(items: Transaction[]) {
      return items.reduce(
        (result, item) => {
          if (item.direction === 'in') {
            result.income += item.amount
          }

          if (item.direction === 'out') {
            result.expenses += item.amount
          }

          return result
        },
        { income: 0, expenses: 0 }
      )
    }

    const current = totals(currentTransactions)
    const previous = totals(previousTransactions)

    const monthlyHistory = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1
      )

      const key = monthKey(date)

      const monthTransactions = transactions.filter(item => {
        if (transactionMonth(item.date) !== key) return false

        // The current month shows month-to-date figures.
        if (key === currentMonth) {
          return item.date.slice(0, 10) <= currentCutoff
        }

        return true
      })

      const values = totals(monthTransactions)

      return {
        key,
        label: date.toLocaleDateString('en-US', {
          month: 'short',
        }),
        income: values.income,
        expenses: values.expenses,
      }
    })

    const categoryTotals = new Map<string, number>()

    currentTransactions
      .filter(item => item.direction === 'out')
      .forEach(item => {
        const category = item.category?.trim() || 'Uncategorised'

        categoryTotals.set(
          category,
          (categoryTotals.get(category) ?? 0) + item.amount
        )
      })

    const categories = Array.from(categoryTotals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)

    const totalDebt = debts.reduce(
      (sum, debt) => sum + Number(debt.balance || 0),
      0
    )

    const totalSaved = goals.reduce(
      (sum, goal) => sum + Number(goal.saved || 0),
      0
    )

    const totalTargets = goals.reduce(
      (sum, goal) => sum + Number(goal.target || 0),
      0
    )

    const maxChartValue = Math.max(
      1,
      ...monthlyHistory.flatMap(item => [
        item.income,
        item.expenses,
      ])
    )

    return {
      current,
      previous,
      monthlyHistory,
      categories,
      totalDebt,
      totalSaved,
      totalTargets,
      maxChartValue,
      transactionCount: transactions.length,
      currentTransactionCount: currentTransactions.length,
      hasPreviousData: previousTransactions.length > 0,
      hasCurrentData: currentTransactions.length > 0,
      currentDay,
      previousCutoffDay,
    }
  }, [transactions, debts, goals])

  const cashFlow =
    analytics.current.income - analytics.current.expenses

  const cashFlowMargin =
    analytics.current.income > 0
      ? (cashFlow / analytics.current.income) * 100
      : null

  const debtToSavingsRatio =
    currentSavings > 0
      ? (analytics.totalDebt / currentSavings) * 100
      : analytics.totalDebt > 0
        ? null
        : 0

  const goalProgress =
    analytics.totalTargets > 0
      ? Math.min(
          100,
          (analytics.totalSaved / analytics.totalTargets) * 100
        )
      : 0

  function comparison(current: number, previous: number) {
    if (previous === 0) {
      return null
    }

    return ((current - previous) / previous) * 100
  }

  const incomeChange = comparison(
    analytics.current.income,
    analytics.previous.income
  )

  const expenseChange = comparison(
    analytics.current.expenses,
    analytics.previous.expenses
  )

  const comparisonLabel =
    `Compared with the first ${analytics.previousCutoffDay} days of last month`

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-slate-400">
          Analysing your financial history...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-rose-300/20">
        <CardContent className="p-6">
          <h2 className="font-semibold text-rose-200">
            Intelligence could not load
          </h2>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-emerald-200">
          <Activity size={18} />
          <span className="text-xs font-semibold tracking-wider">
            FINANCIAL INTELLIGENCE
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
          Understand your money.
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Understand your financial patterns, spending behaviour,
          debt exposure and progress using your recorded MOVA data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Income this month</span>
              <ArrowDownLeft size={17} className="text-emerald-200" />
            </div>

            <p className="mt-4 text-2xl font-semibold">
              {money(analytics.current.income, currency)}
            </p>

            {incomeChange !== null && (
              <p className={`mt-2 flex items-center gap-1 text-xs ${
                incomeChange >= 0 ? 'text-emerald-200' : 'text-rose-200'
              }`}>
                {incomeChange >= 0
                  ? <TrendingUp size={13} />
                  : <TrendingDown size={13} />}
                {Math.abs(incomeChange).toFixed(1)}% vs previous period
              </p>
            )}

            <p className="mt-2 text-[10px] text-slate-500">
              Month to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Expenses this month</span>
              <ArrowUpRight size={17} className="text-rose-200" />
            </div>

            <p className="mt-4 text-2xl font-semibold">
              {money(analytics.current.expenses, currency)}
            </p>

            {expenseChange !== null && (
              <p className={`mt-2 flex items-center gap-1 text-xs ${
                expenseChange > 0 ? 'text-rose-200' : 'text-emerald-200'
              }`}>
                {expenseChange > 0
                  ? <TrendingUp size={13} />
                  : <TrendingDown size={13} />}
                {Math.abs(expenseChange).toFixed(1)}% vs previous period
              </p>
            )}

            <p className="mt-2 text-[10px] text-slate-500">
              Month to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Net cash flow</span>
              <Wallet size={17} />
            </div>

            <p className={`mt-4 text-2xl font-semibold ${
              cashFlow >= 0 ? 'text-emerald-200' : 'text-rose-200'
            }`}>
              {money(cashFlow, currency)}
            </p>

            <p className="mt-2 text-[10px] text-slate-500">
              Income minus expenses this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Cash-flow margin</span>
              <Activity size={17} />
            </div>

            <p className={`mt-4 text-2xl font-semibold ${
              cashFlowMargin === null
                ? 'text-slate-300'
                : cashFlowMargin >= 0
                  ? 'text-emerald-200'
                  : 'text-rose-200'
            }`}>
              {cashFlowMargin === null
                ? 'Not available'
                : `${cashFlowMargin.toFixed(1)}%`}
            </p>

            <p className="mt-2 text-[10px] text-slate-500">
              Portion of recorded income remaining after expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Debt-to-savings ratio</span>
              <CreditCard size={17} />
            </div>

            <p className={`mt-4 text-2xl font-semibold ${
              debtToSavingsRatio === null
                ? 'text-amber-200'
                : debtToSavingsRatio > 100
                  ? 'text-rose-200'
                  : 'text-emerald-200'
            }`}>
              {debtToSavingsRatio === null
                ? 'No savings recorded'
                : `${debtToSavingsRatio.toFixed(1)}%`}
            </p>

            <p className="mt-2 text-[10px] text-slate-500">
              Outstanding debt compared with current savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs">Recorded transactions</span>
              <BarChart3 size={17} />
            </div>

            <p className="mt-4 text-2xl font-semibold">
              {analytics.transactionCount}
            </p>

            <p className="mt-2 text-[10px] text-slate-500">
              Across your available history
            </p>
          </CardContent>
        </Card>
      </div>

      {!analytics.hasCurrentData && (
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-4">
          <p className="text-sm font-semibold text-amber-100">
            Not enough activity this month
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            You have no income or expense transactions recorded
            for this month. Add transactions to generate meaningful
            monthly analysis.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Six-month financial trend</CardTitle>
          <p className="text-xs text-slate-400">
            The current month shows month-to-date figures.
          </p>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-300" />
              Income
            </span>

            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-300" />
              Expenses
            </span>
          </div>

          <div className="mt-7 grid grid-cols-6 gap-2">
            {analytics.monthlyHistory.map(month => {
              const incomeHeight =
                (month.income / analytics.maxChartValue) * 100

              const expenseHeight =
                (month.expenses / analytics.maxChartValue) * 100

              return (
                <div key={month.key} className="min-w-0">
                  <div className="flex h-36 items-end justify-center gap-1 border-b border-white/10 pb-2">
                    <div
                      title={`Income: ${money(month.income, currency)}`}
                      className="w-3 rounded-t bg-emerald-300"
                      style={{
                        height: `${Math.max(month.income > 0 ? 3 : 0, incomeHeight)}%`,
                      }}
                    />

                    <div
                      title={`Expenses: ${money(month.expenses, currency)}`}
                      className="w-3 rounded-t bg-rose-300"
                      style={{
                        height: `${Math.max(month.expenses > 0 ? 3 : 0, expenseHeight)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-center text-[10px] text-slate-500">
                    {month.label}
                  </p>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-[10px] leading-5 text-slate-500">
            Based on recorded transactions. Months without recorded
            activity are displayed as zero, not estimated values.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where your money goes</CardTitle>
            <p className="text-xs text-slate-400">
              Your largest recorded spending categories this month.
            </p>
          </CardHeader>

          <CardContent>
            {analytics.categories.length === 0 ? (
              <div className="py-8 text-center">
                <BarChart3 className="mx-auto mb-3 text-slate-500" size={26} />
                <p className="text-sm text-slate-400">
                  No expenses recorded this month.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {analytics.categories.slice(0, 6).map(category => {
                  const percentage =
                    analytics.current.expenses > 0
                      ? (category.amount / analytics.current.expenses) * 100
                      : 0

                  return (
                    <div key={category.name}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-300">
                          {category.name}
                        </span>

                        <span className="text-xs text-slate-400">
                          {money(category.amount, currency)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p className="mt-1 text-right text-[10px] text-slate-500">
                        {percentage.toFixed(1)}% of expenses
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial position</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-300/10 p-2 text-emerald-200">
                    <Wallet size={17} />
                  </div>
                  <span className="text-sm text-slate-300">
                    Current savings
                  </span>
                </div>

                <span className="text-sm font-semibold">
                  {money(currentSavings, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-rose-300/10 p-2 text-rose-200">
                    <CreditCard size={17} />
                  </div>
                  <span className="text-sm text-slate-300">
                    Outstanding debt
                  </span>
                </div>

                <span className="text-sm font-semibold">
                  {money(analytics.totalDebt, currency)}
                </span>
              </div>

              <div className="rounded-xl bg-white/[.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-sky-300/10 p-2 text-sky-200">
                      <Target size={17} />
                    </div>
                    <span className="text-sm text-slate-300">
                      Savings goals
                    </span>
                  </div>

                  <span className="text-sm font-semibold">
                    {goalProgress.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-sky-300"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                  <span>
                    {money(analytics.totalSaved, currency)} saved
                  </span>
                  <span>
                    {money(analytics.totalTargets, currency)} target
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial observations</CardTitle>
          <p className="text-xs text-slate-400">
            What your recorded numbers may be telling you.
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-5">
            {!analytics.hasCurrentData ? (
              <p className="text-sm leading-6 text-slate-400">
                MOVA needs recorded income or expenses for this month
                before it can identify your current spending pattern.
              </p>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${
                    cashFlow >= 0
                      ? 'bg-emerald-300/10 text-emerald-200'
                      : 'bg-rose-300/10 text-rose-200'
                  }`}>
                    {cashFlow >= 0
                      ? <TrendingUp size={17} />
                      : <TrendingDown size={17} />}
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      {cashFlow >= 0
                        ? 'Positive recorded cash flow'
                        : 'Negative recorded cash flow'}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Your recorded income is {money(analytics.current.income, currency)}
                      {' '}and your recorded expenses are {money(analytics.current.expenses, currency)}.
                      {' '}Your net cash flow is {money(cashFlow, currency)}.
                    </p>
                  </div>
                </div>

                {cashFlowMargin !== null && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-sky-300/10 p-2 text-sky-200">
                      <Activity size={17} />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Cash-flow margin
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {cashFlowMargin >= 0
                          ? `${cashFlowMargin.toFixed(1)}% of your recorded income remains after recorded expenses.`
                          : `Your recorded expenses exceed your income by ${Math.abs(cashFlowMargin).toFixed(1)}% of income. Review spending and upcoming commitments.`}
                      </p>
                    </div>
                  </div>
                )}

                {analytics.categories.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-sky-300/10 p-2 text-sky-200">
                      <BarChart3 size={17} />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Largest recorded spending category
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {analytics.categories[0].name} accounts for{' '}
                        {money(analytics.categories[0].amount, currency)}
                        {' '}of your recorded expenses this month.
                      </p>
                    </div>
                  </div>
                )}

                {analytics.hasPreviousData && expenseChange !== null && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white/5 p-2 text-slate-300">
                      {expenseChange > 0
                        ? <TrendingUp size={17} />
                        : <TrendingDown size={17} />}
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Expense comparison
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Your recorded expenses have{' '}
                        {expenseChange > 0
                          ? 'increased'
                          : expenseChange < 0
                            ? 'decreased'
                            : 'not changed'}
                        {' '}by {Math.abs(expenseChange).toFixed(1)}%
                        {' '}compared with the same period last month.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${
                    debtToSavingsRatio === null || debtToSavingsRatio > 100
                      ? 'bg-amber-300/10 text-amber-200'
                      : 'bg-emerald-300/10 text-emerald-200'
                  }`}>
                    {debtToSavingsRatio === null || debtToSavingsRatio > 100
                      ? <AlertTriangle size={17} />
                      : <ShieldCheck size={17} />}
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Debt exposure
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {debtToSavingsRatio === null
                        ? 'You have recorded debt but no current savings balance. Consider building a cash buffer while keeping required debt payments up to date.'
                        : debtToSavingsRatio === 0
                          ? 'You have no outstanding recorded debt.'
                          : debtToSavingsRatio > 100
                            ? `Your recorded debt is ${debtToSavingsRatio.toFixed(1)}% of your current savings. Your debt is greater than your recorded savings.`
                            : `Your recorded debt is ${debtToSavingsRatio.toFixed(1)}% of your current savings. Continue monitoring both balances.`}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] leading-5 text-slate-500">
        Intelligence uses transactions, savings, debts and goals recorded
        in MOVA. It does not connect to your bank or automatically detect
        unrecorded financial activity. Month-to-month comparisons use
        equivalent calendar periods. Observations are based only on the
        data available in your account.
      </p>
    </div>
  )
}
