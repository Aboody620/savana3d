-- ============================================================
-- تحديثات أمنية عاجلة — شغّل هذا الملف كامل داخل Supabase → SQL Editor → New Query
-- ============================================================

-- ------------------------------------------------------------
-- 1) إصلاح ثغرة صلاحيات تحديث الطلبات (orders)
--
-- المشكلة: السياسة القديمة كانت تسمح لأي مستخدم مسجّل يعدّل أي
-- طلب حالته "pending"، حتى لو الطلب مو له — يقدر يغيّر السعر،
-- الحالة، أو ينسب الطلب لنفسه بدون تحقق حقيقي من هويته.
--
-- الحل: نفصل الصلاحية لثلاث حالات واضحة، ونضيف WITH CHECK
-- (يتحقق من القيم الجديدة بعد التعديل، مو بس القديمة)، بالإضافة
-- لـ trigger يمنع تغيير الحقول الحساسة (السعر، الزبون، التصميم)
-- نهائيًا بعد إنشاء الطلب — حتى لو صاحب الصلاحية حاول يعدلها.
-- ------------------------------------------------------------

drop policy if exists "الطابع يقبل طلب معلّق أو يحدّث طلبه" on orders;

create policy "الزبون يحدّث طلبه فقط"
  on orders for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

create policy "الطابع يقبل طلب معلّق"
  on orders for update
  using (status = 'pending' and printer_id is null)
  with check (auth.uid() = printer_id);

create policy "الطابع يحدّث طلبه المقبول"
  on orders for update
  using (auth.uid() = printer_id)
  with check (auth.uid() = printer_id);

-- تريغر يمنع تغيير الحقول الحساسة على أي طلب بعد إنشائه،
-- بغض النظر عن مين يسوي التحديث (زبون أو طابع)
create or replace function prevent_order_tampering()
returns trigger as $$
begin
  if new.total_price is distinct from old.total_price
     or new.shipping_cost is distinct from old.shipping_cost
     or new.customer_id is distinct from old.customer_id
     or new.design_id is distinct from old.design_id
     or new.custom_file_url is distinct from old.custom_file_url then
    raise exception 'لا يمكن تعديل بيانات الطلب الأساسية بعد إنشائه';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists orders_prevent_tampering on orders;

create trigger orders_prevent_tampering
  before update on orders
  for each row execute procedure prevent_order_tampering();

-- ------------------------------------------------------------
-- 2) تقييد أنواع وأحجام الملفات على مستوى Storage
--
-- حماية إضافية على مستوى قاعدة البيانات نفسها (مو بس بالواجهة)،
-- عشان حتى لو حد حاول يرفع ملف عبر API مباشرة متجاوزًا الواجهة،
-- Supabase نفسه يرفض الملف.
-- ------------------------------------------------------------

update storage.buckets
set file_size_limit = 52428800, -- 50MB بالبايت
    allowed_mime_types = array[
      'model/stl',
      'application/sla',
      'application/vnd.ms-pki.stl',
      'model/obj',
      'text/plain',
      'application/octet-stream',
      'model/3mf',
      'model/step',
      'application/step'
    ]
where id = 'designs';

update storage.buckets
set file_size_limit = 5242880, -- 5MB بالبايت
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'previews';

-- ملاحظة: أنواع MIME لملفات STL/OBJ/3MF مو موحّدة عالميًا بالمتصفحات
-- (كثير متصفحات ترسلها كـ application/octet-stream)، فتركنا خيارات
-- واسعة شوي هنا، والتحقق الأدق (بالامتداد) موجود أصلًا بكود الواجهة.
