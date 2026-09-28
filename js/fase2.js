// Portal do Casal — Fase 2: eventos, lista, personalização
import * as DB from "./db.js";
import { toast, show, openModal, closeModal, esc, fmtDateBR, busy } from "./ui.js";

let EVENTS = [], CUR = null, GUESTS = [], TAB = "lista", EDIT_ID = null;

const THEMES = {
  classico: { label: "🌟 Dourado clássico", color_primary: "#b8435c", color_bg: "#fdf8f4", font_style: "classica" },
  rose: { label: "🌸 Rosé romântico", color_primary: "#c2607a", color_bg: "#fdf2f4", font_style: "romantica" },
  oliva: { label: "🫒 Verde oliva", color_primary: "#75854c", color_bg: "#f7f8f0", font_style: "moderna" },
  marinho: { label: "🌊 Azul marinho", color_primary: "#2c4a6f", color_bg: "#f2f5f9", font_style: "classica" },
};
const FONTS = {
  classica: "Georgia,'Times New Roman',serif",
  romantica: "'Segoe Script','Brush Script MT','Snell Roundhand',cursive",
  moderna: "-apple-system,'Segoe UI',Roboto,Arial,sans-serif",
};
const FONT_LABEL = {
  classica: "Clássica (elegante)",
  romantica: "Romântica (manuscrita)",
  moderna: "Moderna (limpa)",
};
function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ================= EVENTOS =================
export async function openEvents() {
  show("view-events");
  await loadEvents();
}
async function loadEvents() {
  const box = document.getElementById("events-list");
  box.innerHTML = '<div class="hint">Carregando…</div>';
  try {
    EVENTS = await DB.listEvents();
    if (!EVENTS.length) {
      box.innerHTML = `<div class="card empty"><div class="big">💒</div><b>Nenhum evento ainda</b><p>Crie seu casamento para começar.</p><button class="btn btn-pri" onclick="P2.dlgEvent()">＋ Criar evento</button></div>`;
      return;
    }
    const cards = await Promise.all(EVENTS.map(async (e) => {
      let total = 0, conf = 0;
      try { total = await DB.guestCount(e.id); conf = await DB.guestCount(e.id, "confirmed"); } catch (_) {}
      return `<div class="card evcard" onclick="P2.openEvent('${e.id}')">
        <b>${esc(e.title)}</b>
        <small>📅 ${fmtDateBR(e.event_date)}${e.event_time ? " • " + esc(e.event_time) : ""}${e.location ? " • 📍 " + esc(e.location) : ""}</small>
        <div class="chips"><span class="chip">${total} pessoa(s)</span><span class="chip ok">${conf} confirmado(s)</span></div>
      </div>`;
    }));
    box.innerHTML = cards.join("");
  } catch (e) { box.innerHTML = `<div class="err">${esc(e.message || e)}</div>`; }
}
function dlgEvent(id) {
  const e = id ? (EVENTS.find((x) => x.id === id) || CUR) : null;
  openModal(`<div class="modal-h"><h3>${e ? "Editar evento" : "Novo evento"} 💒</h3><button class="x" onclick="closeModal()">✕</button></div>
  <div class="modal-b">
    <label class="field">Nome do casal / título *<input id="f-title" value="${esc(e?.title || "")}" placeholder="Ana & João"></label>
    <div class="f2">
      <label class="field">Data *<input id="f-date" type="date" value="${esc(e?.event_date || "")}"></label>
      <label class="field">Hora<input id="f-time" type="time" value="${esc(e?.event_time || "")}"></label>
    </div>
    <label class="field">Local<input id="f-loc" value="${esc(e?.location || "")}" placeholder="Espaço, cidade…"></label>
    <div class="f2">
      <label class="field">Limite RSVP<input id="f-deadline" type="date" value="${esc(e?.rsvp_deadline || "")}"></label>
      <label class="field">Acomp./convite<input id="f-limit" type="number" min="0" max="20" value="${e?.companion_limit ?? 4}"></label>
    </div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-pri" id="btn-save-ev" onclick="P2.saveEvent('${id || ""}')">Salvar</button></div>`);
}
async function saveEvent(id) {
  const title = document.getElementById("f-title").value.trim();
  const date = document.getElementById("f-date").value;
  if (!title) { toast("Dê um título (nome do casal)", "bad"); return; }
  if (!date) { toast("Escolha a data 📅", "bad"); return; }
  busy("#btn-save-ev", true, "Salvando…");
  try {
    const payload = {
      title, event_date: date || null,
      event_time: document.getElementById("f-time").value || null,
      location: document.getElementById("f-loc").value.trim() || null,
      rsvp_deadline: document.getElementById("f-deadline").value || null,
      companion_limit: parseInt(document.getElementById("f-limit").value || "4", 10),
    };
    if (id) await DB.saveEvent({ id, ...payload });
    else { const uid = await DB.myId(); await DB.saveEvent({ owner_id: uid, ...payload }); }
    closeModal();
    toast(id ? "Evento atualizado ✅" : "Evento criado! 🎉", "ok");
    if (CUR && !document.getElementById("view-event").hidden) await openEvent(CUR.id);
    else await loadEvents();
  } catch (e) { toast(e.message || e, "bad"); }
  busy("#btn-save-ev", false);
}
function delEvent(id) {
  const e = EVENTS.find((x) => x.id === id) || CUR;
  openModal(`<div class="modal-h"><h3>Excluir evento</h3><button class="x" onclick="closeModal()">✕</button></div>
  <div class="modal-b"><p>Excluir <b>${esc(e?.title || "")}</b> e todos os convidados? Essa ação não pode ser desfeita.</p></div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-bad" id="btn-del-ev" onclick="P2.delEventGo('${id}')">Excluir</button></div>`);
}
async function delEventGo(id) {
  busy("#btn-del-ev", true, "Excluindo…");
  try {
    await DB.deleteEvent(id);
    closeModal(); toast("Evento excluído"); CUR = null;
    await openEvents();
  } catch (e) { toast(e.message || e, "bad"); busy("#btn-del-ev", false); }
}

