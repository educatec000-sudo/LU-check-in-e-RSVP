# 📘 Como mandar o portal para o Git/GitHub (passo a passo)

> Suba a pasta **`portal-casal`** para o GitHub e ligue na Vercel.
> Depois disso, cada atualização aparece no site sozinha. ✨

---

## 🅰️ OPÇÃO A — Pelo site (mais fácil, sem instalar nada)

### 1. Criar o repositório
1. Abra **https://github.com** → entre na sua conta
2. Clique no **＋** (canto superior direito) → **New repository**
3. **Repository name**: `portal-casal`
4. Deixe **Public** marcado
5. Marque ✅ **Add a README file**
6. Clique em **Create repository**

### 2. Subir os arquivos
1. Dentro do repositório, clique em **Add file** → **Upload files**
2. Arraste **todo o conteúdo** da pasta `portal-casal`:
   - `index.html`, `vercel.json`, `README.md`, `.gitignore`
   - as pastas `css/`, `js/`, `supabase/` (com tudo dentro)
   - os guias `COMO-CRIAR-O-SERVIDOR.md` e este arquivo
3. Clique em **Commit changes** (botão verde)

✅ Pronto! O portal está no GitHub.

### 3. Atualizar depois (quando mudar algo)
1. Abra o arquivo no GitHub → ✏️ **Edit** (ou **Add file → Upload** para substituir)
2. Faça a alteração → **Commit changes**
3. A Vercel atualiza o site sozinha em ~1 minuto 🚀

---

## 🅱️ OPÇÃO B — Com git no computador

```bash
# 1. Entre na pasta do portal
cd portal-casal

# 2. Primeira vez: inicie e suba tudo
git init
git add .
git commit -m "Portal do Casal - Fase 1"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/portal-casal.git
git push -u origin main
```

> Troque `SEU-USUARIO` pelo seu nome de usuário do GitHub.
> (Crie o repositório vazio no site antes, como no passo 1 da Opção A.)

### Atualizar depois

```bash
git add .
git commit -m "Atualização"
git push
```

---

## 🔗 Ligar na Vercel (1 vez só)

1. **https://vercel.com** → **Add New…** → **Project**
2. Em *Import Git Repository*, escolha **`portal-casal`** → **Import**
3. Não mude nada → **Deploy**
4. Copie o link final e faça o **passo H** do guia `COMO-CRIAR-O-SERVIDOR.md`
   (autorizar o link no Supabase — sem isso o login Google não volta pro site)

**A partir daí:** todo `push`/upload no GitHub atualiza o site sozinho. 🎉

---

## ❓ Dúvidas comuns

| Dúvida | Resposta |
|---|---|
| A chave do `config.js` vai pro GitHub? | Sim, e está certo: a chave **anon é pública por desenho**. A segurança está nas regras do banco (RLS). |
| E a senha do banco / Client Secret? | Essas **NUNCA** vão pro Git — ficam só no Supabase/Google. |
| Repositório Public ou Private? | Tanto faz — a Vercel publica dos dois. |
| Preciso pagar? | Não — GitHub, Vercel e Supabase têm plano grátis que basta. |
| Errei um arquivo, e agora? | Suba de novo por cima (Opção A) ou novo `push` (Opção B). |

---

*Portal do Casal 💒 — Lu Cerimonialista*
