# 💒 Portal do Casal — Lu Cerimonialista

Sistema maior: o casal cria a conta, monta a lista, recebe confirmações (RSVP)
e envia tudo pronto para o app da portaria.

## 📍 Fases

- [x] **Fase 1 — Base**: servidor + login (Google e e-mail/senha = data do casamento)
- [x] **Fase 2 — Portal**: meus eventos + lista + personalizar site (logo, cores, letras)
- [ ] **Fase 3 — RSVP**: página do convidado (nome de cada pessoa, adulto/criança)
- [ ] **Fase 4 — Ponte**: puxar lista no app da portaria (+ código manual)
- [ ] **Fase 5 — Impressão**: pulseiras e encartes personalizados
- [ ] **Fase 6 — Refino**: testes e ajustes

## 📁 Estrutura

| Arquivo | O quê |
|---|---|
| `index.html` | Telas: login, criar conta, painel |
| `css/portal.css` | Visual (mobile-first) |
| `js/config.js` | ⚠️ Cole aqui URL + chave do Supabase |
| `js/auth.js` | Login Google / e-mail / criar conta / trocar senha |
| `js/app.js` | Navegação e painel |
| `supabase/schema.sql` | Banco completo (rode 1 vez) |
| `COMO-CRIAR-O-SERVIDOR.md` | 📘 Passo a passo: Supabase + Google + Vercel |
| `vercel.json` | Config da Vercel |

## 🚀 Começar

1. Siga o **`COMO-CRIAR-O-SERVIDOR.md`** (criar servidor, colar chaves, publicar)
2. Teste criar conta e entrar
3. Avise para eu construir a **Fase 2** 💍

## 🛠️ Técnica

- Site estático (HTML+CSS+JS puros, sem build) + Supabase (Auth + Postgres + Storage)
- Senha inicial do casal = data do casamento (DDMMAAAA), trocável
- Cada casal só enxerga os próprios dados (Row Level Security)
