import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/LanguageContext';
import { getT } from '../lib/translations';
import DesignUploadForm from '../components/DesignUploadForm';

export default function Upload() {
  const { user, profile, loading } = useAuth();
  const { lang } = useLanguage();
  const t = getT(lang);
  if (loading) return <p role="status">{t('dash_loading')}</p>;
  if (!user) return <p className="text-center text-gray-600">{t('upload_login_required')}</p>;
  if (!profile || profile.role !== 'designer') return <p className="text-center text-gray-600">{t('upload_designer_only')}</p>;

  async function publish(values, setStage) {
    const { title, description, file, images, category } = values;
    const uploaded = [];
    try {
      const filePath = `${user.id}/${crypto.randomUUID()}.${file.name.split('.').pop().toLowerCase()}`;
      const { error } = await supabase.storage.from('designs').upload(filePath, file);
      if (error) throw error;
      uploaded.push(['designs', filePath]);
      const { data: fileData } = supabase.storage.from('designs').getPublicUrl(filePath);
      const previewUrls = [];
      for (const previewImage of images) {
        setStage('image');
        const imagePath = `${user.id}/${crypto.randomUUID()}.${previewImage.name.split('.').pop().toLowerCase()}`;
        const { error: imageError } = await supabase.storage.from('previews').upload(imagePath, previewImage);
        if (imageError) throw imageError;
        uploaded.push(['previews', imagePath]);
        const { data } = supabase.storage.from('previews').getPublicUrl(imagePath);
        previewUrls.push(data.publicUrl);
      }
      setStage('save');
      const { error: insertError } = await supabase.from('designs').insert({
        designer_id: user.id, title, description, price: 0, pricing_mode: 'quote', file_url: fileData.publicUrl,
        preview_image_url: previewUrls[0] || null, preview_image_urls: previewUrls, category,
      });
      if (insertError) throw insertError;
    } catch (error) {
      // Only remove files created by this unsuccessful publish attempt.
      await Promise.allSettled(uploaded.map(([bucket, path]) => supabase.storage.from(bucket).remove([path])));
      throw error;
    }
  }
  return <><Head><meta name="robots" content="noindex,nofollow" /></Head><DesignUploadForm lang={lang} t={t} onPublish={publish} /></>;
}
