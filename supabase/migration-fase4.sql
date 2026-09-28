-- =====================================================
-- Portal do Casal 📷 — Fase 4: ponte da assessoria (rode 1 vez)
-- SQL Editor → New query → cole tudo → Run → Success ✅
-- Libera a leitura da lista via CÓDIGO de 6 letras (sem login),
-- usada pelo app da portaria. Recusados (não vão) não descem.
-- =====================================================

create or replace function org_pull(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e record;
begin
  select * into e from events where upper(org_code) = upper(trim(p_code));
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true,
    'event', jsonb_build_object(
      'title', e.title, 'event_date', e.event_date, 'event_time', e.event_time,
      'location', e.location,
      'theme', jsonb_build_object(
        'logo_url', e.logo_url, 'cover_url', e.cover_url,
        'color_primary', e.color_primary, 'color_bg', e.color_bg,
        'font_style', e.font_style)),
    'guests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'name', g.name, 'is_child', g.is_child, 'phone', g.phone,
        'family_key', g.family_key, 'rsvp_status', g.rsvp_status,
        'table_no', g.table_no) order by g.name)
      from guests g
      where g.event_id = e.id and g.rsvp_status <> 'declined'
    ), '[]'::jsonb));
end $$;

grant execute on function org_pull(text) to anon, authenticated;
