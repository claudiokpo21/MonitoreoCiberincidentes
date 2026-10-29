-- Monitor de Riesgo · rol administrador, registro de actividad y notificaciones
-- Ejecutar una sola vez en Supabase > SQL Editor (proyecto Inventario Clear). Solo agrega objetos "monitor_*":
-- no modifica tablas de otras aplicaciones ni borra usuarios de Authentication.

-- 1) Perfiles: rol admin, estado activo, último ingreso y preferencias de notificación
alter table public.monitor_perfiles drop constraint if exists monitor_perfiles_rol_check;
alter table public.monitor_perfiles add constraint monitor_perfiles_rol_check check (rol in ('admin', 'analista', 'lector'));
alter table public.monitor_perfiles
  add column if not exists activo boolean not null default true,
  add column if not exists ultimo_ingreso timestamptz,
  add column if not exists notif_visto timestamptz,
  add column if not exists notif_prefs jsonb not null default
    '{"nacional_alta": true, "nacional": true, "candidatos": true, "pendientes_viejos": true, "internacional_alta": false}'::jsonb;

-- 2) Funciones de rol (un perfil inactivo no ve datos; el admin también puede clasificar)
create or replace function public.monitor_es_miembro() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.monitor_perfiles p where p.user_id = auth.uid() and p.activo);
$$;
create or replace function public.monitor_es_analista() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.monitor_perfiles p where p.user_id = auth.uid() and p.activo and p.rol in ('analista', 'admin'));
$$;
create or replace function public.monitor_es_admin() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.monitor_perfiles p where p.user_id = auth.uid() and p.activo and p.rol = 'admin');
$$;

-- 3) Registro de actividad (solo lo ven los administradores; se escribe únicamente desde funciones de la base)
create table if not exists public.monitor_actividad (
  id bigint generated always as identity primary key,
  fecha timestamptz not null default now(),
  user_id uuid default auth.uid(),
  nombre text not null default '',
  accion text not null,
  objeto text not null default '',
  detalle jsonb not null default '{}'::jsonb
);
create index if not exists monitor_actividad_fecha_idx on public.monitor_actividad (fecha desc);
alter table public.monitor_actividad enable row level security;
drop policy if exists monitor_actividad_ver on public.monitor_actividad;
create policy monitor_actividad_ver on public.monitor_actividad for select to authenticated using (public.monitor_es_admin());

create or replace function public.monitor_log(p_accion text, p_objeto text, p_detalle jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path to 'public' as $$
declare v_nombre text;
begin
  select nombre into v_nombre from public.monitor_perfiles where user_id = auth.uid();
  insert into public.monitor_actividad (user_id, nombre, accion, objeto, detalle)
  values (auth.uid(), coalesce(v_nombre, case when auth.uid() is null then 'sistema' else '' end), p_accion, coalesce(p_objeto, ''), coalesce(p_detalle, '{}'::jsonb));
end; $$;
revoke all on function public.monitor_log(text, text, jsonb) from public, anon, authenticated;

-- Ingreso al sitio (se registra como máximo una vez cada 30 minutos por usuario)
create or replace function public.monitor_registrar_ingreso() returns void
language plpgsql security definer set search_path to 'public' as $$
declare v_ult timestamptz;
begin
  if not public.monitor_es_miembro() then return; end if;
  select ultimo_ingreso into v_ult from public.monitor_perfiles where user_id = auth.uid();
  update public.monitor_perfiles set ultimo_ingreso = now() where user_id = auth.uid();
  if v_ult is null or v_ult < now() - interval '30 minutes' then
    perform public.monitor_log('ingreso', '', '{}'::jsonb);
  end if;
end; $$;

-- Fuentes: alta, edición y baja quedan registradas
create or replace function public.monitor_fuentes_log() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op = 'INSERT' then perform public.monitor_log('fuente_alta', new.url, jsonb_build_object('nombre', new.nombre));
  elsif tg_op = 'UPDATE' then perform public.monitor_log('fuente_edicion', new.url, jsonb_build_object('activa', new.activa, 'nombre', new.nombre));
  else perform public.monitor_log('fuente_baja', old.url, jsonb_build_object('nombre', old.nombre)); end if;
  return null;
end; $$;
drop trigger if exists monitor_fuentes_log on public.monitor_fuentes;
create trigger monitor_fuentes_log after insert or update or delete on public.monitor_fuentes
  for each row execute function public.monitor_fuentes_log();

-- Actividad unificada para el panel: actividad general + historial de candidatos
create or replace function public.monitor_admin_actividad(p_desde timestamptz default now() - interval '30 days', p_limite int default 500)
returns table (fecha timestamptz, nombre text, accion text, objeto text, detalle jsonb)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.monitor_es_admin() then raise exception 'Se requiere rol de administrador'; end if;
  return query
  select * from (
    select a.fecha, a.nombre, a.accion, a.objeto, a.detalle from public.monitor_actividad a where a.fecha >= p_desde
    union all
    select h.fecha, h.nombre,
      case when h.antes is null then 'candidato_alta'
           when (h.despues->>'decision') is distinct from (h.antes->>'decision') then 'candidato_' || coalesce(h.despues->>'decision', 'cambio')
           else 'candidato_clasificacion' end,
      coalesce(c.titulo, h.candidato_id), jsonb_build_object('id', h.candidato_id, 'antes', h.antes, 'despues', h.despues)
    from public.monitor_historial h left join public.monitor_candidatos c on c.id = h.candidato_id
    where h.fecha >= p_desde
  ) t order by t.fecha desc limit greatest(1, least(p_limite, 2000));
end; $$;

-- 4) Administración de usuarios del monitor (no crea ni borra cuentas de Authentication)
create or replace function public.monitor_admin_usuarios()
returns table (user_id uuid, email text, nombre text, rol text, activo boolean, creado timestamptz, ultimo_ingreso timestamptz)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.monitor_es_admin() then raise exception 'Se requiere rol de administrador'; end if;
  return query select p.user_id, u.email::text, p.nombre, p.rol, p.activo, p.creado, p.ultimo_ingreso
    from public.monitor_perfiles p join auth.users u on u.id = p.user_id order by p.nombre;
