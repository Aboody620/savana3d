-- ============================================================
-- منصة الطباعة الثلاثية الأبعاد — قاعدة البيانات الكاملة
-- شغّل هذا الملف كامل داخل Supabase → SQL Editor → New Query
-- ============================================================

-- 1) جدول الملفات الشخصية (يمتد من جدول المستخدمين الافتراضي في Supabase)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null check (role in ('customer', 'designer', 'printer')) default 'customer',
  city text,
  rating numeric default 5.0,
  created_at timestamp with time zone default now()
);

-- 2) جدول التصاميم (يرفعها المصممون للبيع في المتجر)
create table if not exists designs (
  id uuid default gen_random_uuid() primary key,
  designer_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric not null default 0,
  file_url text not null,          -- رابط ملف التصميم (STL/OBJ) في Storage
  preview_image_url text,          -- صورة معاينة (اختياري)
  created_at timestamp with time zone default now()
);

-- 3) جدول الطلبات
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references profiles(id) on delete cascade not null,
  design_id uuid references designs(id) on delete set null,      -- إذا الطلب من المتجر
  custom_file_url text,                                          -- إذا الزبون رفع تصميمه الخاص
  printer_id uuid references profiles(id) on delete set null,    -- يُملأ لما طابع يقبل الطلب
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'printing', 'shipped', 'completed', 'cancelled')),
  total_price numeric not null default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================
-- تفعيل الحماية على مستوى الصفوف (Row Level Security)
-- ============================================================
alter table profiles enable row level security;
alter table designs enable row level security;
alter table orders enable row level security;

-- ---- سياسات profiles ----
create policy "الجميع يقدر يشوف الملفات الشخصية الأساسية"
  on profiles for select using (true);

create policy "المستخدم يعدل ملفه الشخصي فقط"
  on profiles for update using (auth.uid() = id);

create policy "المستخدم ينشئ ملفه الشخصي عند التسجيل"
  on profiles for insert with check (auth.uid() = id);

-- ---- سياسات designs ----
create policy "الجميع يقدر يشوف التصاميم في المتجر"
  on designs for select using (true);

create policy "المصمم فقط يرفع تصاميمه"
  on designs for insert with check (auth.uid() = designer_id);

create policy "المصمم يعدل أو يحذف تصاميمه فقط"
  on designs for update using (auth.uid() = designer_id);

create policy "المصمم يحذف تصاميمه فقط"
  on designs for delete using (auth.uid() = designer_id);

-- ---- سياسات orders ----
create policy "الزبون يشوف طلباته فقط"
  on orders for select using (auth.uid() = customer_id);

create policy "الطابع يشوف الطلبات المعلّقة أو طلباته المقبولة"
  on orders for select using (
    status = 'pending' or auth.uid() = printer_id
  );

create policy "الزبون ينشئ طلب"
  on orders for insert with check (auth.uid() = customer_id);

create policy "الطابع يقبل طلب معلّق أو يحدّث طلبه"
  on orders for update using (
    status = 'pending' or auth.uid() = printer_id or auth.uid() = customer_id
  );

-- ============================================================
-- دالة تحدّث updated_at تلقائيًا عند أي تعديل على الطلب
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row execute procedure update_updated_at();

-- ============================================================
-- Storage buckets (شغّلها من تبويب Storage بالواجهة إذا ما اشتغلت هنا)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('previews', 'previews', true)
on conflict (id) do nothing;
