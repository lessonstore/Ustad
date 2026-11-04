CREATE OR REPLACE FUNCTION public.unlock_lesson(_lesson_id text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
declare w public.wallets;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if _lesson_id !~ '^(10|[1-9])-[a-z]+(-[a-z]+)*-([1-9]|1[0-2])$' then raise exception 'Invalid lesson'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  w := public.refresh_wallet(auth.uid());
  if exists (select 1 from public.unlocks where user_id = auth.uid() and lesson_id = _lesson_id) then return w.tokens; end if;
  if w.tokens < 10 then raise exception 'Not enough tokens'; end if;
  update public.wallets set tokens = tokens - 10, updated_at = now() where user_id = auth.uid();
  insert into public.unlocks(user_id, lesson_id) values (auth.uid(), _lesson_id);
  return w.tokens - 10;
end $function$;
REVOKE ALL ON FUNCTION public.unlock_lesson(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlock_lesson(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_lesson(text) TO service_role;