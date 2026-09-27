-- ローカル開発用シード（supabase db reset で投入される。本番には適用されない）
-- ログイン: dev@komame.local / password123
-- auth.users への insert で handle_new_user トリガーが世帯・初期マスタを作成する。

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'dev@komame.local',
  extensions.crypt('password123', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{"display_name": "dev"}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub": "11111111-1111-1111-1111-111111111111", "email": "dev@komame.local"}',
  'email', now(), now(), now()
);

-- サンプル支出（今日・昨日・数日前）
insert into public.transactions (household_id, created_by, amount, occurred_on, category_id, payment_method_id, memo)
select
  p.current_household_id,
  p.id,
  s.amount,
  (now() at time zone 'Asia/Tokyo')::date - s.days_ago,
  (select c.id from public.categories c where c.household_id = p.current_household_id and c.name = s.category),
  (select m.id from public.payment_methods m where m.household_id = p.current_household_id and m.name = s.payment_method),
  s.memo
from public.profiles p
cross join (values
  (580, 0, '食費', 'PayPay', 'ランチ'),
  (220, 0, '交通費', '現金', null),
  (1280, 1, '日用品', 'クレジットカード', 'ドラッグストア'),
  (3500, 3, '娯楽', 'クレジットカード', '本'),
  (450, 5, null, '現金', null)
) as s (amount, days_ago, category, payment_method, memo)
where p.id = '11111111-1111-1111-1111-111111111111';
