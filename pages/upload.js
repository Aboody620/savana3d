import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";

export default function Upload() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  if (authLoading) return <p>جاري التحميل...</p>;

  if (!user) {
    return (
      <p className="text-center text-gray-600">
        سجّل الدخول كمصمم أول عشان ترفع تصاميم.
      </p>
    );
  }

  if (profile && profile.role !== "designer") {
    return (
      <p className="text-center text-gray-600">
        هذي الصفحة مخصصة لحسابات المصممين فقط.
      </p>
    );
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("الرجاء اختيار ملف التصميم");
      return;
    }

    setUploading(true);

    try {
      // 1) رفع ملف التصميم إلى Storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: fileUrlData } = supabase.storage
        .from("designs")
        .getPublicUrl(filePath);

      // 2) رفع صورة المعاينة (اختياري)
      let previewUrl = null;
      if (previewImage) {
        const imgExt = previewImage.name.split(".").pop();
        const imgPath = `${user.id}/${Date.now()}_preview.${imgExt}`;

        const { error: imgError } = await supabase.storage
          .from("previews")
          .upload(imgPath, previewImage);

        if (!imgError) {
          const { data: imgUrlData } = supabase.storage
            .from("previews")
            .getPublicUrl(imgPath);
          previewUrl = imgUrlData.publicUrl;
        }
      }

      // 3) إضافة سجل التصميم في قاعدة البيانات
      const { error: insertError } = await supabase.from("designs").insert({
        designer_id: user.id,
        title,
        description,
        price: parseFloat(price),
        file_url: fileUrlData.publicUrl,
        preview_image_url: previewUrl,
      });

      if (insertError) throw insertError;

      router.push("/store");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold text-navy mb-6">رفع تصميم جديد</h1>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">اسم التصميم</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">الوصف</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">السعر (ريال)</label>
          <input
            type="number"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            ملف التصميم (STL / OBJ)
          </label>
          <input
            type="file"
            required
            accept=".stl,.obj"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            صورة معاينة (اختياري)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPreviewImage(e.target.files[0])}
            className="w-full"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-teal text-white py-2.5 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? "جاري الرفع..." : "نشر التصميم"}
        </button>
      </form>
    </div>
  );
}
