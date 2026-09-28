# 🖥️ Como criar o servidor (passo a passo, 1 vez só)

> Tudo grátis. Você vai: criar o banco de dados → ligar o login Google →
> colar 2 chaves no portal → publicar. Siga na ordem! ✨

---

## A. Criar o banco (Supabase)

1. Abra **https://supabase.com** → **Start your project** (entre com GitHub ou Google)
2. Clique em **New project**
3. Preencha:
   - **Name**: `portal-casal`
   - **Database Password**: crie uma senha forte e **anote** (só o Supabase usa)
   - **Region**: `South America (São Paulo)`
4. Clique em **Create new project** → aguarde ~2 minutos ☕

## B. Criar as tabelas (colar 1 arquivo)

1. No menu esquerdo, abra **SQL Editor** → **New query**
2. Abra o arquivo **`supabase/schema.sql`** (desta pasta), **copie tudo**
3. Cole no editor → clique em **Run** (ou Ctrl+Enter)
4. Tem que aparecer **Success** ✅ (sem erro vermelho)

## C. Login com e-mail (desligar confirmação)

1. Menu **Authentication** → **Providers** (ou *Sign In / Up*) → **Email**
2. Desligue a opção **Confirm email** → **Save**
3. Assim o casal entra direto, sem clicar em link de e-mail ✅

## D. Login com Google (parte 1: Google)

1. Abra **https://console.cloud.google.com** → entre com seu Gmail
2. Crie um projeto: **Select a project** → **New Project** → nome `Portal Casal` → **Create**
3. Menu ☰ → **APIs & Services** → **OAuth consent screen**:
   - **User Type**: External → **Create**
   - **App name**: `Portal do Casal`
   - **User support email** e **Developer contact**: seu e-mail → **Save and Continue**
   - Scopes e resto: pode pular (**Save and Continue** até o fim)
   - No final, clique em **Publish App** → **Confirm** (login básico não exige verificação)
4. Menu ☰ → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**:
   - **Application type**: Web application
   - **Name**: `Portal Casal Web`
   - Em **Authorized redirect URIs**, clique **Add URI** e cole:
     - `https://SEU-PROJETO.supabase.co/auth/v1/callback`
     - ⚠️ Troque `SEU-PROJETO` pela referência do seu projeto (está em *Project Settings → General → Reference ID*, ou no início da URL do painel)
5. Clique em **Create** → **copie o Client ID e o Client Secret** (anote!)

## E. Login com Google (parte 2: ligar no Supabase)

1. No Supabase: **Authentication** → **Providers** → **Google** → **Enable**
2. Cole o **Client ID** e o **Client Secret** (do passo D) → **Save** ✅

## F. Colar as 2 chaves no portal

1. No Supabase: **Project Settings** (⚙️) → **API**
2. Copie: **Project URL** (`https://....supabase.co`) e a chave **anon / public**
3. Abra o arquivo **`js/config.js`** e cole nos 2 lugares:
   ```js
   export const SUPABASE_URL = "https://seu-projeto.supabase.co";
   export const SUPABASE_ANON_KEY = "eyJhbGciOi... (chave longa)";
   ```
4. Salve. O aviso amarelo ⚠️ some do portal.

## G. Publicar na Vercel

1. Suba esta pasta **`portal-casal`** no GitHub (igual você já fez com o app)
2. Na Vercel: **Add New… → Project → Import** → **Deploy**
3. Copie o link final (ex: `https://portal-casal.vercel.app`)

## H. Autorizar o link do site (volta do Google)

1. No Supabase: **Authentication** → **URL Configuration**
2. Em **Site URL**, cole o link da Vercel → **Save**
3. Em **Redirect URLs**, clique **Add URL** e adicione:
   - o link da Vercel (ex: `https://portal-casal.vercel.app`)
   - `http://localhost:8000` (para testes locais, opcional)

✅ **Pronto!** Teste: abra o site → **Criar conta** → entre com e-mail/senha
(a senha será a data do casamento) ou com Google.

---

## ❓ Problemas comuns

| Erro | O que fazer |
|---|---|
| Aviso amarelo "Servidor não configurado" | Faltou o passo F (colar as chaves no `config.js`) |
| "Email not confirmed" | Volte ao passo C (desligar *Confirm email*) |
| Google dá erro de redirect | Confira o passo D.5 (URI de callback) e o passo H |
| Google dá **erro 403** (access_denied) | App em modo teste: **Publish App** (passo D.3) ou adicione seu e-mail em *OAuth consent screen → Test users* |
| "Invalid login credentials" | E-mail ou senha errados — senha inicial = data DDMMAAAA |
| SQL deu erro vermelho | Rode de novo do zero; o script pode repetir sem quebrar |

---

*Fase 1 💒 — próximas: eventos, personalização e RSVP.*
