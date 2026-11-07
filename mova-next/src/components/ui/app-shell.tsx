import { useState } from 'react'
import { Activity, ArrowDownLeft, ArrowUpRight, Bell, ChevronDown, CircleHelp, Command, CreditCard, Gauge, Goal, LayoutDashboard, LogOut, Menu, MessageCircle, Search, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoney } from '@/lib/utils'

const nav = [
  { label:'Overview', icon:LayoutDashboard, group:'WORKSPACE' },
  { label:'Intelligence', icon:Activity, group:'WORKSPACE' },
  { label:'Transactions', icon:ArrowUpRight, group:'MONEY' },
  { label:'Goals', icon:Goal, group:'MONEY' },
  { label:'MOVA Safe', icon:ShieldCheck, group:'MONEY' },
  { label:'MOVA Price', icon:CreditCard, group:'MONEY' },
  { label:'AI Coach', icon:Sparkles, group:'PERSONAL' },
  { label:'Profile', icon:CircleHelp, group:'PERSONAL' },
]
const descriptions: Record<string,string> = {
  Overview:'Your financial position at a glance.',
  Intelligence:'Understand patterns across your financial life.',
  Transactions:'A single view of money moving in and out.',
  Goals:'Give your next milestone a clear plan.',
  'MOVA Safe':'Your financial safety space.',
  'MOVA Price':'Make more informed price decisions.',
  'AI Coach':'A thinking partner for your money decisions.',
  Profile:'Your account and preferences.',
}
export function AppShell({ email, onSignOut }: { email:string; onSignOut:()=>void }) {
  const [active,setActive]=useState('Overview')
  const [mobileOpen,setMobileOpen]=useState(false)
  const [showBalance,setShowBalance]=useState(true)
  const groups=['WORKSPACE','MONEY','PERSONAL']
  const sidebar=<aside className="flex h-full flex-col border-r border-white/[.07] bg-[#0b1422]">
    <div className="flex h-[76px] items-center gap-3 border-b border-white/[.07] px-6"><div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-300 text-slate-950"><Wallet size={19}/></div><div><div className="font-bold tracking-[.2em]">MOVA</div><div className="text-[9px] tracking-[.22em] text-slate-500">MONEY OS</div></div></div>
    <div className="px-4 py-6">{groups.map(g=><div key={g} className="mb-6"><p className="mb-2 px-3 text-[9px] font-semibold tracking-[.2em] text-slate-600">{g}</p><div className="space-y-1">{nav.filter(n=>n.group===g).map(item=><button key={item.label} onClick={()=>{setActive(item.label);setMobileOpen(false)}} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${active===item.label?'bg-emerald-300/10 text-emerald-200':'text-slate-400 hover:bg-white/5 hover:text-white'}`}><item.icon size={17}/>{item.label}{item.label==='AI Coach'&&<span className="ml-auto rounded-md bg-white/8 px-1.5 py-0.5 text-[9px]">AI</span>}</button>)}</div></div>)}</div>
    <div className="mt-auto p-4"><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.06] p-4"><div className="flex items-center gap-2 text-emerald-200"><Sparkles size={15}/><span className="text-xs font-semibold">MOVA Pro</span></div><p className="mt-2 text-xs leading-5 text-slate-400">More clarity for every financial decision.</p><button onClick={()=>setActive('Profile')} className="mt-3 text-xs font-semibold text-emerald-200">Explore membership →</button></div><button onClick={onSignOut} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-white/5 hover:text-white"><LogOut size={15}/> Sign out</button></div>
  </aside>
  return <div className="min-h-screen bg-[#080f1b] text-slate-100">
    <div className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block">{sidebar}</div>
    {mobileOpen&&<div className="fixed inset-0 z-40 lg:hidden"><button aria-label="Close menu" onClick={()=>setMobileOpen(false)} className="absolute inset-0 bg-black/70"/><div className="relative h-full w-[280px]">{sidebar}</div></div>}
    <div className="lg:pl-[248px]">
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/[.07] bg-[#080f1b]/90 px-5 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="lg:hidden" onClick={()=>setMobileOpen(true)}><Menu size={19}/></Button><div><p className="text-sm font-semibold">{active}</p><p className="hidden text-[11px] text-slate-500 sm:block">{descriptions[active]}</p></div></div>
        <div className="flex items-center gap-2"><Button variant="ghost" size="icon"><Search size={17}/></Button><Button variant="ghost" size="icon"><Bell size={17}/></Button><div className="ml-2 flex items-center gap-2 border-l border-white/10 pl-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-xs font-semibold">{email.slice(0,1).toUpperCase()}</div><span className="hidden max-w-[140px] truncate text-xs text-slate-300 sm:block">{email}</span><ChevronDown size={14} className="text-slate-500"/></div></div>
      </header>
      <main className="mx-auto max-w-[1440px] p-5 md:p-8">
        {active==='Overview'?<><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs text-slate-500">Your financial overview</p><h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Good to see you.</h1><p className="mt-2 text-sm text-slate-400">A calmer, clearer picture starts here.</p></div><Badge>Preview environment</Badge></div>
          <Card className="relative overflow-hidden border-emerald-300/15 bg-gradient-to-br from-[#142c36] via-[#102331] to-[#111b2b]"><div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border border-emerald-200/10"/><CardContent className="relative grid gap-8 p-6 md:grid-cols-[1.2fr_.8fr] md:p-8"><div><div className="flex items-center gap-2 text-xs text-emerald-100/70"><Gauge size={15}/> TRUE MONEY POSITION <span className="rounded-full bg-white/10 px-2 py-1 text-[9px]">DEMO DISPLAY</span></div><div className="mt-5 flex items-center gap-3"><h2 className="text-4xl font-semibold tracking-tight md:text-5xl">{showBalance?'— — —':'••••••'}</h2><button onClick={()=>setShowBalance(!showBalance)} className="text-xs text-slate-400">{showBalance?'Hidden until connected':'Show'}</button></div><p className="mt-3 max-w-sm text-xs leading-5 text-slate-400">Your verified balance will appear here once we connect MOVA to your existing financial records.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-black/10 p-4"><p className="text-[10px] text-slate-400">Safe-to-Spend</p><p className="mt-3 text-xl font-semibold">—</p><p className="mt-1 text-[10px] text-slate-500">Awaiting data connection</p></div><div className="rounded-xl border border-white/10 bg-black/10 p-4"><p className="text-[10px] text-slate-400">Savings</p><p className="mt-3 text-xl font-semibold">—</p><p className="mt-1 text-[10px] text-slate-500">Awaiting data connection</p></div></div></CardContent></Card>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{label:'Income',icon:ArrowDownLeft},{label:'Expenses',icon:ArrowUpRight},{label:'Obligations',icon:CreditCard},{label:'Goals progress',icon:Goal}].map(x=><Card key={x.label}><CardContent className="p-5"><div className="flex items-center justify-between text-slate-400"><span className="text-xs">{x.label}</span><x.icon size={16}/></div><p className="mt-4 text-2xl font-semibold">—</p><p className="mt-1 text-[10px] text-slate-600">Connect existing MOVA data</p></CardContent></Card>)}</div>
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_.75fr]"><Card><CardHeader><CardTitle>Recent activity</CardTitle></CardHeader><CardContent><div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-white/10 px-5 text-center"><div><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-400"><ArrowUpRight size={18}/></div><p className="text-sm font-medium text-slate-300">Your transactions will appear here</p><p className="mt-1 text-xs text-slate-500">We will connect your existing transaction history during migration.</p></div></div></CardContent></Card><Card><CardHeader><CardTitle>Financial focus</CardTitle></CardHeader><CardContent><div className="space-y-4"><div className="flex items-start gap-3"><div className="rounded-lg bg-emerald-300/10 p-2 text-emerald-200"><ShieldCheck size={16}/></div><div><p className="text-xs font-medium">Build your financial safety net</p><p className="mt-1 text-xs leading-5 text-slate-500">MOVA Safe will show your safety position once connected.</p></div></div><div className="flex items-start gap-3"><div className="rounded-lg bg-sky-300/10 p-2 text-sky-200"><Sparkles size={16}/></div><div><p className="text-xs font-medium">Make informed decisions</p><p className="mt-1 text-xs leading-5 text-slate-500">Your Intelligence and AI Coach tools are being migrated.</p></div></div></div></CardContent></Card></div>
        </>:<Card><CardContent className="p-8 md:p-10"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-200"><Command size={22}/></div><h1 className="text-2xl font-semibold">{active}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{descriptions[active]} This screen is scaffolded in the new interface. We will reconnect its existing MOVA data, calculations and actions after inspecting the original implementation and database schema.</p><div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1.5 text-xs text-amber-100/80">Migration pending · existing data not changed</div></CardContent></Card>}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] pt-5 text-[10px] text-slate-600"><span>© {new Date().getFullYear()} MOVA · Money Operating System</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-300"/ >Preview build — not production financial advice</span></footer>
      </main>
    </div>
  </div>
}
