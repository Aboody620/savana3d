// يستخرج مسار الملف داخل bucket "designs" من الرابط المخزّن بقاعدة البيانات.
// الروابط القديمة محفوظة كـ public URL؛ بعد ما صار الـ bucket خاص نستخدم المسار
// لإنشاء رابط تحميل مؤقت (signed URL) لصاحب الحق فقط.
export function designsPathFromUrl(fileUrl, supabaseUrl) {
  if (typeof fileUrl !== "string" || !fileUrl) return null;
  let origin;
  try { origin = new URL(supabaseUrl).origin; } catch { return null; }
  for (const kind of ["public", "sign", "authenticated"]) {
    const prefix = `${origin}/storage/v1/object/${kind}/designs/`;
    if (fileUrl.startsWith(prefix)) {
      const path = decodeURIComponent(fileUrl.slice(prefix.length).split("?")[0]);
      if (!path || path.includes("..") || path.startsWith("/")) return null;
      return path;
    }
  }
  return null;
}
