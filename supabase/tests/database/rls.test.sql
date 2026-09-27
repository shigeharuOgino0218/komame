-- RLS・制約・初期化トリガーの検証（supabase test db）
begin;
create extension if not exists pgtap with schema extensions;

select plan(18);

-- テストユーザー A / B（トリガーで世帯と初期マスタが作られる）
insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@test.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@test.local', 'authenticated', 'authenticated');

create temp table ctx as
select
  (select current_household_id from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as a_household,
  (select current_household_id from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') as b_household,
  (select c.id from public.categories c join public.profiles p on p.current_household_id = c.household_id
   where p.id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' limit 1) as b_category;
grant select on ctx to authenticated, anon;

-- B の支出を1件用意
insert into public.transactions (id, household_id, created_by, amount)
select 'bbbbbbbb-0000-0000-0000-000000000001', b_household, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1000 from ctx;

-- ---------------------------------------------------------------------------
-- 初期化トリガー
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from public.household_members
   where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and role = 'owner'),
  1, 'サインアップで owner として世帯が1つ作られる');
select is(
  (select count(*)::int from public.categories, ctx where household_id = a_household),
  6, '初期カテゴリが6件作られる');
select is(
  (select count(*)::int from public.payment_methods, ctx where household_id = a_household),
  4, '初期支払方法が4件作られる');
select results_eq(
  $$ select name from public.categories, ctx where household_id = a_household order by sort_order $$,
  $$ values ('食費'), ('日用品'), ('交通費'), ('娯楽'), ('医療費'), ('固定費') $$,
  '初期カテゴリの名前と並び順');
select results_eq(
  $$ select name from public.payment_methods, ctx where household_id = a_household order by sort_order $$,
  $$ values ('PayPay'), ('現金'), ('クレジットカード'), ('銀行振込') $$,
  '初期支払方法の名前と並び順');

-- ---------------------------------------------------------------------------
-- ユーザー A として操作
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "role": "authenticated"}', true);

select is(
  (select count(*)::int from public.transactions),
  0, 'A には B の支出が見えない');
select is(
  (select count(*)::int from public.categories),
  6, 'A には自分の世帯のカテゴリだけが見える');
select is(
  (select count(*)::int from public.households),
  1, 'A には自分の世帯だけが見える');

select lives_ok(
  $$ insert into public.transactions (household_id, amount)
     select a_household, 580 from ctx $$,
  'A は自分の世帯に支出を登録できる（created_by は auth.uid() が既定値）');

select lives_ok(
  $$ insert into public.transactions (household_id, amount)
     select a_household, 300 from ctx $$,
  'external_id が NULL の手入力は何件でも登録できる');

select throws_ok(
  $$ insert into public.transactions (household_id, amount)
     select b_household, 100 from ctx $$,
  '42501', null, 'A は B の世帯に支出を登録できない');

select throws_ok(
  $$ insert into public.transactions (household_id, created_by, amount)
     select a_household, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 100 from ctx $$,
  '42501', null, 'created_by を他人に偽装できない');

select throws_ok(
  $$ insert into public.transactions (household_id, amount, category_id)
     select a_household, 100, b_category from ctx $$,
  '23503', null, '他世帯のカテゴリは複合FKで参照できない');

select throws_ok(
  $$ insert into public.transactions (household_id, amount, source, external_id)
     select a_household, 100, 'paypay', 'acct1:tx1' from ctx
     union all
     select a_household, 100, 'paypay', 'acct1:tx1' from ctx $$,
  '23505', null, '同じ (household, source, external_id) は重複登録できない');

update public.transactions set amount = 1
where id = 'bbbbbbbb-0000-0000-0000-000000000001';
delete from public.transactions
where id = 'bbbbbbbb-0000-0000-0000-000000000001';

select throws_ok(
  $$ update public.profiles set current_household_id = (select b_household from ctx)
     where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  '42501', null, '所属していない世帯を current_household_id に設定できない');

-- ---------------------------------------------------------------------------
-- anon
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select throws_ok(
  $$ select count(*) from public.transactions $$,
  '42501', null, 'anon は transactions を読めない');

-- ---------------------------------------------------------------------------
-- 管理者として B のデータが無傷か確認
-- ---------------------------------------------------------------------------
reset role;

select is(
  (select amount from public.transactions where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  1000, 'A は B の支出を更新できない');
select is(
  (select count(*)::int from public.transactions where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  1, 'A は B の支出を削除できない');

select * from finish();
rollback;
