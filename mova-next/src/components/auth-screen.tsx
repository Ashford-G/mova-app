
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, LockKeyhole, WalletCards } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthScreen() {
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMessage('')

    if (!supabase) {
      setMessage('Add the existing Supabase URL and publishable/anon key to the preview environment first.')
      return
    }

    if (mode === 'signup' && !fullName.trim()) {
      setMessage('Please enter your full name.')
      return
    }

    setBusy(true)

    try {
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
              emailRedirectTo: window.location.origin,
            },
          })

      setMessage(
        result.error?.message ??
        (mode === 'signup'
          ? 'Account created. Check your email if confirmation is enabled.'
          : 'Signed in.')
      )
    } catch {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden border-r border-white/5 bg-[#0d1929] p-12 lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 text-slate-950"><WalletCards size={21}/></div>
        <span className="text-xl font-bold tracking-[.2em]">MOVA</span>
      </div>
      <div className="relative z-10 max-w-lg">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[.24em] text-emerald-300">Your money. In perspective.</p>
        <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">A clearer view of your financial life.</h1>
        <p className="mt-6 max-w-md leading-7 text-slate-400">Understand what you have, what you owe, and what you can confidently do next.</p>
      </div>
      <div className="text-xs text-slate-600">MOVA · Money Operating System</div>
      <div className="pointer-events-none absolute -bottom-36 -right-28 h-[34rem] w-[34rem] rounded-full border border-emerald-300/10"/>
      <div className="pointer-events-none absolute -bottom-20 -right-12 h-[24rem] w-[24rem] rounded-full border border-emerald-300/10"/>
    </section>

    <section className="flex items-center justify-center px-6 py-12">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 text-slate-950"><WalletCards/></div>
          <b className="tracking-[.2em]">MOVA</b>
        </div>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[.2em] text-emerald-300">Welcome to MOVA</p>
          <h2 className="mt-3 text-3xl font-semibold">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-sm text-slate-400">Sign in to continue to your money dashboard.</p>
        </div>

        <div className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete={mode==='signin'?'current-password':'new-password'} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/>
          </div>
        </div>

        <Button className="mt-6 w-full" size="lg" disabled={busy}>
          {busy?'Please wait':mode==='signin'?'Sign in':'Create account'} <ArrowUpRight size={16}/>
        </Button>

        <button type="button" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('')}} className="mt-5 w-full text-center text-sm text-slate-400 hover:text-white">
          {mode==='signin'?"Don't have an account? Create one":"Already registered? Sign in"}
        </button>

        {!isSupabaseConfigured && <p className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/80"><LockKeyhole className="mb-1 inline" size={14}/> Preview setup required: configure Supabase public environment variables. No credentials are embedded in this project.</p>}

        {message && <p role="status" className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{message}</p>}
      </form>
    </section>
  </main>
}
