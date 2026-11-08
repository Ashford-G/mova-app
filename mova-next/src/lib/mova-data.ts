
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

export type GoalInput = {
  title: string
  target: number
  deadline: string | null
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

export type DebtInput = {
  creditor: string
  balance: number
  interestRate: number
  monthlyPayment: number
  dueDate: string | null
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

function mapGoal(row: any): Goal {
  return {
    id: row.id,
    title: row.goal_name,
    saved: Number(row.current_amount ?? 0),
    target: Number(row.target_amount),
    deadline: row.deadline,
    status: row.status,
  }
}

function mapDebt(row: any): Debt {
  return {
    id: row.id,
    creditor: row.creditor_name,
    balance: Number(row.balance ?? 0),
    interestRate: Number(row.interest_rate ?? 0),
    monthlyPayment: Number(row.monthly_payment ?? 0),
    dueDate: row.due_date,
    status: row.status,
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

export async function loadGoals(userId: string): Promise<Goal[]> {
  const client = requireConnection(userId)

  const { data, error } = await client
    .from('goals')
    .select(
      'id, goal_name, target_amount, current_amount, deadline, status'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Could not load goals: ${error.message}`)
  }

  return (data ?? []).map(mapGoal)
}

export async function createGoal(
  userId: string,
  input: GoalInput
): Promise<Goal> {
  const client = requireConnection(userId)

  const title = input.title.trim()

  if (!title) {
    throw new Error('Please enter a name for your goal.')
  }

  if (!Number.isFinite(input.target) || input.target <= 0) {
    throw new Error('Enter a target amount greater than zero.')
  }

  const { data, error } = await client
    .from('goals')
    .insert({
      user_id: userId,
      goal_name: title,
      target_amount: input.target,
      current_amount: 0,
      deadline: input.deadline || null,
      status: 'active',
    })
    .select(
      'id, goal_name, target_amount, current_amount, deadline, status'
    )
    .single()

  if (error) {
    throw new Error(`Could not create goal: ${error.message}`)
  }

  return mapGoal(data)
}

export async function updateGoalProgress(
  userId: string,
  goalId: string,
  currentAmount: number
): Promise<Goal> {
  const client = requireConnection(userId)

  if (!goalId) {
    throw new Error('A goal must be selected.')
  }

  if (!Number.isFinite(currentAmount) || currentAmount < 0) {
    throw new Error('Enter a valid saved amount.')
  }

  const { data, error } = await client
    .from('goals')
    .update({
      current_amount: currentAmount,
    })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select(
      'id, goal_name, target_amount, current_amount, deadline, status'
    )
    .single()

  if (error) {
    throw new Error(`Could not update goal progress: ${error.message}`)
  }

  return mapGoal(data)
}

export async function loadDebts(userId: string): Promise<Debt[]> {
  const client = requireConnection(userId)

  const { data, error } = await client
    .from('debts')
    .select(
      'id, creditor_name, balance, interest_rate, monthly_payment, due_date, status'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Could not load debts: ${error.message}`)
  }

  return (data ?? []).map(mapDebt)
}

export async function createDebt(
  userId: string,
  input: DebtInput
): Promise<Debt> {
  const client = requireConnection(userId)
  const creditor = input.creditor.trim()

  if (!creditor) {
    throw new Error('Please enter the creditor or lender name.')
  }

  if (!Number.isFinite(input.balance) || input.balance <= 0) {
    throw new Error('Enter a valid outstanding balance.')
  }

  if (!Number.isFinite(input.interestRate) || input.interestRate < 0) {
    throw new Error('Enter a valid interest rate.')
  }

  if (!Number.isFinite(input.monthlyPayment) || input.monthlyPayment < 0) {
    throw new Error('Enter a valid monthly payment.')
  }

  const { data, error } = await client
    .from('debts')
    .insert({
      user_id: userId,
      creditor_name: creditor,
      balance: input.balance,
      interest_rate: input.interestRate,
      monthly_payment: input.monthlyPayment,
      due_date: input.dueDate || null,
      status: 'active',
    })
    .select(
      'id, creditor_name, balance, interest_rate, monthly_payment, due_date, status'
    )
    .single()

  if (error) {
    throw new Error(`Could not create debt: ${error.message}`)
  }

  return mapDebt(data)
}

export async function updateDebtBalance(
  userId: string,
  debtId: string,
  balance: number
): Promise<Debt> {
  const client = requireConnection(userId)

  if (!debtId) {
    throw new Error('Please select a debt.')
  }

  if (!Number.isFinite(balance) || balance < 0) {
    throw new Error('Enter a valid outstanding balance.')
  }

  const { data, error } = await client
    .from('debts')
    .update({
      balance,
    })
    .eq('id', debtId)
    .eq('user_id', userId)
    .select(
      'id, creditor_name, balance, interest_rate, monthly_payment, due_date, status'
    )
    .single()

  if (error) {
    throw new Error(`Could not update debt balance: ${error.message}`)
  }

  return mapDebt(data)
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
      .select(
        'id, amount, transaction_type, category, description, transaction_date'
      )
      .eq('user_id', userId)
      .gte('transaction_date', start)
      .lt('transaction_date', end),

    client
      .from('transactions')
      .select(
        'id, amount, transaction_type, category, description, transaction_date'
      )
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .limit(10),

    client
      .from('goals')
      .select(
        'id, goal_name, target_amount, current_amount, deadline, status'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    client
      .from('debts')
      .select(
        'id, creditor_name, balance, interest_rate, monthly_payment, due_date, status'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (profileResult.error) {
    throw new Error(`Financial profile: ${profileResult.error.message}`)
  }

  if (monthlyTransactionsResult.error) {
    throw new Error(
      `Monthly transactions: ${monthlyTransactionsResult.error.message}`
    )
  }

  if (recentTransactionsResult.error) {
    throw new Error(
      `Recent transactions: ${recentTransactionsResult.error.message}`
    )
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

  const goals: Goal[] = (goalsResult.data ?? []).map(mapGoal)
  const debts: Debt[] = (debtsResult.data ?? []).map(mapDebt)

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
