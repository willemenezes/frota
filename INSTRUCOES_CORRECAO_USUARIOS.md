# Instruções para Corrigir Criação de Usuários

## Problema
A criação de usuários estava falhando com erro 403 "User not allowed" porque a Admin API do Supabase não funciona diretamente no cliente.

## Solução
Foi criada uma Edge Function no Supabase que usa o service role key para criar usuários com permissões adequadas.

## Passos para Aplicar a Correção

### 1. Executar Script SQL no Supabase
1. Acesse o Supabase Dashboard → SQL Editor
2. Abra o arquivo `fix_user_creation.sql`
3. Execute o script completo no SQL Editor
4. Verifique se todas as funções e políticas foram criadas com sucesso

### 2. Fazer Deploy da Edge Function
1. Certifique-se de que o Supabase CLI está instalado:
   ```bash
   npm install -g supabase
   ```

2. Faça login no Supabase CLI:
   ```bash
   supabase login
   ```

3. Navegue até a pasta da função:
   ```bash
   cd supabase/functions/create-user
   ```

4. Faça o deploy da função:
   ```bash
   supabase functions deploy create-user --project-ref <seu-project-ref>
   ```
   
   Ou use o comando direto da raiz do projeto:
   ```bash
   supabase functions deploy create-user
   ```

5. Configure as variáveis de ambiente no Supabase Dashboard:
   - Acesse: **Project Settings → Edge Functions → Secrets**
   - A função já usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` automaticamente
   - Certifique-se de que o `SUPABASE_SERVICE_ROLE_KEY` está configurado

### 3. Verificar se Está Funcionando
1. Acesse a página de Usuários no sistema
2. Tente criar um novo usuário (Gestor, Motorista ou Administrador)
3. Verifique se o usuário foi criado com sucesso

## O Que Foi Alterado

### Arquivos Criados/Modificados:

1. **`supabase/functions/create-user/index.ts`**
   - Nova Edge Function que cria usuários usando service role
   - Verifica se o usuário atual é administrador
   - Cria perfil e role automaticamente

2. **`fix_user_creation.sql`**
   - Função `get_user_emails()` para obter emails (apenas administradores)
   - Função `set_user_role()` para definir roles
   - Atualização da função `handle_new_user()` para não criar role automaticamente
   - Políticas RLS atualizadas para permitir criação de usuários por administradores

3. **`src/pages/Users.tsx`**
   - Atualizado para usar Edge Function ao invés de Admin API
   - Atualizado para usar função `get_user_emails()` ao invés de `admin.listUsers()`

## Notas Importantes

- Apenas usuários com role "administrador" podem criar outros usuários
- A Edge Function verifica automaticamente se o usuário atual é administrador
- Os perfis são criados automaticamente, mas os roles são definidos pela Edge Function
- A função `handle_new_user()` não cria role automaticamente para evitar conflitos

## Troubleshooting

### Se ainda aparecer erro 403:
1. Verifique se o `SUPABASE_SERVICE_ROLE_KEY` está configurado no Supabase Dashboard
2. Verifique se a Edge Function foi deployada com sucesso
3. Verifique se o usuário logado tem role "administrador" na tabela `user_roles`

### Se não aparecerem os emails na lista:
1. Verifique se a função `get_user_emails()` foi criada no banco
2. Verifique se o usuário logado tem role "administrador"
3. Verifique os logs no console do navegador para erros específicos

