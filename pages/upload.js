import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";

// أنواع ملفات التصميم المسموحة (امتداد + نوع MIME الفعلي)
const ALLOWED_DESIGN_EXTENSIONS = ["stl", "obj", "3mf", "step", "stp"];
const MAX_DESIGN_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// أنواع صور المعاينة المسموحة
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function getExtension(fileName) {
  return (fileName.split(".").pop() || "").toLowerCase();
}

function validateDesignFile(file) {
  if (!file) return "الرجاء اختيار ملف التصميم";

  const ext = getExtension(file.name);
  if (!ALLOWED_DESIGN_EXTENSIONS.includes(ext)) {
    return `نوع الملف غير مسموح. الأنواع المسموحة: ${ALLOWED_DESIGN_EXTENSIONS.join(", ")}`;
  }

  if (file.size > MAX_DESIGN_FILE_SIZE) {
    return "حجم الملف كبير جدًا. الحد الأقصى 50 ميجابايت";
  }

  if (file.size === 0) {
    return "الملف فارغ، تأكد من اختيار ملف صحيح";
  }

  return null;
}

function validateImageFile(file) {
  if (!file) return null; // اختياري

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "صورة المعاينة يجب أن تكون JPG أو PNG أو WEBP فقط";
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return "حجم صورة المعاينة كبير جدًا. الحد الأقصى 5 ميجابايت";
  }

  return null;
}

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

  function handleFileChange(e) {
    const selected = e.target.files[0];
    const validationError = validateDesignFile(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      e.target.value = "";
      return;
    }
    setError("");
    setFile(selected);
  }

  function handleImageChange(e) {
    const selected = e.target.files[0];
    const validationError = validateImageFile(selected);
    if (validationError) {
      setError(validationError);
      setPreviewImage(null);
      e.target.value = "";
      return;
    }
    setError("");
    setPreviewImage(selected);
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError("");

    // تحقق نهائي قبل الإرسال (دفاع إضافي حتى لو تجاوز المستخدم تحقق الحقل)
    const fileValidationError = validateDesignFile(file);
    if (fileValidationError) {
      setError(fileValidationError);
      return;
    }

    const imageValidationError = validateImageFile(previewImage);
    if (imageValidationError) {
      setError(imageValidationError);
      return;
    }

    setUploading(true);

    try {
      // 1) رفع ملف التصميم إلى Storage
      const fileExt = getExtension(file.name);
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
        const imgExt = getExtension(previewImage.name);
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
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            ملف التصميم (STL / OBJ / 3MF / STEP) — حد أقصى 50 ميجابايت
          </label>
          <input
            type="file"
            required
            accept=".stl,.obj,.3mf,.step,.stp"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            صورة معاينة (اختياري) — JPG/PNG/WEBP، حد أقصى 5 ميجابايت
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
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
