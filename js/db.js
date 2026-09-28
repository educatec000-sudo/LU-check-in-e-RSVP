// Portal do Casal — camada de dados (Supabase)
import { supa } from "./auth.js";

function sb() {
  if (!supa) throw new Error("Sem conexão. Entre de novo.");
  return supa;
}
export async function myId() {
  const { data, error } = await sb().auth.getUser();
  if (error) throw error;
  return data.user.id;
}
// ---------- eventos ----------
export async function listEvents() {
  const { data, error } = await sb().from("events").select("*")
    .order("event_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}
export async function getEvent(id) {
  const { data, error } = await sb().from("events").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
export async function saveEvent(ev) {
  if (ev.id) {
    const { id, ...rest } = ev;
    const { data, error } = await sb().from("events")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await sb().from("events").insert(ev).select().single();
  if (error) throw error;
  return data;
}
export async function deleteEvent(id) {
  const { error } = await sb().from("events").delete().eq("id", id);
  if (error) throw error;
}
// ---------- convidados ----------
export async function listGuests(eventId) {
  const { data, error } = await sb().from("guests").select("*")
    .eq("event_id", eventId).order("name");
  if (error) throw error;
  return data || [];
}
export async function guestCount(eventId, status) {
  let q = sb().from("guests").select("id", { count: "exact", head: true }).eq("event_id", eventId);
  if (status) q = q.eq("rsvp_status", status);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}
export async function addGuest(g) {
  const { data, error } = await sb().from("guests").insert(g).select().single();
  if (error) throw error;
  return data;
}
export async function addGuestsBulk(rows) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb().from("guests").insert(rows.slice(i, i + 200));
    if (error) throw error;
  }
}
export async function updateGuest(id, patch) {
  const { error } = await sb().from("guests").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteGuest(id) {
  const { error } = await sb().from("guests").delete().eq("id", id);
  if (error) throw error;
}
// ---------- imagens (logo/capa) ----------
export async function uploadMedia(eventId, kind, file) {
  const ext = ((file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg");
  const path = `${eventId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await sb().storage.from("event-media")
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;
  const { data } = sb().storage.from("event-media").getPublicUrl(path);
  return data.publicUrl;
}
