-- ============================================================
-- إضافة بيانات وصفية لتصاميم المتجر: التصنيف، وقت الطباعة،
-- الخامة، وتعدد الألوان — تُستخدم لعرض تفاصيل تقنية حقيقية
-- بكل بطاقة منتج ولفلترة المتجر حسب التصنيف.
-- ============================================================

alter table designs
  add column if not exists category text not null default 'decor'
    check (category in ('decor', 'toys', 'home', 'hobby', 'edu')),
  add column if not exists print_time_hours numeric,
  add column if not exists material text
    check (material is null or material in ('PLA', 'ABS', 'PETG', 'Resin')),
  add column if not exists multi_color boolean not null default false;

comment on column designs.category is 'تصنيف التصميم: decor / toys / home / hobby / edu';
comment on column designs.print_time_hours is 'وقت الطباعة التقريبي بالساعات';
comment on column designs.material is 'خامة الطباعة الافتراضية: PLA / ABS / PETG / Resin';
comment on column designs.multi_color is 'هل التصميم متوفر بعدة ألوان';
