-- ============================================================
-- تحديث: إضافة الشحن وطرق الدفع
-- شغّل هذا الملف كامل داخل Supabase → SQL Editor → New Query
-- (هذا تحديث فوق قاعدة البيانات الموجودة، ما يمسح أي بيانات)
-- ============================================================

-- 1) إضافة حقول الشحن لجدول الطلبات
alter table orders add column if not exists shipping_name text;
alter table orders add column if not exists shipping_phone text;
alter table orders add column if not exists shipping_city text;
alter table orders add column if not exists shipping_address text;
alter table orders add column if not exists shipping_cost numeric default 25;
alter table orders add column if not exists tracking_number text;

-- 2) إضافة حقول الدفع
alter table orders add column if not exists payment_status text
  default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded'));
alter table orders add column if not exists stripe_session_id text;

-- 3) تحديث قائمة حالات الطلب لإضافة "بانتظار الدفع" قبل "بانتظار طابع"
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in (
    'pending_payment', -- بانتظار إتمام الدفع
    'pending',          -- مدفوع، بانتظار طابع يقبله
    'accepted',
    'printing',
    'shipped',
    'completed',
    'cancelled'
  ));

-- ملاحظة: الطلبات القديمة (لو فيه) تبقى بحالتها الحالية، هذا التحديث
-- ما يغيّر أي بيانات موجودة، بس يضيف الأعمدة والقيم الجديدة كافتراضي.
