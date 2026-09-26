-- TeamContext schema. Lives outside `public` so the Supabase Data API never exposes it;
-- only the server (direct Postgres connection) can read or write.
create schema if not exists teamcontext;

create table if not exists teamcontext.locks (
  lock_id      uuid primary key default gen_random_uuid(),
  developer_id text not null,
  file_path    text not null,          -- normalized, repo-relative, forward slashes
  repo         text not null,
  acquired_at  timestamptz not null,
  unique (file_path, repo)
);

create table if not exists teamcontext.activity (
  id           bigint generated always as identity primary key,
  developer_id text not null,
  repo         text not null,
  file_path    text,                   -- null for task-level entries
  event        text not null check (event in ('lock', 'unlock', 'conflict', 'release_all')),
  summary      text,                   -- optional handoff note
  created_at   timestamptz not null
);

create index if not exists activity_repo_created_idx on teamcontext.activity (repo, created_at desc);

alter table teamcontext.locks enable row level security;
alter table teamcontext.activity enable row level security;

-- Atomic acquire: expire → try insert → refresh own lock or report conflict, in one transaction.
-- UNIQUE (file_path, repo) guarantees two agents can never both get the same lock.
create or replace function teamcontext.acquire(
  p_developer   text,
  p_file        text,
  p_repo        text,
  p_ttl_minutes double precision,
  p_now         timestamptz
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_lock teamcontext.locks;
begin
  delete from teamcontext.locks
   where file_path = p_file and repo = p_repo
     and acquired_at < p_now - p_ttl_minutes * interval '1 minute';

  -- Loop: under READ COMMITTED the holder may release between our INSERT (which saw its row)
  -- and our SELECT (which then finds nothing). In that case the file is free, so try again.
  loop
    insert into teamcontext.locks (developer_id, file_path, repo, acquired_at)
    values (p_developer, p_file, p_repo, p_now)
    on conflict (file_path, repo) do nothing
    returning * into v_lock;

    if found then
      insert into teamcontext.activity (developer_id, repo, file_path, event, created_at)
      values (p_developer, p_repo, p_file, 'lock', p_now);
      return jsonb_build_object('status', 'granted', 'lock', to_jsonb(v_lock));
    end if;

    select * into v_lock from teamcontext.locks
     where file_path = p_file and repo = p_repo
     for update;

    exit when found;
  end loop;

  if v_lock.developer_id = p_developer then
    update teamcontext.locks set acquired_at = p_now
     where lock_id = v_lock.lock_id
    returning * into v_lock;
    return jsonb_build_object('status', 'granted', 'lock', to_jsonb(v_lock));
  end if;

  insert into teamcontext.activity (developer_id, repo, file_path, event, summary, created_at)
  values (p_developer, p_repo, p_file, 'conflict', 'blocked by ' || v_lock.developer_id, p_now);
  return jsonb_build_object('status', 'conflict', 'lock', to_jsonb(v_lock));
end;
$$;
