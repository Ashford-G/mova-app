
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Plus, Trash2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Debt } from '@/lib/mova-data'

type Commitment = {
  id: string
  title: string
  category: string
  amount: number
  dueDate: string | null
  frequency: 'one_time' | 'monthly'
  status: 'pending' | 'paid'
}

type Props = {
  userId: string
  currency: string
  savings: number
  debts: Debt[]
}

const categories = ['Essential', 'Bill', 'Other', 'Savings']

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

function dateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mapCommitment(row: any): Commitment {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    amount: Number(row.amount),
    dueDate: row.due_date,
    frequency: row.frequency,
    status: row.status,
  }
}

export function MoneyPositionPanel({
  userId,
  currency,
  savings,
  debts,
}: Props) {
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Essential')
  const [dueDate, setDueDate] = useState(dateString(new Date()))
  const [frequency, setFrequency] = useState<'one_time' | 'monthly'>('one_time')

  useEffect(() => {
    let cancelled = false

    async function loadCommitments() {
      if (!supabase || !isSupabaseConfigured) {
        setMessage('MOVA is not connected to Supabase.')
        setLoading(false)
        return
      }

      setLoading(true)
      setMessage('')

      const { data, error } = await supabase
        .from('financial_commitments')
        .select('id, title, category, amount, due_date, frequency, status')
        .eq('user_id', userId)
        .order('due_date', { ascending: true })

      if (cancelled) return

      if (error) {
        setMessage(`Could not load commitments: ${error.message}`)
      } else {
        setCommitments((data ?? []).map(mapCommitment))
      }

      setLoading(false)
    }

    loadCommitments()
    return () => { cancelled = true }
  }, [userId])

  const today = dateString(new Date())
  const monthEnd = new Date()
  monthEnd.setMonth(monthEnd.getMonth() + 1, 0)
  const lastDay = monthEnd.getDate()
  const monthEndString = dateString(monthEnd)

  const dueCommitments = useMemo(() => {
    return commitments.filter(item => {
      if (item.status !== 'pending' || !item.dueDate) return false

      if (item.frequency === 'monthly') {
        const dueDay = Number(item.dueDate.slice(8, 10))
        return dueDay <= lastDay
      }

      return item.dueDate <= monthEndString
    })
  }, [commitments, monthEndString, lastDay])

  const essentialTotal = dueCommitments
    .filter(item => item.category === 'Essential' || item.category === 'Bill' || item.category === 'Other')
    .reduce((sum, item) => sum + item.amount, 0)

  const savingsCommitments = dueCommitments
    .filter(item => item.category === 'Savings')
    .reduce((sum, item) => sum + item.amount, 0)

  const debtPayments = debts
    .filter(debt => {
      if (debt.status !== 'active' || debt.monthlyPayment <= 0) return false
      return !debt.dueDate || debt.dueDate <= monthEndString
    })
    .reduce((sum, debt) => sum + debt.monthlyPayment, 0)

  const totalDebt = debts
    .filter(debt => debt.status === 'active')
    .reduce((sum, debt) => sum + debt.balance, 0)

  const trueMoneyPosition = savings - totalDebt
  const safeToSpend = savings - essentialTotal - savingsCommitments - debtPayments

  async function addCommitment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !supabase) return

    const cleanTitle = title.trim()
    const value = Number(amount)

    if (!cleanTitle || !Number.isFinite(value) || value <= 0) {
      setMessage('Enter a name and an amount greater than zero.')
      return
    }

    setSaving(true)
    setMessage('')

    const { data, error } = await supabase
      .from('financial_commitments')
      .insert({
        user_id: userId,
        title: cleanTitle,
        category,
        amount: value,
        due_date: dueDate || null,
        frequency,
        status: 'pending',
      })
      .select('id, title, category, amount, due_date, frequency, status')
      .single()

    if (error) {
      setMessage(`Could not save commitment: ${error.message}`)
    } else {
      setCommitments(current => [...current, mapCommitment(data)])
      setTitle('')
      setAmount('')
      setMessage('Commitment saved.')
    }

    setSaving(false)
  }

  async function markPaid(item: Commitment) {
    if (!supabase) return

    let update: Record<string, any>

    if (item.frequency === 'monthly' && item.dueDate) {
      const nextDate = new Date(`${item.dueDate}T12:00:00`)
      nextDate.setMonth(nextDate.getMonth() + 1)
      update = { due_date: dateString(nextDate), status: 'pending' }
    } else {
      update = { status: 'paid' }
    }

    const { data, error } = await supabase
      .from('financial_commitments')
      .update(update)
      .eq('id', item.id)
      .eq('user_id', userId)
      .select('id, title, category, amount, due_date, frequency, status')
      .single()

    if (error) {
      setMessage(`Could not update commitment: ${error.message}`)
      return
    }

    setCommitments(current =>
      current.map(row => row.id === item.id ? mapCommitment(data) : row)
    )
    setMessage(`${item.title} updated.`)
  }

  async function deleteCommitment(id: string) {
    if (!supabase) return

    const { error } = await supabase
      .from('financial_commitments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      setMessage(`Could not delete commitment: ${error.message}`)
      return
    }

    setCommitments(current => current.filter(item => item.id !== id))
    setMessage('Commitment removed.')
  }

  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-300/15 bg-[#102331]">
          <CardContent className="p-5">
            <p className="text-xs text-emerald-200">TRUE MONEY POSITION</p>
            <p className="mt-3 text-3xl font-semibold">
              {money(trueMoneyPosition, currency)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Current savings minus recorded outstanding debt
            </p>
            <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Current savings</span>
                <span>{money(savings, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Outstanding debt</span>
                <span>{money(totalDebt, currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-300/15 bg-[#102331]">
          <CardContent className="p-5">
            <p className="text-xs text-sky-200">SAFE-TO-SPEND</p>
            <p className={`mt-3 text-3xl font-semibold ${safeToSpend < 0 ? 'text-rose-300' : 'text-white'}`}>
              {money(safeToSpend, currency)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Savings after protecting your listed commitments
            </p>
            <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Essential bills and expenses</span>
                <span>{money(essentialTotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Debt repayments due</span>
                <span>{money(debtPayments, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Savings commitments</span>
                <span>{money(savingsCommitments, currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays size={18} />
            Upcoming commitments
          </CardTitle>
          <p className="text-xs text-slate-400">
            Add bills, essential expenses and savings you want MOVA to protect.
            Debt repayments are included automatically from your debt records.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={addCommitment} className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="e.g. Electricity bill"
              className="rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm outline-none"
            />
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={event => setAmount(event.target.value)}
              placeholder={`Amount (${currency})`}
              className="rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm outline-none"
            />
            <select
              value={category}
              onChange={event => setCategory(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm"
            >
              {categories.map(item => <option key={item}>{item}</option>)}
            </select>
            <input
              required
              type="date"
              value={dueDate}
              onChange={event => setDueDate(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm"
            />
            <select
              value={frequency}
              onChange={event => setFrequency(event.target.value as 'one_time' | 'monthly')}
              className="rounded-xl border border-white/10 bg-[#0b1422] px-4 py-3 text-sm sm:col-span-2"
            >
              <option value="one_time">One-time payment</option>
              <option value="monthly">Repeats monthly</option>
            </select>
            <Button type="submit" disabled={saving} className="sm:col-span-2">
              <Plus size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Add commitment'}
            </Button>
          </form>

          {message && (
            <p role="status" className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs text-slate-300">
              {message}
            </p>
          )}

          {loading ? (
            <p className="py-5 text-center text-sm text-slate-500">Loading commitments...</p>
          ) : commitments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
              <Wallet className="mx-auto mb-2 text-slate-500" size={24} />
              <p className="text-sm text-slate-300">No commitments added yet</p>
              <p className="mt-1 text-xs text-slate-500">Add your upcoming bills to calculate a more accurate Safe-to-Spend amount.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commitments.map(item => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.07] bg-white/[.02] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.category} · {item.dueDate || 'No due date'} · {item.frequency === 'monthly' ? 'Monthly' : 'One-time'}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{money(item.amount, currency)}</p>
                    <p className={`mt-1 text-[10px] ${item.status === 'paid' ? 'text-emerald-300' : 'text-amber-200'}`}>
                      {item.status === 'paid' ? 'Paid' : 'Pending'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => markPaid(item)}>
                        <CheckCircle2 size={14} className="mr-1" />
                        Paid
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => deleteCommitment(item.id)} aria-label="Delete commitment">
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] leading-5 text-slate-500">
            Estimates use the savings balance and commitments recorded in MOVA. Add all relevant bills and update your savings regularly. Do not add debt repayments here; MOVA includes recorded debt repayments automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
