-- ============================================================
-- إغلاق ثغرات الدفع — شغّله مرة وحدة في Supabase → SQL Editor
-- (آمن لو انشغّل أكثر من مرة)
--
-- قبل هذا الملف كان المتصفح يقدر:
--   1) ينشئ طلب بأي سعر (يشتري تصميم بريال)
--   2) يعدّل طلبه ويخليه "مدفوع" بدون ما يدفع
--   3) أي حساب (حتى زبون) يقدر يقبل طلبات الطباعة
-- بعده: الطلبات تنشأ فقط من السيرفر (/api/checkout) بأسعار قاعدة البيانات،
-- وحالة الدفع ما يغيّرها إلا السيرفر بعد التحقق من ميسر.
-- ============================================================

-- 1) عمود الكمية (الطلبات القديمة تعتبر كمية 1)
alter table orders add column if not exists quantity integer not null default 1;
alter table orders drop constraint if exists orders_quantity_check;
alter table orders add constraint orders_quantity_check check (quantity between 1 and 100);

-- 2) الزبون ما عاد ينشئ أو يعدّل الطلبات مباشرة — السيرفر يسويها بمفتاح service_role
drop policy if exists "الزبون ينشئ طلب" on orders;
drop policy if exists "الزبون يحدّث طلبه فقط" on orders;

-- 3) قبول الطلبات لأصحاب الطابعات فقط، وللطلبات المدفوعة فقط
drop policy if exists "الطابع يقبل طلب معلّق" on orders;
create policy "الطابع يقبل طلب معلّق"
  on orders for update
  using (
    status = 'pending' and printer_id is null and payment_status = 'paid'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'printer')
  )
  with check (auth.uid() = printer_id);

-- 4) حماية الحقول الحساسة: الأسعار والدفع ما يغيّرها إلا السيرفر
create or replace function prevent_order_tampering()
returns trigger as $$
declare
  trusted boolean := coalesce(auth.role(), 'service_role') = 'service_role';
begin
  if new.total_price is distinct from old.total_price
     or new.shipping_cost is distinct from old.shipping_cost
     or new.quantity is distinct from old.quantity
     or new.customer_id is distinct from old.customer_id
     or new.design_id is distinct from old.design_id
     or new.custom_file_url is distinct from old.custom_file_url then
    raise exception 'لا يمكن تعديل بيانات الطلب الأساسية بعد إنشائه';
  end if;

  if not trusted then
    if new.payment_status is distinct from old.payment_status
       or new.payment_reference is distinct from old.payment_reference then
      raise exception 'حالة الدفع يحددها النظام فقط';
    end if;
    if old.status = 'pending_payment' and new.status is distinct from old.status then
      raise exception 'الطلب لم يُدفع بعد';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists orders_prevent_tampering on orders;
create trigger orders_prevent_tampering
  before update on orders
  for each row execute procedure prevent_order_tampering();

-- 5) أي إدخال من غير السيرفر يُرفض (حماية إضافية لو رجعت سياسة insert بالغلط)
create or replace function orders_insert_server_only()
returns trigger as $$
begin
  if coalesce(auth.role(), 'service_role') <> 'service_role' then
    raise exception 'الطلبات تُنشأ من خلال صفحة الدفع فقط';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists orders_insert_server_only on orders;
create trigger orders_insert_server_only
  before insert on orders
  for each row execute procedure orders_insert_server_only();

-- 6) لو فيه طلبات انعلّمت "مدفوعة" بدون رقم عملية من ميسر، هذا الاستعلام يطلعها لك تراجعها:
-- select id, created_at, total_price, status from orders
--   where payment_status = 'paid' and payment_reference is null;
