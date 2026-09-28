// Portal do Casal — autenticação (Supabase)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY, CONFIG_OK } from "./config.js";

export let supa = null;
export function initAuth() {
  if (!CONFIG_OK) return null;
  if (!supa) supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supa;
}

// "2026-12-20" -> "20122026" (DDMMAAAA)
export function dateToPass(iso) {
  const p = String(iso || "").split("-");
  if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return "";
  return p[2] + p[1] + p[0];
}

export async function loginGoogle() {
  const { error } = await supa.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: location.href.split("#")[0] },
  });
  if (error) throw error;
}

export async function loginEmail(email, pass) {
  const { data, error } = await supa.auth.signInWithPassword({ email, password: pass });
  if (error) throw error;
  return data;
}

export async function signup(name, email, isoDate) {
  const password = dateToPass(isoDate);
  if (!password) throw new Error("Escolha a data do casamento.");
  const { data, error } = await supa.auth.signUp({
    email,
    password,
    options: { data: { display_name: name, wedding_date: isoDate } },
  });
  if (error) throw error;
  return { data, password };
}

export async function logout() {
  await supa.auth.signOut();
}

export async function changePass(nw) {
  if (!nw || nw.length < 6) throw new Error("A senha precisa de ao menos 6 caracteres.");
  const { error } = await supa.auth.updateUser({ password: nw });
  if (error) throw error;
}

export function onSession(cb) {
  return supa.auth.onAuthStateChange((_event, session) => cb(session));
}

// Traduz erros comuns para português claro
export function friendly(e) {
  const m = String((e && e.message) || e || "");
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos. A senha inicial é a data do casamento (DDMMAAAA).";
  if (/already registered|already exists/i.test(m)) return "Este e-mail já tem conta — toque em Entrar. 🙂";
  if (/email not confirmed/i.test(m)) return "Confirme seu e-mail OU desligue a confirmação no servidor (passo C do guia).";
  if (/password should be/i.test(m)) return "Senha muito curta — use ao menos 6 caracteres.";
  if (/failed to fetch|network/i.test(m)) return "Sem conexão com o servidor. Confira a internet e as chaves em config.js.";
  return m || "Algo não saiu como esperado. Tente de novo.";
}
