-- Attach deferred constraint triggers to the Phase 1 sense-parent integrity function.
--
-- The function was introduced in migration 20260715, but that migration did not
-- create triggers that execute it.

drop trigger if exists lexical_senses_parent_integrity_check
  on public.lexical_senses;

create constraint trigger lexical_senses_parent_integrity_check
after insert or update or delete
on public.lexical_senses
deferrable initially deferred
for each row
execute function public.lexicon_check_sense_parent_integrity();

drop trigger if exists lexical_reading_items_parent_integrity_check
  on public.lexical_reading_items;

create constraint trigger lexical_reading_items_parent_integrity_check
after insert or update or delete
on public.lexical_reading_items
deferrable initially deferred
for each row
execute function public.lexicon_check_sense_parent_integrity();

