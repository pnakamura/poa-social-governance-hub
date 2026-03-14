import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword, profile } = useAuth()
  const navigate = useNavigate()

  // If user no longer needs to change password, redirect away
  useEffect(() => {
    if (profile && !profile.force_password_change) {
      navigate('/', { replace: true })
    }
  }, [profile, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (newPassword !== confirm) {
      toast.error('As senhas não coincidem')
      return
    }
    setLoading(true)
    try {
      const { error } = await updatePassword(newPassword)
      if (error) {
        toast.error('Erro ao redefinir senha', { description: error })
      } else {
        toast.success('Senha alterada com sucesso!')
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      toast.error('Erro inesperado', { description: err?.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-dot-grid p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <KeyRound className="w-7 h-7 text-amber-500" />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            {profile?.force_password_change
              ? 'Você deve alterar sua senha no primeiro acesso.'
              : 'Digite sua nova senha abaixo.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a nova senha" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'Salvar nova senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
