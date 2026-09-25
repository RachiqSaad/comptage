-- À exécuter une fois dans Supabase > SQL Editor.
create extension if not exists pgcrypto;
create table if not exists depots (
  id uuid primary key default gen_random_uuid(), name text not null unique, active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists agents (
  id uuid primary key default gen_random_uuid(), name text not null, access_code text not null unique,
  depot_id uuid not null references depots(id), active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists aisles (
  id uuid primary key default gen_random_uuid(), depot_id uuid not null references depots(id) on delete cascade,
  code text not null, first_number integer not null default 1, last_number integer not null default 99,
  active boolean not null default true, unique(depot_id,code), check(first_number>0 and last_number>=first_number)
);
create table if not exists locations (
  id uuid primary key default gen_random_uuid(), aisle_id uuid not null references aisles(id) on delete cascade,
  code text not null, seq integer not null, unique(aisle_id,code), unique(aisle_id,seq)
);
create table if not exists articles (
  id uuid primary key default gen_random_uuid(), depot_id uuid not null references depots(id) on delete cascade,
  ean text not null, article_code text not null, designation text not null, updated_at timestamptz not null default now(),
  unique(depot_id,ean)
);
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(), depot_id uuid not null references depots(id),
  created_by uuid references agents(id), status text not null default 'OPEN' check(status in ('OPEN','CLOSED')),
  created_at timestamptz not null default now(), closed_at timestamptz
);
create unique index if not exists one_open_exercise_per_depot on exercises(depot_id) where status='OPEN';
create table if not exists presences (
  id uuid primary key default gen_random_uuid(), exercise_id uuid not null references exercises(id) on delete cascade,
  location_id uuid not null references locations(id), agent_id uuid not null references agents(id),
  ean text not null, article_id uuid references articles(id), scanned_at timestamptz not null default now(),
  unique(exercise_id,location_id,ean)
);
create table if not exists validated_locations (
  exercise_id uuid not null references exercises(id) on delete cascade,
  location_id uuid not null references locations(id),
  agent_id uuid not null references agents(id), validated_at timestamptz not null default now(),
  primary key(exercise_id,location_id)
);
create table if not exists label_photos (
  id uuid primary key default gen_random_uuid(), presence_id uuid not null references presences(id) on delete cascade,
  url text not null, created_at timestamptz not null default now()
);
create index if not exists presence_exercise_location on presences(exercise_id,location_id);
-- Les appels depuis l'application passent par le serveur Next.js. RLS reste activé
-- pour empêcher tout accès direct anonyme au navigateur.
alter table depots enable row level security;
alter table agents enable row level security;
alter table aisles enable row level security;
alter table locations enable row level security;
alter table articles enable row level security;
alter table exercises enable row level security;
alter table presences enable row level security;
alter table validated_locations enable row level security;
alter table label_photos enable row level security;
