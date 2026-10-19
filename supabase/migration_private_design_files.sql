-- ============================================================
-- حماية ملفات التصاميم + إصلاح رفع الطلب المخصص
-- شغّله في Supabase → SQL Editor
--
-- 1) bucket "designs" يصير خاص: ملفات STL المدفوعة ما عاد ينفع تتحمّل
--    من رابطها المباشر. التحميل يصير عبر /api/files/download برابط مؤقت
--    للمصمم (ملفاته) وصاحب الطابعة (الطلب المدفوع اللي قبله) فقط.
--    صور المعاينة في bucket "previews" تبقى عامة عشان تظهر بالمتجر.
-- 2) الزبون يقدر يرفع ملف طلبه المخصص في مجلده: designs/custom/<user id>/
-- ============================================================

update storage.buckets set public = false where id = 'designs';

drop policy if exists "savana_customer_upload_custom_order" on storage.objects;
create policy "savana_customer_upload_custom_order"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'designs'
  and (storage.foldername(name))[1] = 'custom'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
