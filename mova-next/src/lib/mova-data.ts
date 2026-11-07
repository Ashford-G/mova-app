/**
 * MOVA migration boundary.
 * Do not guess table names/columns here. Inspect the existing Supabase schema and
 * old app.js before replacing these safe placeholders with real queries.
 */
export type MovaProfile = { id: string; email?: string; plan?: 'free' | 'pro'; trialEndsAt?: string | null }
export type Transaction = { id: string; title: string; category: string; amount: number; date: string; direction: 'in' | 'out' }
export type Goal = { id: string; title: string; saved: number; target: number }

export const migrationStatus = {
  connectedToExistingProject: false,
  schemaVerified: false,
  financialLogicPorted: false,
  paymentsVerified: false,
} as const

export async function loadDashboardData() {
  // Intentionally returns no invented financial records.
  // Next migration step: map the actual existing tables/views/RPCs after schema inspection.
  return { balance: null as number | null, safeToSpend: null as number | null, income: null as number | null,
    expenses: null as number | null, transactions: [] as Transaction[], goals: [] as Goal[] }
}
