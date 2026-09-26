import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/useAuth";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";

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
  if (!file) return "upload_select_file_error";

  const ext = getExtension(file.name);
  if (!ALLOWED_DESIGN_EXTENSIONS.includes(ext)) {
    return "upload_file_type_error";
  }

  if (file.size > MAX_DESIGN_FILE_SIZE) {
    return "upload_file_size_error";
  }

  if (file.size === 0) {
    return "upload_file_empty_error";
  }

  return null;
}

function validateImageFile(file) {
  if (!file) return null; // اختياري

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "upload_image_type_error";
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return "upload_image_size_error";
  }

  return null;
}

export default function Upload() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const t = getT(lang);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [category, setCategory] = useState("decor");
  const [printTimeHours, setPrintTimeHours] = useState("");
  const [material, setMaterial] = useState("PLA");
  const [multiColor, setMultiColor] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (authLoading) return <p>{t("dash_loading")}</p>;

  if (!user) {
    return <p className="text-center text-gray-600">{t("upload_login_required")}</p>;
  }

  if (profile && profile.role !== "designer") {
    return <p className="text-center text-gray-600">{t("upload_designer_only")}</p>;
  }

  function handleFileChange(e) {
    const selected = e.target.files[0];
    const errorKey = validateDesignFile(selected);
    if (errorKey) {
      setError(t(errorKey));
      setFile(null);
      e.target.value = "";
      return;
    }
    setError("");
    setFile(selected);
  }

  function handleImageChange(e) {
    const selected = e.target.files[0];
    const errorKey = validateImageFile(selected);
    if (errorKey) {
      setError(t(errorKey));
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
    const fileErrorKey = validateDesignFile(file);
    if (fileErrorKey) {
      setError(t(fileErrorKey));
      return;
    }

    const imageErrorKey = validateImageFile(previewImage);
    if (imageErrorKey) {
      setError(t(imageErrorKey));
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
        category,
        print_time_hours: printTimeHours ? parseFloat(printTimeHours) : null,
        material,
        multi_color: multiColor,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => router.push("/store"), 1400);
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold text-navy mb-6">{t("upload_title")}</h1>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("upload_name")}</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("upload_description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("upload_price")}</label>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t("upload_category")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="decor">{t("cat_decor")}</option>
              <option value="toys">{t("cat_toys")}</option>
              <option value="home">{t("cat_home")}</option>
              <option value="hobby">{t("cat_hobby")}</option>
              <option value="edu">{t("cat_edu")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("upload_material")}</label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="PLA">PLA</option>
              <option value="ABS">ABS</option>
              <option value="PETG">PETG</option>
              <option value="Resin">Resin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">{t("upload_print_time")}</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={printTimeHours}
              onChange={(e) => setPrintTimeHours(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2.5">
            <input
              type="checkbox"
              checked={multiColor}
              onChange={(e) => setMultiColor(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            {t("upload_multi_color")}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("upload_design_file")}</label>
          <input
            type="file"
            required
            accept=".stl,.obj,.3mf,.step,.stp"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("upload_preview_image")}</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="w-full"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-teal text-sm font-bold">{t("upload_success")}</p>}

        <button
          type="submit"
          disabled={uploading || success}
          className="w-full bg-teal text-white py-2.5 rounded-lg font-bold hover:opacity-90 disabled:opacity-50"
        >
          {success ? t("upload_success_short") : uploading ? t("upload_uploading") : t("upload_submit")}
        </button>
      </form>
    </div>
  );
}
