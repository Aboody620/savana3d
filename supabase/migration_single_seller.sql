-- ============================================================
-- Savana3D متجر بائع واحد — شغّله في Supabase → SQL Editor
-- (آمن لو انشغّل أكثر من مرة. يتطلب الملفات السابقة كلها)
--
-- Savana3D هي البائع الوحيد: صاحب المتجر (المدير) يضيف المنتجات ويحدد
-- ألوانها وأسعارها، ويدير الطلبات. الزبون يختار اللون والجودة ويدفع.
-- ============================================================

-- 1) المدراء: جدول منفصل ما يقدر أي مستخدم يعدّله (مو عمود في profiles،
--    لأن المستخدم يقدر يعدّل ملفه الشخصي)
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;
drop policy if exists "admins_read_self" on admins;
create policy "admins_read_self" on admins for select using (user_id = auth.uid());

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;
grant execute on function is_admin() to authenticated, anon;

-- صاحب المتجر
insert into admins (user_id)
select id from auth.users where lower(email) = 'a.ali44xd@gmail.com'
on conflict do nothing;

-- 2) المنتجات: ألوان متوفرة، سعر الجودة العالية (اختياري)، وإظهار/إخفاء
alter table designs add column if not exists colors text[] not null default '{}';
alter table designs add column if not exists price_high numeric;
alter table designs add column if not exists is_active boolean not null default true;
alter table designs add column if not exists lead_time_days integer;
alter table designs drop constraint if exists designs_price_high_check;
alter table designs add constraint designs_price_high_check check (price_high is null or price_high > 0);

-- المنتجات القديمة اللي سعرها "حسب الطلب" تنخفي من المتجر
update designs set is_active = false where pricing_mode = 'quote' or coalesce(price, 0) <= 0;

-- المدير فقط يضيف ويعدّل ويحذف المنتجات
drop policy if exists "المصمم فقط يرفع تصاميمه" on designs;
drop policy if exists "المصمم يعدل أو يحذف تصاميمه فقط" on designs;
drop policy if exists "المصمم يحذف تصاميمه فقط" on designs;
drop policy if exists "designs_admin_insert" on designs;
drop policy if exists "designs_admin_update" on designs;
drop policy if exists "designs_admin_delete" on designs;
create policy "designs_admin_insert" on designs for insert with check (is_admin() and designer_id = auth.uid());
create policy "designs_admin_update" on designs for update using (is_admin()) with check (is_admin());
create policy "designs_admin_delete" on designs for delete using (is_admin());

-- 3) الطلبات: اللون والجودة المختارة
alter table orders add column if not exists color text;
alter table orders add column if not exists quality text;
alter table orders drop constraint if exists orders_quality_check;
alter table orders add constraint orders_quality_check check (quality is null or quality in ('standard', 'high'));

-- المدير يشوف كل الطلبات ويحدّث حالتها ورقم التتبع
drop policy if exists "orders_admin_select" on orders;
drop policy if exists "orders_admin_update" on orders;
create policy "orders_admin_select" on orders for select using (is_admin());
create policy "orders_admin_update" on orders for update using (is_admin() and payment_status = 'paid') with check (is_admin());

-- أصحاب الطابعات ما عاد يشوفون أو يقبلون طلبات من الموقع
drop policy if exists "الطابع يشوف الطلبات المعلّقة أو طلباته المقبولة" on orders;
drop policy if exists "الطابع يقبل طلب معلّق" on orders;
drop policy if exists "الطابع يحدّث طلبه المقبول" on orders;

-- 4) التخزين: المدير يرفع ملفات المنتجات وصورها
drop policy if exists "savana_designer_upload_own_model" on storage.objects;
drop policy if exists "savana_designer_upload_own_preview" on storage.objects;
drop policy if exists "savana_admin_upload" on storage.objects;
drop policy if exists "savana_admin_delete" on storage.objects;
create policy "savana_admin_upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('designs', 'previews') and public.is_admin());
create policy "savana_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('designs', 'previews') and public.is_admin());

-- 5) التسجيل الجديد دايم "زبون"، وما أحد يغيّر نوع حسابه بنفسه
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function prevent_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), 'service_role') <> 'service_role' then
    raise exception 'لا يمكن تغيير نوع الحساب';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists profiles_prevent_role_change on profiles;
create trigger profiles_prevent_role_change before update on profiles
  for each row execute procedure prevent_role_change();

-- 6) فحص: لازم يطلع صف واحد فيه إيميلك
select u.email as admin_email from admins a join auth.users u on u.id = a.user_id;
