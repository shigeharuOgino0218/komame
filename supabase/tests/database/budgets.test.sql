-- 予算・自由貯金の検証（supabase test db）
-- 日付はすべて「今週の月曜」「今月1日」からの相対で決め、実行日に依存させない
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- A / B は RLS 用。H1〜H4 は残高のシナリオごとの世帯
insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@test.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@test.local', 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000001', 'h1@test.local', 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000002', 'h2@test.local', 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000003', 'h3@test.local', 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-000000000004', 'h4@test.local', 'authenticated', 'authenticated');

create temp table ctx as
select
  (select current_household_id from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as a_household,
  (select current_household_id from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') as b_household,
  (select current_household_id from public.profiles where id = 'c0000000-0000-0000-0000-000000000001') as h1,
  (select current_household_id from public.profiles where id = 'c0000000-0000-0000-0000-000000000002') as h2,
  (select current_household_id from public.profiles where id = 'c0000000-0000-0000-0000-000000000003') as h3,
  (select current_household_id from public.profiles where id = 'c0000000-0000-0000-0000-000000000004') as h4,
  date_trunc('week', (now() at time zone 'Asia/Tokyo')::date)::date as this_week,
  date_trunc('month', (now() at time zone 'Asia/Tokyo')::date)::date as this_month;
grant select on ctx to authenticated, anon;

-- ---------------------------------------------------------------------------
-- 制約
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.budgets (household_id, period, effective_from, amount)
     select a_household, 'week', this_week + 1, 10000 from ctx $$,
  '23514', null, '週予算の開始日は月曜でなければならない');
select throws_ok(
  $$ insert into public.budgets (household_id, period, effective_from, amount)
     select a_household, 'month', this_month + 1, 10000 from ctx $$,
  '23514', null, '月予算の開始日は1日でなければならない');
select throws_ok(
  $$ insert into public.budgets (household_id, period, effective_from, amount)
     select a_household, 'week', this_week, 0 from ctx $$,
  '23514', null, '予算は正の金額でなければならない');
select throws_ok(
  $$ insert into public.transactions (household_id, type, amount, funding)
     select a_household, 'income', 1000, 'savings' from ctx $$,
  '23514', null, '自由貯金から払えるのは支出だけ');

-- ---------------------------------------------------------------------------
-- H1: 週予算だけ。途中で金額を変更し、貯金からも払う
--   2週前 予算 10,000 − 支出 3,000 = 7,000
--   先週   予算 20,000 − 支出 12,000 = 8,000（先週から 20,000 に変更）
--   今週は数えない。収入と貯金払いは週の支出に入れない。貯金払い 1,000 を引く
--   → 14,000
-- ---------------------------------------------------------------------------
insert into public.budgets (household_id, period, effective_from, amount)
select h1, 'week', this_week - 14, 10000 from ctx union all
select h1, 'week', this_week - 7, 20000 from ctx union all
select h1, 'week', this_week, 50000 from ctx;

insert into public.transactions (household_id, type, amount, occurred_on, funding)
select h1, 'expense', 3000, this_week - 14, 'budget' from ctx union all
select h1, 'income', 99999, this_week - 13, 'budget' from ctx union all
select h1, 'expense', 1000, this_week - 12, 'savings' from ctx union all
select h1, 'expense', 12000, this_week - 1, 'budget' from ctx union all
select h1, 'expense', 5000, this_week, 'budget' from ctx;

select is(
  (select public.savings_balance(h1) from ctx),
  14000, '週予算: 終わった週の余りを当時の予算で数え、貯金払いを引く');

-- ---------------------------------------------------------------------------
-- H2: 月予算だけ。超過した月はマイナス
--   2か月前 100,000 − 60,000 = 40,000
--   先月    100,000 − 110,000 = −10,000
--   → 30,000
-- ---------------------------------------------------------------------------
insert into public.budgets (household_id, period, effective_from, amount)
select h2, 'month', (this_month - interval '2 month')::date, 100000 from ctx;

insert into public.transactions (household_id, amount, occurred_on)
select h2, 60000, (this_month - interval '2 month')::date + 3 from ctx union all
select h2, 110000, (this_month - interval '1 month')::date + 3 from ctx union all
select h2, 5000, this_month from ctx;

select is(
  (select public.savings_balance(h2) from ctx),
  30000, '月予算: 超過した月は余りをマイナスとして数える');

-- ---------------------------------------------------------------------------
-- H3: 月予算の途中（先月の中旬）から週予算も設定
--   2か月前は月の余り 100,000。先月は週予算がある日を含むので月では数えない
--   週は週予算を設定した週から先週まで、支出なしで 10,000 ずつ
-- ---------------------------------------------------------------------------
insert into public.budgets (household_id, period, effective_from, amount)
select h3, 'month', (this_month - interval '2 month')::date, 100000 from ctx union all
select h3, 'week', date_trunc('week', (this_month - interval '1 month')::date + 10)::date, 10000 from ctx;

select is(
  (select public.savings_balance(h3) from ctx),
  (select 100000 + 10000 * ((this_week - date_trunc('week', (this_month - interval '1 month')::date + 10)::date) / 7)
   from ctx),
  '週予算がある月は月の余りを数えない（二重に数えない）');

-- ---------------------------------------------------------------------------
-- H4: 週予算を一度未設定に戻し、また設定する
--   3週前 10,000 / 2週前 未設定 / 先週 10,000 → 20,000
-- ---------------------------------------------------------------------------
insert into public.budgets (household_id, period, effective_from, amount)
select h4, 'week', this_week - 21, 10000 from ctx union all
select h4, 'week', this_week - 14, null from ctx union all
select h4, 'week', this_week - 7, 10000 from ctx;

select is(
  (select public.savings_balance(h4) from ctx),
  20000, '未設定に戻した週は数えない');

select is(
  (select public.savings_balance(a_household) from ctx),
  0, '予算がない世帯の残高は 0');

-- ---------------------------------------------------------------------------
-- ユーザー A として操作
-- ---------------------------------------------------------------------------
insert into public.budgets (household_id, period, effective_from, amount)
select b_household, 'month', (this_month - interval '1 month')::date, 50000 from ctx;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.budgets (household_id, period, effective_from, amount)
     select a_household, 'week', this_week, 10000 from ctx $$,
  'A は自分の世帯に予算を設定できる');
select lives_ok(
  $$ insert into public.budgets (household_id, period, effective_from, amount)
     select a_household, 'week', this_week, null from ctx
     on conflict (household_id, period, effective_from)
     do update set amount = excluded.amount $$,
  'A は同じ期間の予算を upsert で上書きできる');
select is(
  (select count(*)::int from public.budgets),
  1, 'A には B の予算が見えない');
select throws_ok(
  $$ insert into public.budgets (household_id, period, effective_from, amount)
     select b_household, 'week', this_week, 10000 from ctx $$,
  '42501', null, 'A は B の世帯に予算を設定できない');
select lives_ok(
  $$ insert into public.transactions (household_id, amount, funding)
     select a_household, 500, 'savings' from ctx $$,
  'A は自由貯金から払った支出を登録できる');
select is(
  (select public.savings_balance(b_household) from ctx),
  0, 'A が B の世帯の残高を求めても RLS により何も集計されない');

-- ---------------------------------------------------------------------------
-- anon
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select throws_ok(
  $$ select count(*) from public.budgets $$,
  '42501', null, 'anon は budgets を読めない');
select throws_ok(
  $$ select public.savings_balance((select b_household from ctx)) $$,
  '42501', null, 'anon は savings_balance を実行できない');

reset role;
select * from finish();
rollback;
