-- komame: 初期スキーマ
-- データの所有単位は household（世帯）。MVPではサインアップ時に自分専用の世帯を自動作成する。

-- ---------------------------------------------------------------------------
-- private スキーマ（Data API には公開しない。RLS ヘルパーとトリガー関数を置く）
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- households / household_members / profiles
-- ---------------------------------------------------------------------------
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_id_idx on public.household_members (user_id);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 50),
  current_household_id uuid references public.households (id) on delete set null,
  timezone text not null default 'Asia/Tokyo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- マスタ：categories / payment_methods
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  icon text,
  color text,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- transactions からの複合FK用（他世帯のカテゴリを参照させない）
  unique (id, household_id),
  unique (household_id, kind, name)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  type text not null default 'other'
    check (type in ('cash', 'qr', 'credit_card', 'debit_card', 'bank', 'e_money', 'other')),
  -- 将来「自分のカード / 相手のカード」を区別する。NULL = 世帯共有
  owner_user_id uuid references auth.users (id) on delete set null,
  icon text,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id),
  unique (household_id, name)
);

-- ---------------------------------------------------------------------------
-- transactions（手入力と外部連携の明細を同じテーブルで扱う）
-- ---------------------------------------------------------------------------
create table public.transactions (
  -- クライアント生成UUIDを許可（オフライン再送・二重送信を upsert(id) で冪等にする）
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  -- transfer = カード代金引落など、集計から除外する資金移動
  type text not null default 'expense' check (type in ('expense', 'income', 'transfer')),
  amount integer not null check (amount > 0),
  currency text not null default 'JPY' check (currency ~ '^[A-Z]{3}$'),
  -- JST のローカル日付
  occurred_on date not null default (now() at time zone 'Asia/Tokyo')::date,
  occurred_at timestamptz,
  -- NULL = 未分類
  category_id uuid,
  payment_method_id uuid,
  memo text check (char_length(memo) <= 200),
  merchant text check (char_length(merchant) <= 200),
  source text not null default 'manual'
    check (source in ('manual', 'bank', 'credit_card', 'paypay', 'other')),
  external_id text check (char_length(external_id) <= 255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, household_id)
    references public.categories (id, household_id) on delete set null (category_id),
  foreign key (payment_method_id, household_id)
    references public.payment_methods (id, household_id) on delete set null (payment_method_id),
  -- 外部明細の重複登録防止。NULL 同士は重複扱いされないため手入力行は対象外。
  -- 部分インデックスではなく制約にして upsert の onConflict で使えるようにする。
  constraint transactions_external_unique unique (household_id, source, external_id)
);
create index transactions_household_occurred_idx
  on public.transactions (household_id, occurred_on desc, created_at desc);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_payment_method_id_idx on public.transactions (payment_method_id);

-- ---------------------------------------------------------------------------
-- updated_at トリガー
-- ---------------------------------------------------------------------------
create trigger set_updated_at before update on public.households
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.categories
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.payment_methods
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.transactions
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS ヘルパー
-- ---------------------------------------------------------------------------
create function private.my_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id
  from public.household_members
  where user_id = (select auth.uid());
$$;

create function private.my_owned_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id
  from public.household_members
  where user_id = (select auth.uid()) and role = 'owner';
$$;

revoke all on function private.my_household_ids() from public, anon;
revoke all on function private.my_owned_household_ids() from public, anon;
grant execute on function private.my_household_ids() to authenticated;
grant execute on function private.my_owned_household_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- 権限：anon には何も与えない。authenticated には必要な操作だけ与える。
-- ---------------------------------------------------------------------------
revoke all on public.households, public.household_members, public.profiles,
  public.categories, public.payment_methods, public.transactions
  from anon, authenticated;

grant select, update (name) on public.households to authenticated;
grant select on public.household_members to authenticated;
grant select, update (display_name, current_household_id, timezone) on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.payment_methods to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;

-- ---------------------------------------------------------------------------
-- RLS ポリシー
-- ---------------------------------------------------------------------------
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.transactions enable row level security;

-- households
create policy "members can read their households" on public.households
  for select to authenticated
  using (id in (select private.my_household_ids()));
create policy "owners can update their households" on public.households
  for update to authenticated
  using (id in (select private.my_owned_household_ids()))
  with check (id in (select private.my_owned_household_ids()));

-- household_members
create policy "members can read memberships of their households" on public.household_members
  for select to authenticated
  using (household_id in (select private.my_household_ids()));

-- profiles
create policy "users can read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));
create policy "users can update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (current_household_id is null
      or current_household_id in (select private.my_household_ids()))
  );

-- categories
create policy "members can read categories" on public.categories
  for select to authenticated
  using (household_id in (select private.my_household_ids()));
create policy "members can insert categories" on public.categories
  for insert to authenticated
  with check (household_id in (select private.my_household_ids()));
create policy "members can update categories" on public.categories
  for update to authenticated
  using (household_id in (select private.my_household_ids()))
  with check (household_id in (select private.my_household_ids()));
create policy "members can delete categories" on public.categories
  for delete to authenticated
  using (household_id in (select private.my_household_ids()));

-- payment_methods
create policy "members can read payment methods" on public.payment_methods
  for select to authenticated
  using (household_id in (select private.my_household_ids()));
create policy "members can insert payment methods" on public.payment_methods
  for insert to authenticated
  with check (household_id in (select private.my_household_ids()));
create policy "members can update payment methods" on public.payment_methods
  for update to authenticated
  using (household_id in (select private.my_household_ids()))
  with check (household_id in (select private.my_household_ids()));
create policy "members can delete payment methods" on public.payment_methods
  for delete to authenticated
  using (household_id in (select private.my_household_ids()));

-- transactions
create policy "members can read transactions" on public.transactions
  for select to authenticated
  using (household_id in (select private.my_household_ids()));
create policy "members can insert own transactions" on public.transactions
  for insert to authenticated
  with check (
    household_id in (select private.my_household_ids())
    and created_by = (select auth.uid())
  );
create policy "members can update transactions" on public.transactions
  for update to authenticated
  using (household_id in (select private.my_household_ids()))
  with check (household_id in (select private.my_household_ids()));
create policy "members can delete transactions" on public.transactions
  for delete to authenticated
  using (household_id in (select private.my_household_ids()));

-- ---------------------------------------------------------------------------
-- サインアップ時の初期化：世帯・メンバー・プロフィール・初期マスタ
-- ---------------------------------------------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
begin
  insert into public.households (name, created_by)
  values ('マイ家計簿', new.id)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  insert into public.profiles (id, display_name, current_household_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new_household_id
  );

  insert into public.categories (household_id, name, icon, sort_order) values
    (new_household_id, '食費', 'utensils', 1),
    (new_household_id, '日用品', 'shopping-basket', 2),
    (new_household_id, '交通費', 'train-front', 3),
    (new_household_id, '趣味', 'sparkles', 4),
    (new_household_id, '固定費', 'house', 5),
    (new_household_id, 'その他', 'ellipsis', 6);

  insert into public.payment_methods (household_id, name, type, icon, sort_order) values
    (new_household_id, '現金', 'cash', 'banknote', 1),
    (new_household_id, 'PayPay', 'qr', 'qr-code', 2),
    (new_household_id, 'クレジットカード', 'credit_card', 'credit-card', 3),
    (new_household_id, '銀行振込', 'bank', 'landmark', 4),
    (new_household_id, 'その他', 'other', 'ellipsis', 5);

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
