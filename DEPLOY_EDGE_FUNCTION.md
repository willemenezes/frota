# Como Fazer Deploy da Edge Function

## Opção 1: Via Supabase Dashboard (RECOMENDADO)

### Passo 1: Acessar o Dashboard
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto

### Passo 2: Criar a Edge Function
1. Vá em **Edge Functions** no menu lateral
2. Clique em **Create a new function**
3. Nome da função: `create-user`
4. Copie e cole o conteúdo do arquivo `supabase/functions/create-user/index.ts`

### Passo 3: Configurar Secrets
1. Vá em **Project Settings → Edge Functions → Secrets**
2. Verifique se as seguintes variáveis estão configuradas:
   - `SUPABASE_URL` (já configurada automaticamente)
   - `SUPABASE_SERVICE_ROLE_KEY` (configure manualmente)
   
   Para obter o `SUPABASE_SERVICE_ROLE_KEY`:
   - Vá em **Project Settings → API**
   - Copie o valor de **service_role** key (não o anon key!)
   - Cole em **Edge Functions → Secrets → SUPABASE_SERVICE_ROLE_KEY**

### Passo 4: Deploy
1. Clique em **Deploy** na função criada

---

## Opção 2: Via Supabase CLI (npx)

Se você preferir usar a linha de comando:

```bash
# Fazer login (primeira vez)
npx supabase login

# Linkar o projeto
npx supabase link --project-ref <seu-project-ref>

# Fazer deploy da função
npx supabase functions deploy create-user
```

**Para encontrar seu project-ref:**
- Dashboard do Supabase → Settings → General → Reference ID

---

## Opção 3: Instalar Supabase CLI Localmente (Windows)

1. **Usando Scoop (recomendado):**
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

2. **Ou baixar manualmente:**
   - Acesse: https://github.com/supabase/cli/releases
   - Baixe a versão para Windows
   - Extraia e adicione ao PATH

3. **Depois instalar:**
   ```bash
   supabase login
   supabase link --project-ref <seu-project-ref>
   supabase functions deploy create-user
   ```

---

## Verificação

Após o deploy, teste criando um usuário:
1. Acesse a página de Usuários no sistema
2. Clique em "+ Novo Usuário"
3. Preencha os dados e tente criar um usuário (Gestor, Motorista ou Administrador)
4. Verifique se foi criado com sucesso

---

## Troubleshooting

### Erro: "Function not found"
- Verifique se o nome da função está correto: `create-user`
- Verifique se o deploy foi concluído

### Erro: "Service role key not found"
- Configure o `SUPABASE_SERVICE_ROLE_KEY` nas secrets da Edge Function
- Certifique-se de usar a **service_role** key, não a anon key

### Erro: "Not authorized"
- Verifique se o usuário logado tem role "administrador" na tabela `user_roles`
- Verifique se as políticas RLS foram criadas corretamente

