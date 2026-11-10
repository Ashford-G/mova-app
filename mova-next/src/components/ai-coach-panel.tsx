
import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles,
  Send,
  Brain,
  Wallet,
  Target,
  CreditCard,
  TrendingUp,
  RefreshCw,
  MessageCircle,
  Zap,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import {
  loadDashboardData,
  loadTransactions,
  type DashboardData,
  type Transaction,
} from '@/lib/mova-data'
import { supabase } from '@/lib/supabase'

type Props = {
  userId: string
  currency: string
}

type CoachMessage = {
  id: string
  question: string
  answer: string
  createdAt: string
}

type UsageInfo = {
  plan: 'free' | 'pro'
  used: number
  limit: number
  remaining: number
}

const suggestions = [
  'How can I improve my spending?',
  'How should I manage my debt?',
  'How can I reach my savings goals?',
  'Am I making progress financially?',
]

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

function createAdvice(
  question: string,
  dashboard: DashboardData,
  transactions: Transaction[],
  currency: string
) {
  const normalized = question.toLowerCase()

  const income = transactions
    .filter(item => item.direction === 'in')
    .reduce((sum, item) => sum + item.amount, 0)

  const expenses = transactions
    .filter(item => item.direction === 'out')
    .reduce((sum, item) => sum + item.amount, 0)

  const debtBalance = dashboard.debts
    .filter(item => item.status?.toLowerCase() !== 'paid')
    .reduce((sum, item) => sum + item.balance, 0)

  const monthlyDebtPayments = dashboard.debts
    .filter(item => item.status?.toLowerCase() !== 'paid')
    .reduce((sum, item) => sum + item.monthlyPayment, 0)

  const goalTarget = dashboard.goals.reduce(
    (sum, item) => sum + item.target,
    0
  )

  const goalSaved = dashboard.goals.reduce(
    (sum, item) => sum + item.saved,
    0
  )

  const cashFlow =
    dashboard.transactionIncome - dashboard.transactionExpenses

  const expenseCategories = new Map<string, number>()

  transactions
    .filter(item => item.direction === 'out')
    .forEach(item => {
      const category = item.category?.trim() || 'Other'
      expenseCategories.set(
        category,
        (expenseCategories.get(category) ?? 0) + item.amount
      )
    })

  const largestCategory = [...expenseCategories.entries()]
    .sort((a, b) => b[1] - a[1])[0]

  if (
    normalized.includes('debt') ||
    normalized.includes('owe') ||
    normalized.includes('loan')
  ) {
    if (debtBalance <= 0) {
      return 'MOVA cannot see an active debt balance in your records. If you have outstanding debts, add them in the Debts section so your plan can account for them. If you are debt-free, focus on maintaining that position while building savings.'
    }

    return `Your recorded outstanding debt is ${money(debtBalance, currency)}, with monthly payments of ${money(monthlyDebtPayments, currency)}. Start by keeping every required payment up to date. Then prioritize debts with the highest interest rates while protecting money needed for essentials. Review your balances regularly so you can see your progress.`
  }

  if (
    normalized.includes('save') ||
    normalized.includes('saving')
  ) {
    if (dashboard.goals.length === 0) {
      return `Your recorded savings balance is ${money(dashboard.currentSavings, currency)}. You have not added a savings goal yet. Create one with a clear target and deadline, then choose a contribution you can realistically maintain.`
    }

    const remaining = Math.max(goalTarget - goalSaved, 0)

    return `Across your recorded goals, you have saved ${money(goalSaved, currency)} toward ${money(goalTarget, currency)} in targets. That leaves ${money(remaining, currency)} to reach those targets. Focus on one priority goal first and make consistent contributions rather than setting an unrealistic amount. Your actual savings balance is ${money(dashboard.currentSavings, currency)}.`
  }

  if (
    normalized.includes('spend') ||
    normalized.includes('expense')
  ) {
    const categoryAdvice = largestCategory
      ? ` Your largest recorded spending category is ${largestCategory[0]} at ${money(largestCategory[1], currency)}.`
      : ''

    return `Your recorded transactions show ${money(income, currency)} in income and ${money(expenses, currency)} in expenses across the available transaction history. Review recurring and non-essential spending before cutting important expenses.${categoryAdvice} Keep recording transactions so your spending picture becomes more complete.`
  }

  if (
    normalized.includes('budget') ||
    normalized.includes('cash flow') ||
    normalized.includes('money left')
  ) {
    return `Your current month's recorded income is ${money(dashboard.transactionIncome, currency)} and expenses are ${money(dashboard.transactionExpenses, currency)}. That gives a recorded cash flow of ${money(cashFlow, currency)}. Your listed monthly debt payments total ${money(monthlyDebtPayments, currency)}. Plan around essential costs and upcoming obligations before deciding what is safe to spend.`
  }

  if (
    normalized.includes('goal') ||
    normalized.includes('progress') ||
    normalized.includes('target')
  ) {
    if (goalTarget <= 0) {
      return 'You have not created a financial goal yet. Choose something meaningful, set a target amount and deadline, and record contributions as you make them. MOVA can then help you monitor your progress.'
    }

    const progress = Math.min((goalSaved / goalTarget) * 100, 100)

    return `Your recorded goals are ${progress.toFixed(1)}% funded overall: ${money(goalSaved, currency)} saved toward ${money(goalTarget, currency)} in targets. Keep contributions realistic and review your deadlines. If a goal is no longer achievable, adjust the plan rather than ignoring it.`
  }

  if (
    normalized.includes('position') ||
    normalized.includes('wealth') ||
    normalized.includes('financially')
  ) {
    const position = dashboard.currentSavings - debtBalance

    return `Based on the records available, your savings are ${money(dashboard.currentSavings, currency)} and your outstanding recorded debt is ${money(debtBalance, currency)}. Your simple savings-minus-debt position is ${money(position, currency)}. This is not a complete net-worth calculation because assets and other liabilities may not be recorded. Keep your records up to date for a clearer picture.`
  }

  return `I can help you think through that using your MOVA records. At the moment, your recorded monthly income is ${money(dashboard.transactionIncome, currency)}, your recorded monthly expenses are ${money(dashboard.transactionExpenses, currency)}, your savings balance is ${money(dashboard.currentSavings, currency)}, and your outstanding recorded debt is ${money(debtBalance, currency)}. Try asking about spending, saving, debt, budgeting, goals or your financial position for more focused guidance.`
}

