

import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type Transaction = {
  id: string
  title: string
  category: string
  amount: number
  date: string
  direction: 'in' | 'out' | 'transfer'
}

export type TransactionInput = {
  amount: number
  type: 'income' | 'expense' | 'transfer'
  category: string
  description: string
  date: string
}

export type Goal = {
  id: string
  title: string
  saved: number
  target: number
  deadline: string | null
  status: string
}

export type Debt = {
  id: string
  creditor: string
  balance: number
  interestRate: number
  monthlyPayment: number
  dueDate: string | null
  status: string
}

export type DashboardData = {
  currency: string
  monthlyIncome: number
  currentSavings: number
  transactionIncome: number
  transactionExpenses: number
  transactions: Transaction[]
  goals: Goal[]
  debts: Debt[]
}

export const migrationStatus = {
  connectedToExistingProject: isSupabaseConfigured,
  schemaVerified: true,
  financialLogicPorted: false,
  paymentsVerified: false,
} as const

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const toDateString = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    start: toDateString(start),
    end: toDateString(end),
  }
}

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    title: row.description || row.category,
    category: row.category,
    amount: Number(row.amount),
    date: row.transaction_date,
    direction:
      row.transaction_type === 'income'
        ? 'in'
        : row.transaction_type === 'transfer'
          ? 'transfer'
          : 'out',
  }
}

function requireConnection(userId: string) {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('MOVA is not connected to Supabase.')
  }

  if (!userId) {
    throw new Error('A signed-in user is required.')
  }

  return supabase
}

export async function createTransaction(
  userId: string,
  input: TransactionInput
): Promise<Transaction> {
  const client = requireConnection(userId)

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('Enter a valid amount greater than zero.')
  }

  if (!input.category.trim()) {
    throw new Error('Please select a transaction category.')
  }

  if (!input.date) {
    throw new Error('Please select a transaction date.')
  }

  const { data, error } = await client
    .from('transactions')
    .insert({
      user_id: userId,
      amount: input.amount,
      transaction_type: input.type,
      category: input.category.trim(),
      description: input.description.trim(),
      transaction_date: input.date,
    })
    .select(
      'id, amount, transaction_type, category, description, transaction_date'
    )
    .single()

  if (error) {
    throw new Error(`Could not save transaction: ${error.message}`)
  }

  return mapTransaction(data)
}

export async function loadTransactions(
  userId: string
): Promise<Transaction[]> {
  const client = requireConnection(userId)

  const { data, error } = await client
    .from('transactions')
    .select(
      'id, amount, transaction_type, category, description, transaction_date'
    )
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Could not load transactions: ${error.message}`)
  }

  return (data ?? []).map(mapTransaction)
}

export async function loadDashboardData(
  userId: string
): Promise<DashboardData> {
  const client = requireConnection(userId)
  const { start, end } = getMonthRange()

  const [
    profileResult,
    monthlyTransactionsResult,
    recentTransactionsResult,
    goalsResult,
    debtsResult,
  ] = await Promise.all([
    client
      .from('financial_profiles')
      .select('monthly_income, current_savings, currency')
      .eq('user_id', userId)
      .maybeSingle(),

    client
      .from('transactions')
      .select('id, amount, transaction_type, category, description, transaction_date')
      .eq('user_id', userId)
      .gte('transaction_date', start)
      .lt('transaction_date', end),

    client
      .from('transactions')
      .select('id, amount, transaction_type, category, description, transaction_date')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .limit(10),

    client
      .from('goals')
      .select('id, goal_name, target_amount, current_amount, deadline, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    client
      .from('debts')
      .select('id, creditor_name, balance, interest_rate, monthly_payment, due_date, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (profileResult.error) {
    throw new Error(`Financial profile: ${profileResult.error.message}`)
  }

  if (monthlyTransactionsResult.error) {
    throw new Error(`Monthly transactions: ${monthlyTransactionsResult.error.message}`)
  }

  if (recentTransactionsResult.error) {
    throw new Error(`Recent transactions: ${recentTransactionsResult.error.message}`)
  }

  if (goalsResult.error) {
    throw new Error(`Goals: ${goalsResult.error.message}`)
  }

  if (debtsResult.error) {
    throw new Error(`Debts: ${debtsResult.error.message}`)
  }

  const profile = profileResult.data
  const monthlyTransactions = monthlyTransactionsResult.data ?? []

  const transactionIncome = monthlyTransactions
    .filter(row => row.transaction_type === 'income')
    .reduce((total, row) => total + Number(row.amount), 0)

  const transactionExpenses = monthlyTransactions
    .filter(row => row.transaction_type === 'expense')
    .reduce((total, row) => total + Number(row.amount), 0)

  const transactions: Transaction[] = (
    recentTransactionsResult.data ?? []
  ).map(mapTransaction)

  const goals: Goal[] = (goalsResult.data ?? []).map(row => ({
    id: row.id,
    title: row.goal_name,
    saved: Number(row.current_amount),
    target: Number(row.target_amount),
    deadline: row.deadline,
    status: row.status,
  }))

  const debts: Debt[] = (debtsResult.data ?? []).map(row => ({
    id: row.id,
    creditor: row.creditor_name,
    balance: Number(row.balance),
    interestRate: Number(row.interest_rate),
    monthlyPayment: Number(row.monthly_payment),
    dueDate: row.due_date,
    status: row.status,
  }))

  return {
    currency: profile?.currency || 'USD',
    monthlyIncome: Number(profile?.monthly_income ?? 0),
    currentSavings: Number(profile?.current_savings ?? 0),
    transactionIncome,
    transactionExpenses,
    transactions,
    goals,
    debts,
  }
}
