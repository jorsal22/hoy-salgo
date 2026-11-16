create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Necesitás iniciar sesión.' using errcode = '28000';
  end if;

  delete from auth.users where id = uid;
exception
  when foreign_key_violation then
    raise exception 'Tu cuenta tiene entradas compradas y no se puede borrar desde la app. Escribinos para gestionarlo.'
      using errcode = '23503';
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
