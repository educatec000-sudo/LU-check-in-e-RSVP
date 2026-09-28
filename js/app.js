// Portal do Casal — telas e fluxos (Fase 1 + 2)
import { CONFIG_OK } from "./config.js";
import * as A from "./auth.js";
import { toast, show, busy } from "./ui.js";
import { openEvents } from "./fase2.js";

const $ = (s) => document.querySelector(s);

function msg(el, text, isOk) {
  const e = $(el);
  if (!text) { e.hidden = true; e.textContent = ""; return; }
  e.hidden = false;
  e.textContent = text;
  if (isOk !== undefined) e.className = isOk ? "ok" : "err";
}
function firstName(user) {
  const meta = (user && user.user_metadata) || {};
  const full = meta.display_name || meta.full_name || meta.name || "";
  if (full) return String(full).split("&")[0].split(" ")[0].trim() || "casal";
  if (user && user.email) return user.email.split("@")[0];
  return "casal";
}

// ---------- boot ----------
if (!CONFIG_OK) {
  show("view-login");
  $("#cfg-warn").hidden = false;
  ["#btn-google", "#btn-login", "#btn-signup"].forEach((s) => { $(s).disabled = true; });
} else {
  A.initAuth();
  A.onSession((session) => {
    if (session && session.user) {
      const n = firstName(session.user);
      $("#user-name").textContent = n;
      $("#user-name2").textContent = n;
      show("view-app");
    } else {
      show("view-login");
    }
  });
}

// ---------- navegação ----------
$("#go-signup").onclick = (e) => { e.preventDefault(); msg("#login-err", ""); show("view-signup"); };
$("#go-login").onclick = (e) => { e.preventDefault(); msg("#signup-err", ""); msg("#signup-ok", ""); show("view-login"); };
$("#back-dash").onclick = (e) => { e.preventDefault(); show("view-app"); };
$("#card-events").onclick = () => { openEvents(); };

// ---------- Google ----------
$("#btn-google").onclick = async () => {
  msg("#login-err", "");
  busy("#btn-google", true, "Abrindo Google…");
  try { await A.loginGoogle(); /* redireciona e volta logado */ }
  catch (e) { msg("#login-err", A.friendly(e)); busy("#btn-google", false); }
};

// ---------- entrar com senha ----------
$("#btn-login").onclick = async () => {
  const email = $("#li-email").value.trim();
  const pass = $("#li-pass").value;
  if (!email || !pass) { msg("#login-err", "Digite e-mail e senha."); return; }
  msg("#login-err", "");
  busy("#btn-login", true, "Entrando…");
  try { await A.loginEmail(email, pass); toast("Bem-vindo(a)! 💒", "ok"); }
  catch (e) { msg("#login-err", A.friendly(e)); }
  busy("#btn-login", false);
};
$("#li-pass").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#btn-login").click(); });

// ---------- criar conta ----------
$("#btn-signup").onclick = async () => {
  const name = $("#su-name").value.trim();
  const email = $("#su-email").value.trim();
  const date = $("#su-date").value;
  if (!name) { msg("#signup-err", "Diga o nome do casal. 💕"); return; }
  if (!email || email.indexOf("@") < 0) { msg("#signup-err", "Digite um e-mail válido."); return; }
  if (!date) { msg("#signup-err", "Escolha a data do casamento. 📅"); return; }
  msg("#signup-err", ""); msg("#signup-ok", "");
  busy("#btn-signup", true, "Criando…");
  try {
    const { password } = await A.signup(name, email, date);
    msg("#signup-ok", `Conta criada! 🎉 Sua senha é ${password} — anote ou troque depois.`, true);
    toast("Conta criada! Entrando… 💒", "ok");
  } catch (e) { msg("#signup-err", A.friendly(e)); }
  busy("#btn-signup", false);
};

// ---------- sair ----------
$("#btn-logout").onclick = async () => {
  await A.logout();
  show("view-login");
  toast("Até logo! 👋");
};

// ---------- trocar senha ----------
$("#btn-pass").onclick = async () => {
  const nw = $("#np-pass").value;
  const box = $("#pass-msg");
  box.hidden = false;
  busy("#btn-pass", true, "Salvando…");
  try {
    await A.changePass(nw);
    box.className = "ok"; box.textContent = "Senha trocada com sucesso! ✅";
    $("#np-pass").value = "";
  } catch (e) { box.className = "err"; box.textContent = A.friendly(e); }
  busy("#btn-pass", false);
};
