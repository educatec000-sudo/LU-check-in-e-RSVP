// Portal do Casal — helpers de UI (toast, modal, telas, texto)
export function toast(t, cls) {
  const r = document.getElementById("toast-root");
  const d = document.createElement("div");
  d.className = "toast " + (cls || "");
  d.textContent = t;
  r.appendChild(d);
  setTimeout(() => d.remove(), 3200);
}
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const VIEWS = ["view-login", "view-signup", "view-app", "view-events", "view-event"];
export function show(id) {
  VIEWS.forEach((v) => { document.getElementById(v).hidden = v !== id; });
  window.scrollTo(0, 0);
}
export function openModal(html) {
  document.getElementById("modal-root").innerHTML =
    `<div class="modal-bg" onclick="if(event.target===this)document.getElementById('modal-root').innerHTML=''"><div class="modal">${html}</div></div>`;
}
export function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}
window.closeModal = closeModal;
export function fmtDateBR(iso) {
  if (!iso) return "—";
  const p = String(iso).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}
export function busy(btn, on, label) {
  const b = document.querySelector(btn);
  if (!b) return;
  if (on) { b.dataset.label = b.innerHTML; b.disabled = true; b.innerHTML = label || "Aguarde…"; }
  else { b.disabled = false; if (b.dataset.label) b.innerHTML = b.dataset.label; }
}
