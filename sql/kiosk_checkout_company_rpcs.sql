-- Example helper RPCs for the kiosk checkout flow.
-- Review SECURITY DEFINER behavior, grants, RLS policies, and returned fields
-- before using these functions with real visitor data.

create or replace function public.kiosk_search_open_visit_companies(
  p_query text default null
)
returns table (
  company text
)
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select nullif(lower(trim(coalesce(p_query, ''))), '') as query
  )
  select distinct visitors.company
  from public.visits
  join public.visitors on visitors.id = visits.visitor_id
  cross join normalized
  where visits.status = 'open'
    and (
      normalized.query is null
      or visitors.normalized_company like '%' || normalized.query || '%'
    )
  order by visitors.company
  limit 20;
$$;

grant execute on function public.kiosk_search_open_visit_companies(text) to anon, authenticated;

create or replace function public.kiosk_list_open_visits_by_company(
  p_company text
)
returns table (
  visit_id uuid,
  display_name text,
  checkin_local text
)
language sql
security definer
set search_path = public
as $$
  select
    visits.id as visit_id,
    concat_ws(' ', visitors.first_name, visitors.last_name) as display_name,
    to_char(visits.checkin_at at time zone 'Europe/Rome', 'HH24:MI') as checkin_local
  from public.visits
  join public.visitors on visitors.id = visits.visitor_id
  where visits.status = 'open'
    and visitors.company = p_company
  order by visitors.last_name, visitors.first_name, visits.checkin_at;
$$;

grant execute on function public.kiosk_list_open_visits_by_company(text) to anon, authenticated;
