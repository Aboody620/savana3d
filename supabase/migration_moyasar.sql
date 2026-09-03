-- ============================================================
-- تحديث: التبديل من Stripe إلى Moyasar (بوابة دفع سعودية معتمدة)
-- شغّل هذا فوق قاعدة البيانات (بعد ملف migration_shipping_payment.sql)
-- ============================================================

-- عمود جديد لتخزين رقم عملية الدفع من Moyasar
alter table orders add column if not exists payment_reference text;

-- عمود stripe_session_id القديم صار بدون استخدام، تقدر تتجاهله أو تحذفه
-- (حذفه اختياري، ما يأثر على شغل النظام)
-- alter table orders drop column if exists stripe_session_id;
