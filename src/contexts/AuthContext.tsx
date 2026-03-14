import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { Session, User } from '@supabase/supabase-js'

type UserRole = 'admin' | 'gestor' | 'analista' | 'visualizador'

interface Profile {
  id: string
  nome: string
  email: string
  role: UserRole
  departamento: string | null
  cargo: string | null
  force_password_change: boolean
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, email, role, departamento, cargo, force_password_change')
        .eq('id', userId)
        .maybeSingle()
      setProfile(data as Profile | null)
    } catch (err) {
      console.error('fetchProfile error', err)
      setProfile(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (s?.user) await fetchProfile(s.user.id)
  }, [fetchProfile])

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Then listen for changes — do NOT await inside callback to avoid lock contention
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        // Fire-and-forget to avoid blocking the auth lock
        fetchProfile(s.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) return { error: error.message }

      // Use session user id directly, not stale profile state
      const currentUser = (await supabase.auth.getUser()).data.user
      if (!currentUser) return { error: 'Sessão expirada' }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ force_password_change: false })
        .eq('id', currentUser.id)

      if (profileError) return { error: profileError.message }

      // Refresh profile so ProtectedRoute sees the new flag
      await fetchProfile(currentUser.id)
      return { error: null }
    } catch (err: any) {
      return { error: err?.message ?? 'Erro inesperado' }
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, role: profile?.role ?? null, loading, signIn, signOut, updatePassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
