-- 予算（週・月）と自由貯金
-- - budgets: 予算の変更履歴。期間の開始日ごとに1件で、amount が NULL の行は「その期間から未設定」
-- - transactions.funding: どの財布から払ったか。'savings' は自由貯金から払った支出で、予算の集計から外す
-- - savings_balance(): 終わった期間の余りの合計 − 自由貯金から払った支出の合計

-- ---------------------------------------------------------------------------
-- transactions.funding
-- ---------------------------------------------------------------------------
alter table public.transactions
  add column funding text not null default 'budget'
    check (funding in ('budget', 'savings')),
  add constraint transactions_savings_only_expense
    check (funding = 'budget' or type = 'expense');

-- ---------------------------------------------------------------------------
-- budgets
-- ---------------------------------------------------------------------------
create table public.budgets (
  household_id uuid not null references public.households (id) on delete cascade,
  period text not null check (period in ('week', 'month')),
  -- この期間から有効。週は月曜、月は1日
  effective_from date not null,
  -- NULL = この期間から未設定
  amount integer check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, period, effective_from),
  constraint budgets_effective_from_aligned check (
    (period = 'week' and extract(isodow from effective_from) = 1)
    or (period = 'month' and extract(day from effective_from) = 1)
  )
);

create trigger set_updated_at before update on public.budgets
  for each row execute function private.set_updated_at();

revoke all on public.budgets from anon, authenticated;
grant select, insert, update on public.budgets to authenticated;

alter table public.budgets enable row level security;

create policy "members can read budgets" on public.budgets
  for select to authenticated
  using (household_id in (select private.my_household_ids()));
create policy "members can insert budgets" on public.budgets
  for insert to authenticated
  with check (household_id in (select private.my_household_ids()));
create policy "members can update budgets" on public.budgets
  for update to authenticated
  using (household_id in (select private.my_household_ids()))
  with check (household_id in (select private.my_household_ids()));

-- ---------------------------------------------------------------------------
-- 自由貯金の残高
-- - 週予算がある週は週の余りを数える
-- - 月の余りは、その月に重なる週のどれにも週予算がなかったときだけ数える（二重に数えない）
-- - 進行中の期間は数えない。超過した期間はマイナスとして数える
-- security invoker なので、呼び出したユーザーの RLS の範囲でしか集計しない
-- ---------------------------------------------------------------------------
create function public.savings_balance(p_household_id uuid)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select
      date_trunc('week', today)::date as this_week,
      date_trunc('month', today)::date as this_month
    from (select (now() at time zone 'Asia/Tokyo')::date as today) t
  ),
  -- 最初の週予算から今週まで。今週も月の判定に使う
  weeks as (
    select
      w::date as week_start,
      (select b.amount from public.budgets b
       where b.household_id = p_household_id
         and b.period = 'week'
         and b.effective_from <= w::date
       order by b.effective_from desc
       limit 1) as budget
    from bounds,
      generate_series(
        (select min(b.effective_from) from public.budgets b
         where b.household_id = p_household_id and b.period = 'week')::timestamp,
        this_week::timestamp,
        interval '1 week'
      ) as w
  ),
  months as (
    select
      m::date as month_start,
      (m + interval '1 month' - interval '1 day')::date as month_end,
      (select b.amount from public.budgets b
       where b.household_id = p_household_id
         and b.period = 'month'
         and b.effective_from <= m::date
       order by b.effective_from desc
       limit 1) as budget
    from bounds,
      generate_series(
        (select min(b.effective_from) from public.budgets b
         where b.household_id = p_household_id and b.period = 'month')::timestamp,
        (this_month - interval '1 month')::timestamp,
        interval '1 month'
      ) as m
  ),
  periods as (
    select w.week_start as starts_on, w.week_start + 6 as ends_on, w.budget
    from weeks w, bounds
    where w.budget is not null and w.week_start < bounds.this_week
    union all
    select m.month_start, m.month_end, m.budget
    from months m
    where m.budget is not null
      and not exists (
        select 1 from weeks w
        where w.budget is not null
          and w.week_start <= m.month_end
          and w.week_start + 6 >= m.month_start
      )
  )
  select (
    coalesce((
      select sum(
        p.budget - coalesce((
          select sum(t.amount) from public.transactions t
          where t.household_id = p_household_id
            and t.type = 'expense'
            and t.funding = 'budget'
            and t.occurred_on between p.starts_on and p.ends_on
        ), 0)
      )
      from periods p
    ), 0)
    - coalesce((
      select sum(t.amount) from public.transactions t
      where t.household_id = p_household_id
        and t.type = 'expense'
        and t.funding = 'savings'
    ), 0)
  )::integer;
$$;

revoke all on function public.savings_balance(uuid) from public, anon;
grant execute on function public.savings_balance(uuid) to authenticated;
