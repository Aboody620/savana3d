-- ============================================================
-- تحديث: إصلاح مشكلة "row-level security policy for table profiles"
-- ينشئ تلقائيًا سطر profiles عند تسجيل أي مستخدم جديد، حتى مع
-- تفعيل تأكيد الإيميل (قبل توفر جلسة نشطة من جهة العميل)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