export function AiCoachPanel({ userId, currency }: Props) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)
  const [usage, setUsage] = useState<UsageInfo | null>(null)

  async function loadCoachData() {
    setLoading(true)
    setError('')

    try {
      const [dashboardData, transactionData] = await Promise.all([
        loadDashboardData(userId),
        loadTransactions(userId),
      ])

      setDashboard(dashboardData)
      setTransactions(transactionData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load your financial information.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    if (!supabase) return

    const { data, error: historyError } = await supabase
      .from('ai_insights')
      .select('id, title, message, created_at')
      .eq('user_id', userId)
      .eq('insight_type', 'coach_question')
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      setNotice('Your previous Coach conversations could not be loaded.')
      return
    }

    setMessages(
      (data ?? []).map(item => {
        let questionText = 'Previous question'

        const match = String(item.message || '').match(
          /^Question:\s*([\s\S]*?)\n\nAdvice:/
        )

        if (match?.[1]) questionText = match[1]

        const answerText = String(item.message || '').replace(
          /^Question:\s*[\s\S]*?\n\nAdvice:\s*/,
          ''
        )

        return {
          id: item.id,
          question: questionText,
          answer: answerText,
          createdAt: item.created_at,
        }
      })
    )
  }

  useEffect(() => {
    async function initialise() {
      await Promise.all([loadCoachData(), loadHistory()])
    }

    initialise()
  }, [userId])

  const latestMessage = useMemo(
    () => messages[0] ?? null,
    [messages]
  )

  async function askCoach(nextQuestion?: string) {
    const cleanQuestion = (nextQuestion ?? question).trim()

    if (!cleanQuestion) {
      setNotice('Enter a question first.')
      return
    }

    if (cleanQuestion.length > 500) {
      setNotice('Your question must be 500 characters or fewer.')
      return
    }

    if (!dashboard) {
      setNotice('Your financial information is not ready yet.')
      return
    }

    if (!supabase) {
      setNotice('MOVA is not connected to Supabase.')
      return
    }

    setAsking(true)
    setNotice('')
    setError('')
    setUsingFallback(false)

    try {
      // First, try the live MOVA AI Edge Function.
      const { data: aiData, error: aiError } =
        await supabase.functions.invoke('mova-ai-coach', {
          body: {
            question: cleanQuestion,
          },
        })

      if (!aiError && aiData?.answer) {
        const newMessage: CoachMessage = {
          id: aiData.id,
          question: cleanQuestion,
          answer: aiData.answer,
          createdAt: aiData.createdAt || new Date().toISOString(),
        }

        if (aiData.usage) {
          setUsage(aiData.usage)
        }

        setMessages(current => [newMessage, ...current])
        setQuestion('')
        return
      }

      const monthlyLimitReached =
        aiData?.code === 'AI_MONTHLY_LIMIT_REACHED' ||
        aiError?.context?.status === 429

      if (monthlyLimitReached && aiData?.usage) {
        setUsage(aiData.usage)
      }

      // Preserve unlimited built-in guidance.
      const fallbackAnswer = createAdvice(
        cleanQuestion,
        dashboard,
        transactions,
        currency
      )

      const { data, error: saveError } = await supabase
        .from('ai_insights')
        .insert({
          user_id: userId,
          insight_type: 'coach_question',
          title: 'MOVA Coach',
          message: `Question: ${cleanQuestion}\n\nAdvice: ${fallbackAnswer}`,
          priority: 'normal',
        })
        .select('id, created_at')
        .single()

      if (saveError) {
        throw new Error(
          `Your guidance could not be saved: ${saveError.message}`
        )
      }

      const newMessage: CoachMessage = {
        id: data.id,
        question: cleanQuestion,
        answer: fallbackAnswer,
        createdAt: data.created_at,
      }

      setMessages(current => [newMessage, ...current])
      setQuestion('')
      setUsingFallback(true)

      if (monthlyLimitReached) {
        setNotice(
          'You have used your monthly live AI allowance. You can still ask MOVA using unlimited built-in financial guidance.'
        )
      } else {
        console.warn(
          'MOVA AI unavailable; using built-in guidance:',
          aiError || aiData?.error
        )

        setNotice(
          'Live AI is temporarily unavailable, so MOVA used its built-in guidance instead. This did not consume a live AI question.'
        )
      }
    } catch (err) {
      setNotice(
        err instanceof Error
          ? err.message
          : 'MOVA could not prepare your guidance.'
      )
    } finally {
      setAsking(false)
    }
  }

  const usagePercent = usage
    ? Math.min((usage.used / usage.limit) * 100, 100)
    : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-emerald-200">
          <Sparkles size={18} />
          <span className="text-xs font-semibold tracking-[0.2em]">
            YOUR FINANCIAL THINKING PARTNER
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
          MOVA Coach
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Ask questions about your money. MOVA uses your recorded financial
          information to help you think through your next decision.
        </p>
      </div>

      <Card className="border-emerald-300/15 bg-gradient-to-br from-[#142c36] via-[#102331] to-[#111b2b]">
        <CardContent className="flex items-start gap-4 p-5 md:p-6">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-200">
            <Brain size={22} />
          </div>

          <div>
            <p className="font-medium">Your money. Your decisions.</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Get practical guidance on spending, saving, debt and goals.
              Advice is based on the information you have entered into MOVA.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              MOVA Coach uses AI-powered guidance when available, with
              built-in financial guidance as a fallback. It is not a
              substitute for professional financial advice.
            </p>
          </div>
        </CardContent>
      </Card>

      {usage && (
        <Card className="border-emerald-300/15">
          <CardContent className="space-y-3 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap size={17} className="text-emerald-200" />
                <p className="text-sm font-medium">
                  Monthly live AI allowance
                </p>
              </div>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-200">
                {usage.plan}
              </span>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold">
                  {usage.remaining}
                  <span className="ml-1 text-sm font-normal text-slate-400">
                    remaining
                  </span>
                </p>
              </div>

              <p className="text-xs text-slate-400">
                {usage.used} of {usage.limit} used
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-300 transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <p className="text-xs leading-5 text-slate-400">
              Your live AI allowance resets at the beginning of each month.
              Built-in MOVA guidance remains available without a monthly limit.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wallet className="text-emerald-200" size={20} />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Current savings</p>
              <p className="mt-1 truncate font-semibold">
                {loading || !dashboard
                  ? '—'
                  : money(dashboard.currentSavings, currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CreditCard className="text-emerald-200" size={20} />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">
                Recorded monthly expenses
              </p>
              <p className="mt-1 truncate font-semibold">
                {loading || !dashboard
                  ? '—'
                  : money(dashboard.transactionExpenses, currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Target className="text-emerald-200" size={20} />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">
                Active financial goals
              </p>
              <p className="mt-1 font-semibold">
                {loading || !dashboard ? '—' : dashboard.goals.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="text-emerald-200" size={20} />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">
                Recorded transactions
              </p>
              <p className="mt-1 font-semibold">
                {loading ? '—' : transactions.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle size={19} />
            Ask MOVA Coach
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {suggestions.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setQuestion(item)}
                className="rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-left text-xs text-slate-300 transition hover:border-emerald-300/40 hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>

          <textarea
            value={question}
            onChange={event => setQuestion(event.target.value)}
            placeholder="Ask about your spending, savings, debt or financial goals..."
            rows={4}
            maxLength={500}
            className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm outline-none transition focus:border-emerald-300/40"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {question.length}/500 characters
            </p>

            <Button
              onClick={() => askCoach()}
              disabled={loading || asking || !question.trim()}
            >
              {asking ? 'Thinking...' : 'Ask MOVA'}
              <Send size={15} className="ml-2" />
            </Button>
          </div>

          {notice && (
            <p
              role="status"
              className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs leading-5 text-slate-300"
            >
              {notice}
            </p>
          )}

          {usingFallback && (
            <p className="text-xs text-amber-300">
              Built-in guidance was used for this answer.
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-rose-300">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadCoachData()
                loadHistory()
              }}
              className="mt-3"
            >
              <RefreshCw size={14} className="mr-2" />
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {latestMessage && (
        <Card className="border-emerald-300/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-200" />
              Your latest guidance
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-xs font-medium text-emerald-200">
              {latestMessage.question}
            </p>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-200">
              {latestMessage.answer}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(latestMessage.createdAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent conversations</h2>
          <span className="text-xs text-slate-500">
            Last 10 saved questions
          </span>
        </div>

        {messages.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle
                className="mx-auto text-slate-500"
                size={24}
              />
              <p className="mt-3 text-sm font-medium">
                No conversations yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Your saved Coach questions and guidance will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          messages.map(item => (
            <Card key={item.id}>
              <CardContent className="space-y-2 p-4">
                <p className="text-sm font-medium">{item.question}</p>
                <p className="whitespace-pre-line text-sm leading-6 text-slate-400">
                  {item.answer}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