// ================= DETALHE + ABAS =================
export async function openEvent(id) {
  show("view-event");
  TAB = "lista"; EDIT_ID = null;
  document.getElementById("ev-body").innerHTML = '<div class="hint">Carregando…</div>';
  try {
    CUR = await DB.getEvent(id);
    if (!EVENTS.some((e) => e.id === id)) EVENTS.push(CUR);
    GUESTS = await DB.listGuests(id);
    renderEventHead(); renderTabs(); renderTab();
  } catch (e) {
    document.getElementById("ev-body").innerHTML = `<div class="err">${esc(e.message || e)}</div>`;
  }
}
function renderEventHead() {
  document.getElementById("ev-head").innerHTML = `
    <h2>${esc(CUR.title)}</h2>
    <div class="meta">📅 ${fmtDateBR(CUR.event_date)}${CUR.event_time ? " • " + esc(CUR.event_time) : ""}${CUR.location ? " • 📍 " + esc(CUR.location) : ""}</div>
    <div class="rowbtns"><button class="btn btn-sm" onclick="P2.openEvents()">← Eventos</button><button class="btn btn-sm" onclick="P2.dlgEvent('${CUR.id}')">✏️ Editar</button><button class="btn btn-sm btn-bad" onclick="P2.delEvent('${CUR.id}')">🗑</button></div>`;
}
function renderTabs() {
  const t = [["lista", "📋 Lista"], ["tema", "🎨 Personalizar"], ["painel", "📊 Painel"]];
  document.getElementById("ev-tabs").innerHTML =
    t.map(([k, l]) => `<button class="${TAB === k ? "on" : ""}" onclick="P2.setTab('${k}')">${l}</button>`).join("");
}
function setTab(k) { TAB = k; EDIT_ID = null; renderTabs(); renderTab(); }
function renderTab() {
  if (TAB === "lista") renderLista();
  else if (TAB === "tema") renderTema();
  else renderPainel();
}

