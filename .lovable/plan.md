
Diagnóstico do loop no `/reset-password` (com base no código + logs):

1) O `updateUser()` está sendo executado (há log `user_modified` no Auth), mas o `profiles.force_password_change` não está sendo atualizado (continua `true` no banco).  
2) O `AuthContext` usa `onAuthStateChange(async ...)` com `await fetchProfile(...)`, o que conflita com lock interno do Supabase Auth (`Lock ... not released`, `Lock broken by another request with 'steal'`).  
3) Há rejeição não tratada (`UNHANDLED_PROMISE_REJECTION`), e no `ResetPassword` não existe `try/catch/finally`; quando falha, o botão pode ficar “travado” e a navegação não conclui.  
4) O projeto mantém dois clients Supabase (`@/integrations/supabase/client` e `@/lib/supabase`), o que aumenta disputa de lock de sessão.

Plano de correção (implementação):

1. Unificar o client Supabase (eliminar concorrência de lock)
- Arquivo: `src/lib/supabase.ts`
- Trocar para reexportar o mesmo client de `@/integrations/supabase/client` (sem criar outro `createClient`).
- Resultado: um único gerenciador de sessão/token no app.

2. Refatorar `AuthContext` para fluxo de auth sem lock/race
- Arquivo: `src/contexts/AuthContext.tsx`
- Remover `await` direto dentro do callback de `onAuthStateChange`.
- Criar função `syncSession(session)` e disparar leitura de perfil fora do lock (sem bloquear callback).
- Garantir `fetchProfile` com tratamento de erro e `setProfile(null)` quando não houver dados.
- Em `updatePassword`:
  - adicionar `try/catch`,
  - atualizar `profiles.force_password_change` por `user.id` (não depender de `profile` em memória),
  - validar erro do update de `profiles` (não ignorar),
  - refazer `refreshProfile()` após sucesso.

3. Blindar a página de reset para não travar
- Arquivo: `src/pages/ResetPassword.tsx`
- Envolver submit em `try/catch/finally` para sempre tirar `loading`.
- Mostrar erro amigável quando houver exceção.
- Após sucesso, só navegar quando o contexto refletir `force_password_change = false`.
- Opcional de UX: se usuário já não precisa trocar senha, redirecionar automaticamente para `/`.

4. Validação do fluxo (E2E)
- Login com senha temporária → deve abrir `/reset-password`.
- Salvar nova senha → deve sair da tela e entrar no dashboard.
- Recarregar página autenticado → não voltar para `/reset-password`.
- Console sem `Lock broken by another request with the 'steal' option`.
- `profiles.force_password_change` do usuário deve ficar `false` após troca.

Arquivos previstos:
- `src/lib/supabase.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/ResetPassword.tsx`

Sem migration nova: o schema já atende; é correção de fluxo, concorrência de sessão e tratamento de erro.
