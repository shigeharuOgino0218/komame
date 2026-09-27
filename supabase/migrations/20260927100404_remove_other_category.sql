-- 初期カテゴリから「その他」を外す。分類に迷う支出は未分類（category_id NULL）で記録する

-- 既存の世帯：削除ではなくアーカイブにして、記録済みの支出のカテゴリ表示は残す
update public.categories
set archived_at = now()
where name = 'その他'
  and kind = 'expense'
  and archived_at is null;

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
    (new_household_id, '固定費', 'house', 5);

  insert into public.payment_methods (household_id, name, type, icon, sort_order) values
    (new_household_id, '現金', 'cash', 'banknote', 1),
    (new_household_id, 'PayPay', 'qr', 'qr-code', 2),
    (new_household_id, 'クレジットカード', 'credit_card', 'credit-card', 3),
    (new_household_id, '銀行振込', 'bank', 'landmark', 4),
    (new_household_id, 'その他', 'other', 'ellipsis', 5);
end;
$$;
