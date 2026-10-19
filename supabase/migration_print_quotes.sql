-- ============================================================
-- نظام عروض الطباعة + معرض صور التصاميم — شغّله في Supabase → SQL Editor
-- (آمن لو انشغّل أكثر من مرة. يتطلب migration_server_checkout.sql قبله)
--
-- المسار: الزبون يطلب سعر (request_print_quote) → صاحب طابعة يقيّم الملف
-- ويرسل سعر المنتج والشحن (offer_print_quote) → الزبون يوافق من
-- /api/accept-quote فينشأ طلب بانتظار الدفع مربوط بنفس الطابع → يدفع.
-- ============================================================

-- 1) التصاميم: طريقة التسعير ومعرض الصور
alter table designs add column if not exists pricing_mode text not null default 'fixed';
alter table designs drop constraint if exists designs_pricing_mode_check;
alter table designs add constraint designs_pricing_mode_check check (pricing_mode in ('fixed', 'quote'));
alter table designs add column if not exists preview_image_urls text[] not null default '{}';

-- 2) جدول طلبات التسعير
create table if not exists print_quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  design_id uuid not null references designs(id) on delete cascade,
  printer_id uuid references profiles(id) on delete set null,
  quantity integer not null check (quantity between 1 and 100),
  material text not null check (material in ('PLA', 'PETG', 'ABS', 'Resin')),
  color text not null check (char_length(color) between 1 and 100),
  city text not null check (char_length(city) between 2 and 100),
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'open' check (status in ('open', 'offered', 'accepted', 'cancelled')),
  product_price numeric check (product_price is null or (product_price > 0 and product_price <= 100000)),
  shipping_price numeric check (shipping_price is null or (shipping_price >= 0 and shipping_price <= 10000)),
  order_id uuid references orders(id) on delete set null,
  offered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- قواعد البيانات اللي انشأ فيها الجدول بنسخة سابقة: نكمّل الأعمدة والقيود الناقصة
alter table print_quotes add column if not exists offered_at timestamptz;
alter table print_quotes add column if not exists updated_at timestamptz not null default now();
alter table print_quotes drop constraint if exists print_quotes_material_check;
alter table print_quotes add constraint print_quotes_material_check check (material in ('PLA', 'PETG', 'ABS', 'Resin'));
alter table orders add column if not exists designer_commission numeric;

create index if not exists print_quotes_customer_idx on print_quotes (customer_id, created_at desc);
create index if not exists print_quotes_status_idx on print_quotes (status, created_at desc);

drop trigger if exists print_quotes_updated_at on print_quotes;
create trigger print_quotes_updated_at before update on print_quotes
  for each row execute procedure update_updated_at();

alter table print_quotes enable row level security;

-- القراءة: الزبون طلباته، وصاحب الطابعة الطلبات المفتوحة أو اللي سعّرها هو.
-- التعديل والإضافة فقط عبر الدوال تحت أو السيرفر (ما فيه سياسات insert/update).
drop policy if exists "quotes_customer_select" on print_quotes;
drop policy if exists "quotes_printer_select" on print_quotes;
drop policy if exists "Quote participants read" on print_quotes;
create policy "Quote participants read" on print_quotes for select
  using (
    customer_id = auth.uid() or printer_id = auth.uid()
    or (status = 'open' and exists (select 1 from profiles where id = auth.uid() and role = 'printer'))
  );

-- نسخ سابقة من الدوال بتواقيع مختلفة تنحذف عشان ينفع create or replace
drop function if exists request_print_quote(uuid, integer, text, text, text, text);
drop function if exists offer_print_quote(uuid, numeric, numeric);
drop function if exists decline_print_quote(uuid);

-- 3) الزبون يطلب سعر
create or replace function request_print_quote(
  p_design uuid, p_quantity integer, p_material text, p_color text, p_city text, p_notes text
) returns uuid as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'يرجى تسجيل الدخول'; end if;
  if not exists (select 1 from profiles where id = auth.uid() and role = 'customer') then
    raise exception 'طلب الطباعة متاح لحساب الزبون فقط';
  end if;
  if not exists (select 1 from designs where id = p_design) then
    raise exception 'التصميم غير موجود';
  end if;
  if (select count(*) from print_quotes
        where customer_id = auth.uid() and status = 'open'
          and created_at > now() - interval '1 day') >= 10 then
    raise exception 'وصلت للحد اليومي لطلبات التسعير';
  end if;
  insert into print_quotes (customer_id, design_id, quantity, material, color, city, notes)
  values (auth.uid(), p_design, p_quantity, p_material, btrim(p_color), btrim(p_city), btrim(coalesce(p_notes, '')))
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer set search_path = public;

-- 4) صاحب الطابعة يرسل السعر (أول طابع يسعّر ياخذ الطلب)
create or replace function offer_print_quote(p_id uuid, p_product numeric, p_shipping numeric)
returns void as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'printer') then
    raise exception 'التسعير متاح لأصحاب الطابعات فقط';
  end if;
  if p_product is null or p_product <= 0 or p_product > 100000
     or p_shipping is null or p_shipping < 0 or p_shipping > 10000 then
    raise exception 'أدخل سعرًا صحيحًا';
  end if;
  update print_quotes
     set printer_id = auth.uid(), product_price = round(p_product, 2),
         shipping_price = round(p_shipping, 2), status = 'offered', offered_at = now()
   where id = p_id and status = 'open';
  if not found then raise exception 'هذا الطلب ما عاد متاحًا للتسعير'; end if;