end; $$;

create or replace function public.monitor_admin_guardar_usuario(p_email text, p_nombre text, p_rol text, p_activo boolean default true)
returns uuid
language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid; v_antes jsonb; v_admins int;
begin
  if not public.monitor_es_admin() then raise exception 'Se requiere rol de administrador'; end if;
  if p_rol not in ('admin', 'analista', 'lector') then raise exception 'Rol no válido: %', p_rol; end if;
  if coalesce(btrim(p_nombre), '') = '' then raise exception 'Falta el nombre'; end if;
  select id into v_uid from auth.users where lower(email) = lower(btrim(p_email));
  if v_uid is null then raise exception 'NO_EXISTE: no hay una cuenta con el correo %', p_email; end if;
  select to_jsonb(p) - 'notif_prefs' into v_antes from public.monitor_perfiles p where p.user_id = v_uid;
  -- No dejar el monitor sin administradores activos
  if v_antes is not null and v_antes->>'rol' = 'admin' and (p_rol <> 'admin' or not p_activo) then
    select count(*) into v_admins from public.monitor_perfiles where rol = 'admin' and activo and user_id <> v_uid;
    if v_admins = 0 then raise exception 'Tiene que quedar al menos un administrador activo'; end if;
  end if;
  insert into public.monitor_perfiles (user_id, nombre, rol, activo) values (v_uid, btrim(p_nombre), p_rol, p_activo)
  on conflict (user_id) do update set nombre = excluded.nombre, rol = excluded.rol, activo = excluded.activo;
  perform public.monitor_log(case when v_antes is null then 'usuario_alta' else 'usuario_edicion' end, lower(btrim(p_email)),
    jsonb_build_object('antes', v_antes, 'despues', jsonb_build_object('nombre', btrim(p_nombre), 'rol', p_rol, 'activo', p_activo)));
  return v_uid;
end; $$;

create or replace function public.monitor_admin_quitar_usuario(p_user uuid) returns void
language plpgsql security definer set search_path to 'public' as $$
declare v_antes jsonb; v_email text;
begin
  if not public.monitor_es_admin() then raise exception 'Se requiere rol de administrador'; end if;
  if p_user = auth.uid() then raise exception 'No podés quitarte el acceso a vos mismo'; end if;
  select to_jsonb(p) - 'notif_prefs' into v_antes from public.monitor_perfiles p where p.user_id = p_user;
  if v_antes is null then return; end if;
  select email into v_email from auth.users where id = p_user;
  delete from public.monitor_perfiles where user_id = p_user;
  perform public.monitor_log('usuario_baja', coalesce(v_email, p_user::text), jsonb_build_object('antes', v_antes));
end; $$;

-- 5) Notificaciones dentro del sitio
create or replace function public.monitor_mi_perfil()
returns table (nombre text, rol text, activo boolean, notif_visto timestamptz, notif_prefs jsonb, ultimo_ingreso timestamptz)
language sql stable security definer set search_path to 'public' as $$
  select p.nombre, p.rol, p.activo, p.notif_visto, p.notif_prefs, p.ultimo_ingreso from public.monitor_perfiles p where p.user_id = auth.uid();
$$;
create or replace function public.monitor_notif_vistas() returns timestamptz
language plpgsql security definer set search_path to 'public' as $$
declare v timestamptz := now();
begin
  update public.monitor_perfiles set notif_visto = v where user_id = auth.uid();
  return v;
end; $$;
create or replace function public.monitor_notif_preferencias(p_prefs jsonb) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v jsonb;
begin
  update public.monitor_perfiles
     set notif_prefs = notif_prefs || (select coalesce(jsonb_object_agg(k, to_jsonb(coalesce((p_prefs->>k)::boolean, false))), '{}'::jsonb)
                                         from jsonb_object_keys(p_prefs) k
                                        where k in ('nacional_alta', 'nacional', 'candidatos', 'pendientes_viejos', 'internacional_alta', 'email'))
   where user_id = auth.uid()
  returning notif_prefs into v;
  perform public.monitor_log('preferencias_notificacion', '', coalesce(v, '{}'::jsonb));
  return v;
end; $$;

revoke execute on function public.monitor_registrar_ingreso(), public.monitor_admin_actividad(timestamptz, int), public.monitor_admin_usuarios(),
  public.monitor_admin_guardar_usuario(text, text, text, boolean), public.monitor_admin_quitar_usuario(uuid), public.monitor_mi_perfil(),
  public.monitor_notif_vistas(), public.monitor_notif_preferencias(jsonb), public.monitor_es_admin() from public, anon;
grant execute on function public.monitor_registrar_ingreso(), public.monitor_admin_actividad(timestamptz, int), public.monitor_admin_usuarios(),
  public.monitor_admin_guardar_usuario(text, text, text, boolean), public.monitor_admin_quitar_usuario(uuid), public.monitor_mi_perfil(),
  public.monitor_notif_vistas(), public.monitor_notif_preferencias(jsonb), public.monitor_es_admin() to authenticated;

-- 6) Primer administrador
update public.monitor_perfiles set rol = 'admin'
 where user_id = (select id from auth.users where lower(email) = 'claudioalejandrohernandez@gmail.com');
