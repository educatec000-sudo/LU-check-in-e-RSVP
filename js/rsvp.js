// RSVP público — convidado confirma SEM login (funções seguras do banco)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY, CONFIG_OK } from "./config.js";
import { toast, esc, fmtDateBR, busy } from "./ui.js";

const supa = CONFIG_OK ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const code = (new URLSearchParams(location.search).get("c") || "").trim();
const root = document.getElementById("rsvp-root");
let EV = null, FAMS = [], FAM = null, PEOPLE = [], QUERY = "";

const FONTS = {
  classica: "Georgia,'Times New Roman',serif",
  romantica: "'Segoe Script','Brush Script MT','Snell Roundhand',cursive",
  moderna: "-apple-system,'Segoe UI',Roboto,Arial,sans-serif",
};

function heroHTML() {
  return `<div class="pv" style="background:${esc(EV.color_bg || "#fdf8f4")}">
    ${EV.cover_url ? `<div class="pv-cover" style="background-image:url('${EV.cover_url}')"></div>` : `<div class="pv-cover none">💒</div>`}
    ${EV.logo_url ? `<img class="pv-logo" src="${EV.logo_url}" alt="logo">` : `<div class="pv-logo none">💒</div>`}
    <div class="pv-title" style="font-family:${FONTS[EV.font_style] || FONTS.classica};color:${esc(EV.color_primary || "#b8435c")}">${esc(EV.title)}</div>
    <div class="pv-meta">📅 ${fmtDateBR(EV.event_date)}${EV.event_time ? " • " + esc(EV.event_time) : ""}${EV.location ? " • 📍 " + esc(EV.location) : ""}</div>
    ${EV.welcome_message ? `<div class="pv-msg">${esc(EV.welcome_message)}</div>` : ""}
    ${EV.rsvp_deadline ? `<div class="pv-meta">⏳ Confirme até <b>${fmtDateBR(EV.rsvp_deadline)}</b></div><div style="height:12px"></div>` : `<div style="height:12px"></div>`}
  </div>`;
}
function closedHTML(title, sub) {
  return `<div class="card"><div class="success-big">💌</div><h2 class="center">${title}</h2><p class="muted center">${sub}</p></div>`;
}
async function boot() {
  if (!CONFIG_OK) { root.innerHTML = closedHTML("Convite indisponível", "Servidor não configurado."); return; }
  if (!code) { root.innerHTML = closedHTML("Link inválido", "Confira o link com o casal. 💕"); return; }
  try {
    const { data, error } = await supa.rpc("rsvp_get_event", { p_code: code });
    if (error) throw error;
    if (!data || !data.ok) {
      const msgs = {
        not_found: ["Convite não encontrado", "Confira o link com o casal. 💕"],
        closed: ["Confirmações pausadas", "O casal pausou as confirmações por enquanto."],
        deadline: ["Confirmações encerradas", "O prazo para confirmar terminou. Fale com o casal! 💕"],
      };
      const m = msgs[data?.error] || msgs.not_found;
      root.innerHTML = closedHTML(m[0], m[1]);
      return;
    }
    EV = data;
    if (EV.color_bg) document.body.style.background = EV.color_bg;
    stepSearch();
  } catch (e) { root.innerHTML = closedHTML("Ops…", esc(e.message || e)); }
}
// ---------- passo 1: achar convite ----------
function stepSearch() {
  root.innerHTML = `${heroHTML()}
  <div class="card">
    <div class="stepdot"><i class="on"></i><i></i><i></i></div>
    <h3>🔎 Ache seu convite</h3>
    <p class="muted">Digite seu nome (ou sobrenome) como está na lista do casal.</p>
    <label class="field">Seu nome<input id="rs-name" placeholder="Ex: Silva" value="${esc(QUERY)}" autocomplete="name"></label>
    <button class="btn btn-pri btn-block" id="btn-rs-search">Buscar convite</button>
    <div id="rs-results" style="margin-top:10px"></div>
  </div>`;
  document.getElementById("btn-rs-search").onclick = doSearch;
  document.getElementById("rs-name").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
}
async function doSearch() {
  const q = document.getElementById("rs-name").value.trim();
  if (q.length < 2) { toast("Digite ao menos 2 letras", "bad"); return; }
  QUERY = q;
  busy("#btn-rs-search", true, "Buscando…");
  try {
    const { data, error } = await supa.rpc("rsvp_search", { p_code: code, p_name: q });
    if (error) throw error;
    FAMS = (data && data.families) || [];
    renderResults();
  } catch (e) { toast(e.message || e, "bad"); }
  busy("#btn-rs-search", false);
}
function famTitle(f) {
  if (f.family) return `👪 ${f.family}`;
  const m = f.members[0];
  return `🧍 ${m ? m.name : "Convite individual"}`;
}
function renderResults() {
  const box = document.getElementById("rs-results");
  if (!FAMS.length) { box.innerHTML = '<div class="hint">Não achei ninguém com esse nome. Confira a escrita ou fale com o casal. 💕</div>'; return; }
  box.innerHTML = FAMS.map((f, i) => `<div class="famcard"><b>${esc(famTitle(f))}</b>
    <div class="muted">${f.members.map((m) => esc(m.name) + (m.is_child ? " 👶" : "")).join(" • ")}</div>
    <div style="margin-top:8px"><button class="btn btn-sm btn-pri" onclick="RSVP.pick(${i})">Sou dessa família →</button></div></div>`).join("");
}
// ---------- passo 2: quem vai ----------
function pick(i) {
  FAM = FAMS[i];
  PEOPLE = FAM.members.map((m) => ({ id: m.id, name: m.name, is_child: !!m.is_child, going: m.status !== "declined" }));
  stepConfirm();
  window.scrollTo(0, 0);
}
function maxGoing() { return FAM.members.length + (EV.companion_limit || 0); }
function goingCount() { return PEOPLE.filter((p) => p.going).length; }
function stepConfirm() {
  root.innerHTML = `${heroHTML()}
  <div class="card">
    <div class="stepdot"><i class="on"></i><i class="on"></i><i></i></div>
    <h3>${esc(famTitle(FAM))}</h3>
    <p class="muted">Marque quem <b>vai</b> — escreva o nome de <b>todos</b>, adultos e crianças. 👶</p>
    <p class="vagas">✅ <span id="rs-going">${goingCount()}</span> vão • 🎟️ até ${maxGoing()} por convite</p>
    <div id="rs-people"></div>
    <div class="addrow" style="margin-top:10px"><input type="text" id="rs-newname" placeholder="＋ Nome de quem vai junto…"><button class="btn" id="btn-rs-add">＋</button></div>
    <label class="chk" style="margin-top:8px"><input type="checkbox" id="rs-newchild"> 👶 É criança</label>
    <button class="btn btn-pri btn-block" id="btn-rs-save" style="margin-top:10px">Confirmar presença 🎉</button>
    <p class="center" style="margin-top:10px"><a href="#" id="rs-back">← trocar de família</a></p>
  </div>`;
  renderPeople();
  document.getElementById("btn-rs-add").onclick = addPerson;
  document.getElementById("rs-newname").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addPerson(); } });
  document.getElementById("btn-rs-save").onclick = saveRsvp;
  document.getElementById("rs-back").onclick = (e) => { e.preventDefault(); stepSearch(); };
}
function renderPeople() {
  const box = document.getElementById("rs-people");
  box.innerHTML = PEOPLE.map((p, i) => `<div class="prow">
    <div class="pmain"><b>${esc(p.name)} ${p.is_child ? "👶" : ""}</b></div>
    <div class="tog"><button class="${p.going ? "on-vai" : ""}" onclick="RSVP.tog(${i},true)">✅ Vou</button><button class="${!p.going ? "on-nao" : ""}" onclick="RSVP.tog(${i},false)">❌ Não</button></div>
    ${!p.id ? `<button class="mini danger" onclick="RSVP.delNew(${i})">✕</button>` : ""}
  </div>`).join("");
  const g = document.getElementById("rs-going");
  if (g) g.textContent = goingCount();
}
function tog(i, v) {
  if (v && !PEOPLE[i].going && goingCount() >= maxGoing()) { toast(`Limite do convite: ${maxGoing()} pessoa(s). Fale com o casal 💕`, "bad"); return; }
  PEOPLE[i].going = v;
  renderPeople();
}
function addPerson() {
  const inp = document.getElementById("rs-newname");
  const name = inp.value.trim();
  if (!name) { toast("Digite o nome da pessoa", "bad"); return; }
  if (goingCount() >= maxGoing()) { toast(`Limite do convite: ${maxGoing()} pessoa(s). Fale com o casal 💕`, "bad"); return; }
  PEOPLE.push({ id: null, name, is_child: document.getElementById("rs-newchild").checked, going: true });
  inp.value = "";
  document.getElementById("rs-newchild").checked = false;
  renderPeople();
  inp.focus();
}
function delNew(i) { PEOPLE.splice(i, 1); renderPeople(); }
async function saveRsvp() {
  busy("#btn-rs-save", true, "Confirmando…");
  try {
    let fam = FAM.family;
    if (!fam) fam = "Família " + ((PEOPLE[0]?.name || "convidado").split(" ")[0]);
    const { data, error } = await supa.rpc("rsvp_save", {
      p_code: code, p_family: fam,
      p_people: PEOPLE.map((p) => ({ id: p.id, name: p.name, is_child: p.is_child, going: p.going })),
    });
    if (error) throw error;
    if (!data || !data.ok) {
      const m = { closed: "Confirmações encerradas.", limit: "Limite do convite atingido. Fale com o casal 💕", family: "Convite não encontrado. Busque de novo." };
      toast(m[data?.error] || "Não foi possível salvar.", "bad");
      busy("#btn-rs-save", false);
      return;
    }
    stepDone();
  } catch (e) { toast(e.message || e, "bad"); busy("#btn-rs-save", false); }
}
// ---------- passo 3: pronto ----------
function stepDone() {
  const going = PEOPLE.filter((p) => p.going);
  root.innerHTML = `${heroHTML()}
  <div class="card">
    <div class="stepdot"><i class="on"></i><i class="on"></i><i class="on"></i></div>
    <div class="success-big">${going.length ? "🎉" : "💌"}</div>
    <h2 class="center">${going.length ? "Presença confirmada!" : "Resposta registrada"}</h2>
    ${going.length ? `<p class="muted center">Quem vai:</p><p class="center"><b>${going.map((p) => esc(p.name)).join(" • ")}</b></p>` : `<p class="muted center">Sentiremos sua falta! 💕</p>`}
    <p class="hint">Precisou mudar? Abra o link de novo e altere até <b>${EV.rsvp_deadline ? fmtDateBR(EV.rsvp_deadline) : "a data do casamento"}</b>.</p>
    <button class="btn btn-block" id="btn-rs-edit">Alterar resposta</button>
  </div>`;
  window.scrollTo(0, 0);
  document.getElementById("btn-rs-edit").onclick = () => stepConfirm();
}
window.RSVP = { pick, tog, delNew };
boot();
