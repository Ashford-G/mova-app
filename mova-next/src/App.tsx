import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthScreen } from '@/components/auth-screen'
import { AppShell } from '@/components/app-shell'

export default function App() {
  const [session,setSession]=useState<Session|null>(null)
  const [ready,setReady]=useState(!supabase)
  useEffect(()=>{
    if (!supabase) return
    let alive=true
    supabase.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setReady(true)}})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next))
    return ()=>{alive=false;subscription.unsubscribe()}
  },[])
  async function signOut(){await supabase?.auth.signOut();setSession(null)}
  if(!ready) return <div className="grid min-h-screen place-items-center text-sm text-slate-400">Loading MOVA…</div>
  return session ? <AppShell
  email={session.user.email ?? 'MOVA member'}
  userId={session.user.id}
  onSignOut={signOut}
/> : <AuthScreen/>
}
