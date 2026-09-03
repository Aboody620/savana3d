import { createClient } from "@supabase/supabase-js";

// تحذير مهم: هذا الملف يُستخدم فقط داخل pages/api/*.js (كود سيرفر)
// ولا يجوز استيراده أبدًا داخل أي صفحة أو مكوّن يشتغل بالمتصفح،
// لأن SERVICE_ROLE_KEY يتجاوز كل قواعد الحماية (RLS) بقاعدة البيانات.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
