-- 初期マスタの見直し
-- - カテゴリ・支払方法の「その他」を外す。迷う支出は未選択（NULL）のまま記録する
-- - カテゴリに「医療費」を「固定費」の前に追加する
-- - 支払方法を「PayPay」→「現金」の順にする

-- 既存の世帯：削除ではなくアーカイブにして、記録済みの支出のカテゴリ表示は残す
update public.categories
set archived_at = now()
where name = 'その他'
  and kind = 'expense'
  and archived_at is null;

update public.payment_methods
set archived_at = now()
where name = 'その他'
  and type = 'other'
  and archived_at is null;

-- 既存の世帯：「医療費」を「固定費」の位置に追加し、「固定費」を1つ後ろにずらす
-- （固定費が無い世帯は末尾に追加。同名がすでにあれば何もしない）
insert into public.categories (household_id, name, icon, sort_order)
select h.id, '医療費', 'pill',
  coalesce(
    (select c.sort_order from public.categories c
     where c.household_id = h.id and c.kind = 'expense' and c.name = '固定費'),
    (select max(c.sort_order) + 1 from public.categories c where c.household_id = h.id),
    1
  )
from public.households h
on conflict (household_id, kind, name) do nothing;

update public.categories fixed
set sort_order = medical.sort_order + 1
from public.categories medical
where fixed.household_id = medical.household_id
  and fixed.kind = 'expense' and fixed.name = '固定費'
  and medical.kind = 'expense' and medical.name = '医療費'
  and fixed.sort_order <= medical.sort_order;

-- 既存の世帯：「現金」と「PayPay」の並び順を入れ替える（現金が前にある場合だけ）
update public.payment_methods m
set sort_order = case m.name when '現金' then paypay.sort_order else cash.sort_order end
from public.payment_methods cash
join public.payment_methods paypay on paypay.household_id = cash.household_id
where cash.name = '現金' and paypay.name = 'PayPay'
  and cash.sort_order < paypay.sort_order
  and m.household_id = cash.household_id
  and m.name in ('現金', 'PayPay');

-- 今後作られるユーザーの初期マスタ（シグネチャは変えないので既存の権限はそのまま）
create or replace function private.initialize_user(
  p_user_id uuid,
  p_email text,
  p_user_meta jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
begin
  insert into public.households (name, created_by)
  values ('マイ家計簿', p_user_id)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, p_user_id, 'owner');

  insert into public.profiles (id, display_name, current_household_id)
  values (
    p_user_id,
    coalesce(p_user_meta ->> 'display_name', split_part(p_email, '@', 1)),
    new_household_id
  );

  insert into public.categories (household_id, name, icon, sort_order) values
    (new_household_id, '食費', 'utensils', 1),
    (new_household_id, '日用品', 'shopping-basket', 2),
    (new_household_id, '交通費', 'train-front', 3),
    (new_household_id, '娯楽', 'sparkles', 4),
    (new_household_id, '医療費', 'pill', 5),
    (new_household_id, '固定費', 'house', 6);

  insert into public.payment_methods (household_id, name, type, icon, sort_order) values
    (new_household_id, 'PayPay', 'qr', 'qr-code', 1),
    (new_household_id, '現金', 'cash', 'banknote', 2),
    (new_household_id, 'クレジットカード', 'credit_card', 'credit-card', 3),
    (new_household_id, '銀行振込', 'bank', 'landmark', 4);
end;
$$;
