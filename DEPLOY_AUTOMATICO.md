# Deploy Automático da Edge Function

## Passo 1: Login no Supabase CLI
```bash
npx supabase login
```
Isso abrirá o navegador para você fazer login.

## Passo 2: Linkar o Projeto
```bash
npx supabase link --project-ref lpweizwnuzfzwcclzwvs
```

## Passo 3: Configurar Service Role Key
```bash
# Obter a service_role key do Dashboard:
# Project Settings → API → service_role key
# Depois configurar:
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>
```

## Passo 4: Deploy da Função
```bash
npx supabase functions deploy create-user
```

## Verificação
Após o deploy, teste criando um usuário na página de Usuários do sistema!

