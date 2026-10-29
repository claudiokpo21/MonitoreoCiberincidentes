-- Monitor de Riesgo · carga manual de eventos y fuentes a monitorear
-- Ejecutar una sola vez en Supabase > SQL Editor (proyecto Inventario Clear).

-- 1) Carga manual de candidatos por analistas (entran como pendientes, firmados con el nombre del perfil)
create or replace function public.monitor_candidatos_alta()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_nombre text;
begin
  if auth.uid() is not null then
    select nombre into v_nombre from public.monitor_perfiles where user_id = auth.uid();
    new.decision := 'pendiente'; new."revisadoPor" := ''; new."revisadoEn" := null; new.comentario := '';
    new.agregado := now();
    new."sugeridoPor" := 'Manual · ' || coalesce(v_nombre, 'analista');
    new."sugerenciaIA" := jsonb_build_object('tipoEvento', new."tipoEvento", 'origen', new.origen, 'factor', new.factor,
      'canal', new.canal, 'impacto', new.impacto, 'normativa', new.normativa);
    insert into public.monitor_historial (candidato_id, user_id, nombre, antes, despues)
    values (new.id, auth.uid(), coalesce(v_nombre, ''), null,
      jsonb_build_object('alta', 'manual', 'tipoEvento', new."tipoEvento", 'origen', new.origen, 'factor', new.factor,
        'canal', new.canal, 'impacto', new.impacto, 'normativa', new.normativa, 'valorizado', new.valorizado, 'moneda', new.moneda));
  end if;
  return new;
end; $$;

drop trigger if exists monitor_candidatos_alta on public.monitor_candidatos;
create trigger monitor_candidatos_alta before insert on public.monitor_candidatos
  for each row execute function public.monitor_candidatos_alta();

drop policy if exists monitor_candidatos_cargar on public.monitor_candidatos;
create policy monitor_candidatos_cargar on public.monitor_candidatos for insert to authenticated
  with check (public.monitor_es_analista() and id like 'manual-%');
grant insert on public.monitor_candidatos to authenticated;

-- 2) Fuentes a monitorear
create table if not exists public.monitor_fuentes (
  id bigint generated always as identity primary key,
  url text not null,
  nombre text not null default '',
  notas text not null default '',
  activa boolean not null default true,
  "agregadoPor" text not null default '',
  user_id uuid default auth.uid(),
  agregado timestamptz not null default now()
);
create unique index if not exists monitor_fuentes_url_uq on public.monitor_fuentes (lower(url));
alter table public.monitor_fuentes enable row level security;

create or replace function public.monitor_fuentes_alta()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is not null then
    new.user_id := auth.uid(); new.agregado := now();
    select coalesce(nombre, '') into new."agregadoPor" from public.monitor_perfiles where user_id = auth.uid();
  end if;
  new.url := btrim(new.url);
  return new;
end; $$;
drop trigger if exists monitor_fuentes_alta on public.monitor_fuentes;
create trigger monitor_fuentes_alta before insert on public.monitor_fuentes
  for each row execute function public.monitor_fuentes_alta();

drop policy if exists monitor_fuentes_ver on public.monitor_fuentes;
create policy monitor_fuentes_ver on public.monitor_fuentes for select to authenticated using (public.monitor_es_miembro());
drop policy if exists monitor_fuentes_cargar on public.monitor_fuentes;
create policy monitor_fuentes_cargar on public.monitor_fuentes for insert to authenticated with check (public.monitor_es_analista());
drop policy if exists monitor_fuentes_editar on public.monitor_fuentes;
create policy monitor_fuentes_editar on public.monitor_fuentes for update to authenticated using (public.monitor_es_analista()) with check (public.monitor_es_analista());
drop policy if exists monitor_fuentes_borrar on public.monitor_fuentes;
create policy monitor_fuentes_borrar on public.monitor_fuentes for delete to authenticated using (public.monitor_es_analista());
grant select, insert, update, delete on public.monitor_fuentes to authenticated;
