

## Plano: Sistema Completo de Login, Roles e Gestão de Usuários

### Mapeamento de Roles

O enum `user_role` existente no banco é: `admin | gestor | analista | visualizador`. Vou mapear:
- **Admin** → `admin`
- **Normal** → `analista` (acesso padrão de trabalho)
- **Leitor** → `visualizador` (somente leitura)

As tabelas `profiles`, `user_roles` e as funções `has_role`, `get_user_role`, `handle_new_user` já existem no banco.

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/contexts/AuthContext.tsx` | Context com session, user, role, loading, signIn, signOut, updatePassword |
| `src/pages/Login.tsx` | Tela de login (email + senha) |
| `src/pages/ResetPassword.tsx` | Tela de redefinir senha (primeiro acesso ou esqueci senha) |
| `src/pages/Admin.tsx` | Painel admin: listar usuários, criar, alterar role, resetar senha |
| `src/components/ProtectedRoute.tsx` | Wrapper que redireciona para /login se não autenticado, e verifica role para rotas admin |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Envolver com AuthProvider, adicionar rotas /login, /reset-password, /admin; proteger rotas existentes |
| `src/components/layout/Sidebar.tsx` | Mostrar nome/email do usuário logado no footer, botão de logout, mostrar "Admin" no menu somente para admin |
| `src/components/layout/AppLayout.tsx` | Proteger com ProtectedRoute |
| `src/config/nav-items.ts` | Adicionar item "Admin" no grupo Saída (visível só para admin) |

### Seed do Admin

Criar o usuário `paulo.nakamura@atitude45.com.br` com senha `123456` via Supabase Auth API (edge function ou script). Como a confirmação de email precisa estar desativada, vou:
1. Criar uma migration que insere na `user_roles` o role admin para esse email (após criar o usuário via `supabase.auth.signUp` no primeiro acesso ou via edge function)
2. Ou usar uma edge function `seed-admin` que cria o usuário com `service_role`

**Abordagem escolhida**: Edge function `seed-admin` que usa `service_role` para criar o usuário, confirmar email automaticamente e atribuir role admin.

### Confirmação de Email

Será necessário o usuário ir ao Supabase Dashboard → Auth → Providers → Email e desativar "Confirm email". Informarei isso no chat.

### Fluxo de Primeiro Acesso

1. Usuário faz login com senha temporária (123456)
2. O admin pode marcar um flag `force_password_change` no profiles
3. Após login, se `force_password_change = true`, redireciona para /reset-password
4. Após trocar senha, desmarca o flag

**Requer migration**: Adicionar coluna `force_password_change boolean default false` na tabela `profiles`.

### Fluxo do Painel Admin

- Listar todos os profiles (com role da user_roles)
- Criar novo usuário (signUp via edge function com service_role, sem confirmação)
- Alterar role (update user_roles)
- Resetar senha (gera senha temporária via edge function + marca force_password_change)
- Desativar usuário

### Resumo de Mudanças

1. **Migration SQL**: Adicionar `force_password_change` em profiles
2. **Edge Function `admin-users`**: CRUD de usuários com service_role (criar, listar, resetar senha)
3. **AuthContext**: Session management completo
4. **Login page**: Formulário simples
5. **ResetPassword page**: Trocar senha no primeiro acesso
6. **Admin page**: Gestão de usuários (só admin)
7. **ProtectedRoute**: Guard de autenticação + role
8. **App.tsx**: Reestruturar rotas
9. **Sidebar**: Dados do usuário logado + logout
10. **Seed admin**: Via edge function no deploy

