import { createClient } from "@supabase/supabase-js";

// ينظّف الرابط من أي مسافات أو / زايدة بالنهاية قد تسبب أخطاء غير متوقعة
function cleanUrl(url) {
  return (url || "").trim().replace(/\/+$/, "");
}

const supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
