import { createClient } from "@supabase/supabase-js";

// ينظّف الرابط ويبقي فقط على البروتوكول والنطاق (origin)،
// ويتجاهل أي مسار إضافي (path) قد يكون انلصق بالغلط بمتغيرات البيئة
// (مثال: لو صار الرابط المخزّن ".../rest/v1" بدل الرابط الأساسي فقط،
// هذا كان يسبب خطأ "Invalid path specified in request URL" لأن
// المكتبة تبني المسار فوق مسار موجود أصلًا).
function cleanUrl(url) {
  const trimmed = (url || "").trim();
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

const supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
