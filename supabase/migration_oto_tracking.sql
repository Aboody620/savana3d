-- ============================================================
-- تتبع الشحن التلقائي من OTO — شغّله في Supabase → SQL Editor
-- (شغّل migration_server_checkout.sql قبله)
-- ============================================================
alter table orders add column if not exists shipping_status text;   -- آخر حالة من OTO / شركة الشحن
alter table orders add column if not exists tracking_url text;      -- رابط تتبع للزبون
alter table orders add column if not exists shipping_carrier text;  -- اسم شركة الشحن
alter table orders add column if not exists oto_order_id text;      -- SAVANA-<id> بعد التجهيز في OTO

-- حقول الشحن هذي يكتبها السيرفر فقط (webhook OTO)، مو الطابع ولا الزبون
create or replace function protect_oto_fields()
returns trigger as $$
begin
  if coalesce(auth.role(), 'service_role') <> 'service_role' and (
       new.shipping_status is distinct from old.shipping_status
    or new.tracking_url is distinct from old.tracking_url
    or new.shipping_carrier is distinct from old.shipping_carrier
    or new.oto_order_id is distinct from old.oto_order_id) then
    raise exception 'بيانات الشحن يحدّثها النظام فقط';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists orders_protect_oto_fields on orders;
create trigger orders_protect_oto_fields
  before update on orders
  for each row execute procedure protect_oto_fields();
