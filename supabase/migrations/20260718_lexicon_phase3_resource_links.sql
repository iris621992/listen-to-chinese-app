-- Lexicon Phase 3: resource links
--
-- Connect lesson/practice vocabulary targets to precise lexicon reading items.
-- Content mappings are applied separately from this schema migration.

create table public.practice_target_lexicon_links (
  id uuid primary key default gen_random_uuid(),

  practice_target_id uuid not null
    references public.practice_targets(id)
    on delete cascade,

  lexical_reading_item_id uuid not null
    references public.lexical_reading_items(id)
    on delete cascade,

  link_role text not null default 'primary' check (
    link_role in ('primary', 'alternate', 'related')
  ),

  review_status text not null default 'provisional' check (
    review_status in (
      'imported_raw',
      'provisional',
      'needs_review',
      'reviewed',
      'rejected',
      'deprecated'
    )
  ),

  confidence_level text check (
    confidence_level is null
    or confidence_level in ('low', 'medium', 'high')
  ),

  mapping_note text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (practice_target_id, lexical_reading_item_id),

  check (
    mapping_note is null
    or btrim(mapping_note) <> ''
  )
);

-- A lesson vocabulary target may have only one primary lexicon meaning.
create unique index practice_target_lexicon_links_one_primary_idx
  on public.practice_target_lexicon_links (practice_target_id)
  where link_role = 'primary';

-- Supports reverse lookups from a lexicon reading item to lesson resources.
create index practice_target_lexicon_links_reading_item_idx
  on public.practice_target_lexicon_links (
    lexical_reading_item_id,
    practice_target_id
  );

create trigger set_practice_target_lexicon_links_updated_at
  before update on public.practice_target_lexicon_links
  for each row execute function public.set_updated_at();

-- Keep the new bridge table private until an explicit read policy is designed.
alter table public.practice_target_lexicon_links
  enable row level security;

revoke all
  on table public.practice_target_lexicon_links
  from anon, authenticated;