end;
$$ language plpgsql security definer set search_path = public;

-- 5) الزبون يلغي طلبه قبل الموافقة
create or replace function decline_print_quote(p_id uuid)
returns void as $$
begin
  update print_quotes set status = 'cancelled'
   where id = p_id and customer_id = auth.uid() and status in ('open', 'offered');
  if not found then raise exception 'لا يمكن إلغاء هذا الطلب'; end if;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function request_print_quote(uuid, integer, text, text, text, text) from public, anon;
revoke all on function offer_print_quote(uuid, numeric, numeric) from public, anon;
revoke all on function decline_print_quote(uuid) from public, anon;
grant execute on function request_print_quote(uuid, integer, text, text, text, text) to authenticated;
grant execute on function offer_print_quote(uuid, numeric, numeric) to authenticated;
grant execute on function decline_print_quote(uuid) to authenticated;

-- 6) الموافقة على العرض — تُنادى من السيرفر فقط (/api/accept-quote) بعد التحقق من الجوال
--    تنشئ طلب بانتظار الدفع بسعر الطابع المحفوظ، ونصيب المصمم 10٪ من سعر المنتج
create or replace function accept_print_quote(p_id uuid, p_customer uuid, p_name text, p_phone text, p_address text)
returns uuid as $$
declare q print_quotes; result uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Server authorization required'; end if;
  select * into q from print_quotes where id = p_id and customer_id = p_customer for update;
  if not found then raise exception 'Request not found'; end if;
  if q.status = 'accepted' then return q.order_id; end if;
  if q.status <> 'offered' then raise exception 'Offer required before payment'; end if;
  if nullif(trim(p_name), '') is null or nullif(trim(p_phone), '') is null or nullif(trim(p_address), '') is null
     or length(p_name) > 200 or length(p_phone) > 30 or length(p_address) > 1000 then
    raise exception 'Delivery details required';
  end if;
  insert into orders (customer_id, design_id, printer_id, total_price, shipping_cost, status, payment_status,
                      shipping_name, shipping_phone, shipping_city, shipping_address, notes, designer_commission, quantity)
  values (q.customer_id, q.design_id, q.printer_id, q.product_price, q.shipping_price, 'pending_payment', 'unpaid',
          trim(p_name), trim(p_phone), q.city, trim(p_address),
          'Quantity: ' || q.quantity || '; Material: ' || q.material || '; Color: ' || q.color || '; ' || coalesce(q.notes, ''),
          round(q.product_price * 0.10, 2), q.quantity)
  returning id into result;
  update print_quotes set status = 'accepted', order_id = result where id = q.id;
  return result;
end;
$$ language plpgsql security definer set search_path = public;
revoke all on function accept_print_quote(uuid, uuid, text, text, text) from public, anon, authenticated;

-- طلبات العروض: السعر والطابع ثابتين، والحالات تمشي بالترتيب فقط
create or replace function protect_quote_order()
returns trigger as $$
begin
  if exists (select 1 from print_quotes where order_id = old.id) and coalesce(auth.role(), '') <> 'service_role' then
    if new.total_price is distinct from old.total_price or new.shipping_cost is distinct from old.shipping_cost
       or new.designer_commission is distinct from old.designer_commission or new.printer_id is distinct from old.printer_id
       or new.payment_status is distinct from old.payment_status or new.payment_reference is distinct from old.payment_reference
       or new.customer_id is distinct from old.customer_id or new.design_id is distinct from old.design_id then
      raise exception 'Quote payment and allocation cannot be changed';
    end if;
    if new.status is distinct from old.status and not (
      old.payment_status = 'paid' and (
        (auth.uid() = old.printer_id and ((old.status = 'accepted' and new.status = 'printing') or (old.status = 'printing' and new.status = 'shipped')))
        or (auth.uid() = old.customer_id and old.status = 'shipped' and new.status = 'completed')
      )
    ) then raise exception 'Invalid order transition'; end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_quote_order on orders;
create trigger protect_quote_order before update on orders
  for each row execute procedure protect_quote_order();

-- 7) رفع صور المعاينة: المصمم يرفع في مجلده داخل bucket "previews"
--    (السياسة موجودة في migration_storage_upload_policies.sql — هذا تأكيد لو ما انشغّل)
drop policy if exists "savana_designer_upload_own_preview" on storage.objects;
create policy "savana_designer_upload_own_preview"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'previews'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'designer')
);

-- 8) المصمم يقدر يحذف ملفاته اللي رفعها لو فشل النشر
drop policy if exists "savana_designer_delete_own_files" on storage.objects;
create policy "savana_designer_delete_own_files"
on storage.objects for delete to authenticated
using (
  bucket_id in ('designs', 'previews')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