// ================= ABA LISTA =================
function renderLista() {
  const fams = [...new Set(GUESTS.map((g) => g.family_key).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  document.getElementById("ev-body").innerHTML = `
  <div class="card">
    <h3>${EDIT_ID ? "✏️ Editar pessoa" : "＋ Adicionar pessoa"}</h3>
    <label class="field">Nome *<input id="g-name" placeholder="Nome completo"></label>
    <div class="f2">
      <label class="field">Família / convite<input id="g-family" list="g-fams" placeholder="Ex: Família Silva"><datalist id="g-fams">${fams.map((f) => `<option value="${esc(f)}">`).join("")}</datalist></label>
      <label class="field">Telefone<input id="g-phone" placeholder="(91) 99999-9999"></label>
    </div>
    <label class="chk"><input type="checkbox" id="g-child"> 👶 É criança</label>
    <div class="rowbtns" style="margin-top:10px"><button class="btn btn-pri" id="btn-save-g" onclick="P2.saveGuest()">${EDIT_ID ? "Salvar" : "Adicionar"}</button>${EDIT_ID ? '<button class="btn" onclick="P2.cancelEdit()">Cancelar</button>' : ""}</div>
  </div>
  <div class="card">
    <h3>📥 Importar planilha (CSV)</h3>
    <p class="muted">Arquivo com colunas <b>nome</b>, família, telefone, criança. Aceita ponto e vírgula ou vírgula.</p>
    <input type="file" id="csv-file" accept=".csv,.txt" hidden>
    <button class="btn btn-block" onclick="document.getElementById('csv-file').click()">📂 Escolher arquivo CSV</button>
  </div>
  <div class="card">
    <div class="listhead"><h3>👥 Pessoas (<span id="g-count">${GUESTS.length}</span>)</h3><input id="g-search" placeholder="🔎 Buscar…" oninput="P2.renderGuestRows()"></div>
    <div id="guest-rows"></div>
  </div>`;
  document.getElementById("csv-file").addEventListener("change", importCSV);
  renderGuestRows();
}
function rsvpChip(s) {
  return s === "confirmed" ? '<span class="chip ok">✅ vai</span>'
    : s === "declined" ? '<span class="chip bad">❌ não vai</span>'
    : '<span class="chip">⏳ pendente</span>';
}
function renderGuestRows() {
  const box = document.getElementById("guest-rows");
  if (!box) return;
  const q = norm((document.getElementById("g-search") || { value: "" }).value.trim());
  const rows = GUESTS.filter((g) => !q || norm(g.name).includes(q) || norm(g.family_key).includes(q) || norm(g.phone).includes(q));
  const cc = document.getElementById("g-count");
  if (cc) cc.textContent = GUESTS.length;
  if (!rows.length) { box.innerHTML = '<div class="hint">Ninguém por aqui. Adicione acima ou importe o CSV.</div>'; return; }
  box.innerHTML = rows.map((g) => `<div class="grow">
    <div class="gmain"><b>${esc(g.name)}</b>
      <div class="chips">${g.is_child ? "<span class=\"chip\">👶 criança</span>" : ""}${g.family_key ? `<span class="chip">👪 ${esc(g.family_key)}</span>` : ""}${g.phone ? `<span class="chip">📞 ${esc(g.phone)}</span>` : ""}${rsvpChip(g.rsvp_status)}</div>
    </div>
    <div class="rowbtns"><button class="mini" onclick="P2.editGuest('${g.id}')">✏️</button><button class="mini danger" onclick="P2.delGuest('${g.id}')">🗑</button></div>
  </div>`).join("");
}
async function saveGuest() {
  const name = document.getElementById("g-name").value.trim();
  if (!name) { toast("Digite o nome", "bad"); return; }
  const data = {
    event_id: CUR.id, name,
    family_key: document.getElementById("g-family").value.trim() || null,
    phone: document.getElementById("g-phone").value.trim() || null,
    is_child: document.getElementById("g-child").checked,
  };
  busy("#btn-save-g", true, "Salvando…");
  try {
    if (EDIT_ID) await DB.updateGuest(EDIT_ID, data);
    else await DB.addGuest(data);
    EDIT_ID = null;
    GUESTS = await DB.listGuests(CUR.id);
    renderLista();
    toast("Salvo! ✅", "ok");
  } catch (e) { toast(e.message || e, "bad"); }
  busy("#btn-save-g", false);
}
function editGuest(id) {
  const g = GUESTS.find((x) => x.id === id);
  if (!g) return;
  EDIT_ID = id;
  renderLista();
  document.getElementById("g-name").value = g.name || "";
  document.getElementById("g-family").value = g.family_key || "";
  document.getElementById("g-phone").value = g.phone || "";
  document.getElementById("g-child").checked = !!g.is_child;
  window.scrollTo(0, 0);
}
function cancelEdit() { EDIT_ID = null; renderLista(); }
async function delGuest(id) {
  const g = GUESTS.find((x) => x.id === id);
  if (!confirm(`Remover ${g?.name || "esta pessoa"}?`)) return;
  try {
    await DB.deleteGuest(id);
    GUESTS = GUESTS.filter((x) => x.id !== id);
    renderGuestRows();
    toast("Removido");
  } catch (e) { toast(e.message || e, "bad"); }
}
// ---------- CSV ----------
function readFileEnc(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const buf = r.result;
        try { res(new TextDecoder("utf-8", { fatal: true }).decode(buf)); }
        catch (_) { res(new TextDecoder("windows-1252").decode(buf)); }
      } catch (e) { rej(e); }
    };
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
}
function parseCSV(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (!lines.length) return [];
  const first = lines[0];
  const semi = (first.match(/;/g) || []).length, comma = (first.match(/,/g) || []).length;
  const d = semi >= comma ? ";" : ",";
  return lines.map((l) => {
    const out = []; let cur = "", q = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (q) {
        if (c === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += c;
      } else {
        if (c === '"') q = true;
        else if (c === d) { out.push(cur.trim()); cur = ""; }
        else cur += c;
      }
    }
    out.push(cur.trim());
    return out;
  });
}
function autoMap(head) {
  const map = { name: 0, family: -1, phone: -1, child: -1 };
  head.forEach((h, i) => {
    const n = norm(h);
    if (/nome|name|convidado/.test(n)) map.name = i;
    else if (/familia|family|grupo/.test(n)) map.family = i;
    else if (/telefone|phone|fone|celular|whatsapp|tel\b/.test(n)) map.phone = i;
    else if (/crianca|child|infantil|kid/.test(n)) map.child = i;
  });
  const headerLike = head.some((h) => /nome|name|familia|family|telefone|phone|crianca|convidado/.test(norm(h)));
  return { map, headerLike };
}
function isChildVal(v) {
  return /^(sim|s|yes|y|1|true|verdade|crianca|kid|x)$/i.test(String(v || "").trim());
}
async function importCSV(ev) {
  const f = ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  let text = "";
  try { text = await readFileEnc(f); } catch (_) { toast("Não consegui ler o arquivo", "bad"); return; }
  const rows = parseCSV(text);
  if (!rows.length) { toast("Arquivo vazio", "bad"); return; }
  const { map, headerLike } = autoMap(rows[0]);
  const data = headerLike ? rows.slice(1) : rows;
  const people = data.map((r) => ({
    name: (r[map.name] || "").trim(),
    family: map.family >= 0 ? (r[map.family] || "").trim() : "",
    phone: map.phone >= 0 ? (r[map.phone] || "").trim() : "",
    child: map.child >= 0 ? isChildVal(r[map.child]) : false,
  })).filter((p) => p.name);
  if (!people.length) { toast("Nenhum nome encontrado no arquivo", "bad"); return; }
  window._csvImport = people;
  openModal(`<div class="modal-h"><h3>📥 Importar (${people.length})</h3><button class="x" onclick="closeModal()">✕</button></div>
  <div class="modal-b"><p class="muted">Prévia das primeiras linhas:</p>
  <div class="prev">${people.slice(0, 6).map((p) => `<div class="grow"><div class="gmain"><b>${esc(p.name)}</b><div class="chips">${p.child ? '<span class="chip">👶</span>' : ""}${p.family ? `<span class="chip">${esc(p.family)}</span>` : ""}</div></div></div>`).join("")}${people.length > 6 ? `<div class="hint">…e mais ${people.length - 6}</div>` : ""}</div></div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn btn-pri" id="btn-csv-go" onclick="P2.importCSVGo()">Importar tudo</button></div>`);
}
async function importCSVGo() {
  const people = window._csvImport || [];
  if (!people.length) return;
  busy("#btn-csv-go", true, "Importando…");
  try {
    await DB.addGuestsBulk(people.map((p) => ({
      event_id: CUR.id, name: p.name,
      family_key: p.family || null, phone: p.phone || null, is_child: p.child,
    })));
    closeModal();
    GUESTS = await DB.listGuests(CUR.id);
    renderLista();
    toast(`✅ ${people.length} pessoa(s) importada(s)!`, "ok");
  } catch (e) { toast(e.message || e, "bad"); busy("#btn-csv-go", false); }
}

