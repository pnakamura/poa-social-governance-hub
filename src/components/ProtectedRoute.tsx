import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  children: React.ReactNode
  requiredRole?: 'admin' | 'gestor'
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { session, profile, loading, role } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (profile?.force_password_change) return <Navigate to="/reset-password" replace />

  if (requiredRole && role !== requiredRole && role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
