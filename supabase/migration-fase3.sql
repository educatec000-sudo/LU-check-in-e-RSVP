-- =====================================================
-- Portal do Casal 💌 — Fase 3: RSVP público (rode 1 vez no Supabase)
-- SQL Editor → New query → cole tudo → Run → Success ✅
-- Cria funções seguras: convidados confirmam SEM login,
-- só com o código do convite (a lista continua fechada).
-- =====================================================

create extension if not exists unaccent;

-- ---------- 1. dados públicos do evento (pelo código) ----------
create or replace function rsvp_get_event(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e record;
begin
  select * into e from events where upper(rsvp_code) = upper(trim(p_code));
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  if not coalesce(e.rsvp_open, true) then return jsonb_build_object('ok', false, 'error', 'closed'); end if;
  if e.rsvp_deadline is not null and e.rsvp_deadline < current_date then
    return jsonb_build_object('ok', false, 'error', 'deadline');
  end if;
  return jsonb_build_object('ok', true,
    'title', e.title, 'event_date', e.event_date, 'event_time', e.event_time,
    'location', e.location, 'rsvp_deadline', e.rsvp_deadline,
    'companion_limit', coalesce(e.companion_limit, 4),
    'logo_url', e.logo_url, 'cover_url', e.cover_url,
    'color_primary', e.color_primary, 'color_bg', e.color_bg,
    'font_style', e.font_style, 'welcome_message', e.welcome_message);
end $$;

-- ---------- 2. buscar convite pelo nome ----------
create or replace function rsvp_search(p_code text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare eid uuid; q text;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then
    return jsonb_build_object('ok', true, 'families', '[]'::jsonb);
  end if;
  select id into eid from events
   where upper(rsvp_code) = upper(trim(p_code))
     and coalesce(rsvp_open, true)
     and (rsvp_deadline is null or rsvp_deadline >= current_date);
  if eid is null then return jsonb_build_object('ok', false); end if;
  q := '%' || unaccent(lower(trim(p_name))) || '%';
  return jsonb_build_object('ok', true, 'families', coalesce((
    with fam as (
      select g.family_key as family,
        jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name,
          'is_child', g.is_child, 'status', g.rsvp_status) order by g.name) as members
      from guests g
      where g.event_id = eid and g.family_key is not null
        and g.family_key in (
          select distinct x.family_key from guests x
          where x.event_id = eid and x.family_key is not null
            and unaccent(lower(x.name)) like q)
      group by g.family_key
    ), solo as (
      select null::text as family,
        jsonb_build_array(jsonb_build_object('id', g.id, 'name', g.name,
          'is_child', g.is_child, 'status', g.rsvp_status)) as members
      from guests g
      where g.event_id = eid and g.family_key is null
        and unaccent(lower(g.name)) like q
    ), allf as (
      select * from fam union all select * from solo limit 10
    )
    select jsonb_agg(jsonb_build_object('family', family, 'members', members)) from allf
  ), '[]'::jsonb));
end $$;

-- ---------- 3. salvar confirmação ----------
create or replace function rsvp_save(p_code text, p_family text, p_people jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare eid uuid; clim int; listed int; going int; p jsonb; gid uuid;
begin
  select id, coalesce(companion_limit, 4) into eid, clim from events
   where upper(rsvp_code) = upper(trim(p_code))
     and coalesce(rsvp_open, true)
     and (rsvp_deadline is null or rsvp_deadline >= current_date);
  if eid is null then return jsonb_build_object('ok', false, 'error', 'closed'); end if;
  -- precisa vir de um convite real (ao menos 1 pessoa existente do evento)
  perform 1 from guests g where g.event_id = eid
    and g.id in (select (x->>'id')::uuid from jsonb_array_elements(p_people) x
                 where x->>'id' is not null) limit 1;
  if not found then return jsonb_build_object('ok', false, 'error', 'family'); end if;
  -- limite: confirmados <= listados + acompanhantes
  select count(*) into listed from guests g where g.event_id = eid
    and g.id in (select (x->>'id')::uuid from jsonb_array_elements(p_people) x
                 where x->>'id' is not null);
  select count(*) into going from jsonb_array_elements(p_people) x
   where coalesce((x->>'going')::boolean, false);
  if going > listed + clim then
    return jsonb_build_object('ok', false, 'error', 'limit');
  end if;
  for p in select * from jsonb_array_elements(p_people) loop
    if p->>'id' is not null then
      gid := (p->>'id')::uuid;
      update guests set
        name = coalesce(nullif(p->>'name', ''), name),
        is_child = coalesce((p->>'is_child')::boolean, is_child),
        rsvp_status = case when coalesce((p->>'going')::boolean, false)
                           then 'confirmed' else 'declined' end,
        rsvp_at = now()
      where id = gid and event_id = eid;
    elsif coalesce((p->>'going')::boolean, false) and nullif(p->>'name', '') is not null then
      insert into guests(event_id, family_key, name, is_child, rsvp_status, rsvp_at)
      values(eid, p_family, trim(p->>'name'),
             coalesce((p->>'is_child')::boolean, false), 'confirmed', now());
    end if;
  end loop;
  return jsonb_build_object('ok', true, 'confirmed', going);
end $$;

-- ---------- permissão de execução (convidados sem login) ----------
grant execute on function rsvp_get_event(text) to anon, authenticated;
grant execute on function rsvp_search(text, text) to anon, authenticated;
grant execute on function rsvp_save(text, text, jsonb) to anon, authenticated;