// ================= ABA PERSONALIZAR =================
function hexOk(v, fb) {
  return /^#[0-9a-f]{6}$/i.test(v || "") ? v : fb;
}
function renderTema() {
  const t = CUR;
  document.getElementById("ev-body").innerHTML = `
  <div class="card">
    <h3>🎨 Personalizar site</h3>
    <label class="field">Tema pronto
      <div class="presets">${Object.entries(THEMES).map(([k, v]) => `<button class="mini preset" onclick="P2.applyPreset('${k}')"><i style="background:${v.color_primary}"></i>${v.label}</button>`).join("")}</div>
    </label>
    <div class="f2">
      <label class="field">Cor principal<input type="color" id="t-primary" value="${hexOk(t.color_primary, "#b8435c")}" oninput="P2.previewTema()"></label>
      <label class="field">Cor de fundo<input type="color" id="t-bg" value="${hexOk(t.color_bg, "#fdf8f4")}" oninput="P2.previewTema()"></label>
    </div>
    <label class="field">Estilo das letras<select id="t-font" onchange="P2.previewTema()">${Object.entries(FONT_LABEL).map(([k, l]) => `<option value="${k}" ${t.font_style === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <div class="f2">
      <label class="field">Logo / monograma<input type="file" id="t-logo" accept="image/*"><small class="muted">${t.logo_url ? "✅ enviada (escolha outra para trocar)" : "PNG ou JPG"}</small></label>
      <label class="field">Foto de capa<input type="file" id="t-cover" accept="image/*"><small class="muted">${t.cover_url ? "✅ enviada (escolha outra para trocar)" : "PNG ou JPG"}</small></label>
    </div>
    <label class="field">Mensagem de boas-vindas<textarea id="t-msg" rows="2" placeholder="Ex: Confirmem presença até…" oninput="P2.previewTema()">${esc(t.welcome_message || "")}</textarea></label>
    <button class="btn btn-pri btn-block" id="btn-save-tema" onclick="P2.saveTema()">💾 Salvar personalização</button>
  </div>
  <div class="card"><h3>👀 Prévia do site</h3><div id="tema-preview"></div>
  <p class="hint">É assim que o convidado verá a página de confirmação (Fase 3).</p></div>`;
  previewTema();
}
function themeVals() {
  return {
    primary: document.getElementById("t-primary").value,
    bg: document.getElementById("t-bg").value,
    font: document.getElementById("t-font").value,
    msg: document.getElementById("t-msg").value,
  };
}
function previewTema() {
  const v = themeVals();
  const box = document.getElementById("tema-preview");
  if (!box) return;
  box.innerHTML = `
  <div class="pv" style="background:${v.bg}">
    ${CUR.cover_url ? `<div class="pv-cover" style="background-image:url('${CUR.cover_url}')"></div>` : `<div class="pv-cover none">📷 capa</div>`}
    ${CUR.logo_url ? `<img class="pv-logo" src="${CUR.logo_url}" alt="logo">` : `<div class="pv-logo none">💒</div>`}
    <div class="pv-title" style="font-family:${FONTS[v.font]};color:${v.primary}">${esc(CUR.title)}</div>
    <div class="pv-meta">📅 ${fmtDateBR(CUR.event_date)}${CUR.location ? " • 📍 " + esc(CUR.location) : ""}</div>
    ${v.msg ? `<div class="pv-msg">${esc(v.msg)}</div>` : ""}
    <div class="pv-btn" style="background:${v.primary}">Confirmar presença</div>
  </div>`;
}
function applyPreset(k) {
  const p = THEMES[k];
  if (!p) return;
  document.getElementById("t-primary").value = p.color_primary;
  document.getElementById("t-bg").value = p.color_bg;
  document.getElementById("t-font").value = p.font_style;
  previewTema();
  toast("Tema aplicado — toque em Salvar 💾");
}
async function saveTema() {
  busy("#btn-save-tema", true, "Salvando…");
  try {
    const v = themeVals();
    const patch = { color_primary: v.primary, color_bg: v.bg, font_style: v.font, welcome_message: v.msg || null };
    const logo = document.getElementById("t-logo").files[0];
    const cover = document.getElementById("t-cover").files[0];
    if (logo) { busy("#btn-save-tema", true, "Enviando logo…"); patch.logo_url = await DB.uploadMedia(CUR.id, "logo", logo); }
    if (cover) { busy("#btn-save-tema", true, "Enviando capa…"); patch.cover_url = await DB.uploadMedia(CUR.id, "cover", cover); }
    CUR = await DB.saveEvent({ id: CUR.id, ...patch });
    const i = EVENTS.findIndex((e) => e.id === CUR.id);
    if (i >= 0) EVENTS[i] = CUR;
    renderTema();
    toast("Site personalizado! 🎨", "ok");
  } catch (e) { toast("Erro: " + (e.message || e), "bad"); }
  busy("#btn-save-tema", false);
}

// ================= ABA PAINEL =================
function renderPainel() {
  const total = GUESTS.length;
  const conf = GUESTS.filter((g) => g.rsvp_status === "confirmed").length;
  const decl = GUESTS.filter((g) => g.rsvp_status === "declined").length;
  const kids = GUESTS.filter((g) => g.is_child).length;
  const fams = new Set(GUESTS.map((g) => g.family_key || ("~" + g.name))).size;
  document.getElementById("ev-body").innerHTML = `
  <div class="stats">
    <div class="card stat"><b>${total}</b><small>pessoas</small></div>
    <div class="card stat"><b>${fams}</b><small>famílias/convites</small></div>
    <div class="card stat"><b>${kids}</b><small>crianças 👶</small></div>
    <div class="card stat"><b style="color:var(--ok)">${conf}</b><small>confirmados</small></div>
    <div class="card stat"><b style="color:var(--warn)">${total - conf - decl}</b><small>pendentes</small></div>
    <div class="card stat"><b style="color:var(--bad)">${decl}</b><small>recusaram</small></div>
  </div>
  <div class="card"><h3>💌 Convites (Fase 3)</h3>
    <p class="muted">O link de confirmação aparece aqui na próxima fase. Por enquanto, monte a lista na aba 📋 Lista.</p>
    <p class="hint">📅 Data limite do RSVP: <b>${CUR.rsvp_deadline ? fmtDateBR(CUR.rsvp_deadline) : "não definida (em ✏️ Editar)"}</b></p>
  </div>`;
}

// ---------- ações globais (onclick) ----------
window.P2 = {
  openEvents, openEvent, dlgEvent, saveEvent, delEvent, delEventGo,
  setTab, saveGuest, editGuest, delGuest, cancelEdit, renderGuestRows,
  importCSVGo, applyPreset, previewTema, saveTema,
};
