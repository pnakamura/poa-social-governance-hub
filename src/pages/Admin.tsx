import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { UserPlus, KeyRound, Trash2, Shield, Users } from 'lucide-react'

interface UserProfile {
  id: string
  nome: string
  email: string
  role: string
  departamento: string | null
  cargo: string | null
  force_password_change: boolean
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  analista: 'Normal',
  visualizador: 'Leitor',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  gestor: 'bg-amber-500/10 text-amber-600',
  analista: 'bg-primary/10 text-primary',
  visualizador: 'bg-muted text-muted-foreground',
}

export default function Admin() {
  const { session } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  // Create user form
  const [showCreate, setShowCreate] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newNome, setNewNome] = useState('')
  const [newPassword, setNewPassword] = useState('123456')
  const [newRole, setNewRole] = useState('analista')
  const [creating, setCreating] = useState(false)

  const callAdminApi = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('admin-users', { body })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    return data
  }

  const fetchUsers = async () => {
    try {
      const data = await callAdminApi({ action: 'list' })
      setUsers(data.users ?? [])
    } catch (err: any) {
      toast.error('Erro ao carregar usuários', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) fetchUsers()
  }, [session])

  const handleCreate = async () => {
    if (!newEmail || !newNome) return
    setCreating(true)
    try {
      await callAdminApi({ action: 'create', email: newEmail, password: newPassword, nome: newNome, role: newRole })
      toast.success('Usuário criado com sucesso')
      setShowCreate(false)
      setNewEmail('')
      setNewNome('')
      setNewPassword('123456')
      setNewRole('analista')
      fetchUsers()
    } catch (err: any) {
      toast.error('Erro ao criar usuário', { description: err.message })
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await callAdminApi({ action: 'update_role', user_id: userId, role })
      toast.success('Role atualizado')
      fetchUsers()
    } catch (err: any) {
      toast.error('Erro ao atualizar role', { description: err.message })
    }
  }

  const handleResetPassword = async (userId: string) => {
    const tempPassword = Math.random().toString(36).slice(-8)
    try {
      await callAdminApi({ action: 'reset_password', user_id: userId, new_password: tempPassword })
      toast.success(`Senha resetada para: ${tempPassword}`, { duration: 10000 })
    } catch (err: any) {
      toast.error('Erro ao resetar senha', { description: err.message })
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      await callAdminApi({ action: 'delete', user_id: userId })
      toast.success('Usuário removido')
      fetchUsers()
    } catch (err: any) {
      toast.error('Erro ao remover', { description: err.message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-sm text-muted-foreground">Criar, editar e gerenciar acessos ao sistema</p>
          </div>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" /> Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha temporária</Label>
                <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Perfil de acesso</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="analista">Normal</SelectItem>
                    <SelectItem value="visualizador">Leitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={val => handleUpdateRole(u.id, val)}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="analista">Normal</SelectItem>
                          <SelectItem value="visualizador">Leitor</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {u.force_password_change && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">Senha temporária</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Resetar senha" onClick={() => handleResetPassword(u.id)}>
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Remover" className="text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
