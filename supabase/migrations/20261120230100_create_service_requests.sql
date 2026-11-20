-- Service requests for the Morrowlane Service Request Tracker.
-- The columns match data/seed-requests.csv, plus an id the database assigns.
-- The CHECK rules repeat the app's validation, so bad data is refused even
-- if something other than the app writes to the table.

create table public.service_requests (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  requester_name text not null
                 check (char_length(btrim(requester_name)) between 1 and 100),
  location       text not null
                 check (location in ('Minneapolis', 'Chicago', 'Denver', 'Austin')),
  description    text not null
                 check (char_length(btrim(description)) between 1 and 500),
  priority       text not null
                 check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  status         text not null default 'New'
                 check (status in ('New', 'In Progress', 'Complete'))
);

comment on table public.service_requests is
  'Workplace service requests shown in the Morrowlane Service Request Tracker. Sample data only.';

-- The table is listed newest first.
create index service_requests_created_at_idx
  on public.service_requests (created_at desc, id desc);

-- Row-level security: nothing is allowed unless a rule below allows it.
alter table public.service_requests enable row level security;

-- Start from no access, then grant only what the app needs.
revoke all on public.service_requests from anon, authenticated;

-- The app may read every request.
grant select on public.service_requests to anon;
create policy "App can read requests"
  on public.service_requests for select to anon
  using (true);

-- The app may add a request, but only these four fields. The id, the date
-- and the starting status ("New") are always set by the database.
grant insert (requester_name, location, description, priority)
  on public.service_requests to anon;
create policy "App can add requests"
  on public.service_requests for insert to anon
  with check (true);

-- The app may change a request's status, and nothing else about it.
grant update (status) on public.service_requests to anon;
create policy "App can change a request status"
  on public.service_requests for update to anon
  using (true)
  with check (true);

-- Nobody can delete requests through the app.
