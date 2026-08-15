-- Strengthen Phase 1 lexical sense parent integrity.
--
-- This follow-up migration is required because the original Phase 1 migration
-- was already applied to staging. It ensures a sub-sense can only point to a
-- parent reading item whose item_type is also 'sense'.

create or replace function public.lexicon_check_sense_parent_integrity()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.lexical_senses s
    join public.lexical_reading_items i
      on i.id = s.reading_item_id
    where s.is_subsense is distinct from (i.parent_item_id is not null)
  ) then
    raise exception
      'A lexical sense is a subsense exactly when its reading item has a parent';
  end if;

  if exists (
    select 1
    from public.lexical_senses s
    join public.lexical_reading_items i
      on i.id = s.reading_item_id
    join public.lexical_reading_items parent_i
      on parent_i.id = i.parent_item_id
    where parent_i.item_type <> 'sense'
  ) then
    raise exception
      'A lexical subsense parent must be a lexical sense reading item';
  end if;

  return null;
end;
$$;

revoke all on function public.lexicon_check_sense_parent_integrity()
  from public, anon, authenticated;