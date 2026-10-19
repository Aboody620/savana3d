import { useEffect, useRef, useState } from 'react';
import { validateDesignFile, validateImageFile } from '../lib/designUpload.mjs';

export default function DesignUploadForm({ lang, t, onPublish }) {
  const en = lang === 'en';
  const text = (ar, english) => en ? english : ar;
  const [values, setValues] = useState({ title:'', description:'', category:'decor' });
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const imageUrl = imageUrls[0] || '';
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stage, setStage] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const heading = useRef(null);
  const errorBox = useRef(null);
  const lock = useRef(false);
  const update = (key, value) => setValues(old => ({ ...old, [key]: value }));
  const required = text('مطلوب','Required');
  const optional = text('اختياري','Optional');
  const field = 'w-full border rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-teal';
  useEffect(() => {
    const urls = images.map(image => URL.createObjectURL(image));
    setImageUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [images]);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);
  useEffect(() => { if (review) heading.current?.focus(); }, [review]);

  function chooseFile(files) {
    if (!files?.length) return;
    if (files.length !== 1) { setError(text('اختر ملف تصميم واحدًا فقط.','Choose one design file at a time.')); return; }
    const selected = files[0];
    const problem = validateDesignFile(selected);
    if (problem) { setError(t(problem)); return; }
    setError(''); setFile(selected);
    if (!values.title.trim()) update('title', selected.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
  }
  function chooseImage(e) {
    const selected = Array.from(e.target.files || []); e.target.value = '';
    if (!selected.length) return;
    const problem = selected.map(validateImageFile).find(Boolean);
    if (problem) { setError(t(problem)); return; }
    setError(''); setImages(old => [...old, ...selected]);
  }
  function validate() {
    const problem = validateDesignFile(file) || images.map(validateImageFile).find(Boolean);
    if (problem) { setError(t(problem)); return false; }
    if (!values.title.trim()) { setError(text('أدخل اسم التصميم.','Enter the design name.')); return false; }
    setError(''); return true;
  }
  async function publish() {
    if (lock.current || success || !validate()) return;
    lock.current = true; setBusy(true); setStage('design');
    try { await onPublish({ ...values, title: values.title.trim(), file, images }, setStage); setSuccess(true); }
    catch { setError(text('تعذّر النشر. تفاصيلك وملفاتك ما زالت هنا؛ حاول مرة ثانية.','Publishing failed. Your details and files are still here; please try again.')); }
    finally { setBusy(false); lock.current = false; }
  }

  return <div className="max-w-3xl mx-auto">
    <h1 className="text-3xl font-bold text-navy">{t('upload_title')}</h1>
    <p className="text-gray-600 mt-3 mb-7">{text('ابدأ بملفك، أضف التفاصيل، ثم راجع تصميمك قبل النشر.','Start with your file, add the details, then review before publishing.')}</p>
    <aside className="mb-6 rounded-2xl border border-teal/30 bg-teal/10 p-5" aria-label={text('نسبة المصمم','Designer royalty')}>
      <h2 className="font-bold text-navy">{text('نصيبك من كل طلب مكتمل: ١٠٪','Your share of each completed order: 10%')}</h2>
      <p className="mt-2 text-sm text-gray-700">{text('تُحسب نسبتك من قيمة المنتج فقط، بدون الشحن والضريبة، وتُستحق بعد اكتمال الطلب.','Your share is calculated on the product value only, excluding shipping and tax, and becomes due after the order is completed.')}</p>
    </aside>
    {success && <div role="status" className="my-5 rounded-xl bg-teal/10 p-5"><p className="font-bold">{text('تم نشر تصميمك وحفظ صوره بنجاح','Your design and images were published successfully')}</p><a href="/dashboard" className="inline-block underline mt-3">{text('عرض تصاميمي','View my designs')}</a></div>}
    <form onSubmit={e => { e.preventDefault(); if (!review && validate()) setReview(true); }} className="bg-white border rounded-2xl p-5 sm:p-8 shadow-sm" aria-busy={busy}>
      <fieldset disabled={busy || success} className="min-w-0 space-y-7">
        <div hidden={review} className="space-y-7">
          <section aria-labelledby="file-heading">
            <h2 id="file-heading" className="font-bold text-lg mb-3">{text('١. ارفع ملف التصميم','1. Upload your design')} <span className="text-sm font-normal text-gray-500">({required})</span></h2>
            <button type="button" onClick={() => fileInput.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files); }} className={`w-full border-2 border-dashed rounded-2xl px-4 py-8 text-center focus:outline-none focus:ring-2 focus:ring-teal ${dragging ? 'border-teal bg-teal/10' : 'border-gray-300 bg-gray-50'}`}>
              <span aria-hidden="true" className="block text-3xl text-teal mb-3">↑</span>
              <span className="block font-bold break-all">{file ? file.name : text('اسحب ملفك هنا أو اضغط لاختياره','Drop your file here or click to choose')}</span>
              <span className="block text-sm text-gray-600 mt-2">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ${text('تغيير الملف','Replace file')}` : text('STL · OBJ · 3MF · STEP / STP — حتى 50 MB لكل ملف (حد التخزين الحالي)','STL · OBJ · 3MF · STEP / STP — up to 50 MB per file (current storage limit)')}</span>
            </button>
            <input ref={fileInput} type="file" accept=".stl,.obj,.3mf,.step,.stp" hidden onChange={e => { chooseFile(e.target.files); e.target.value = ''; }} />
          </section>
          <section aria-labelledby="details-heading" className="space-y-4">
            <h2 id="details-heading" className="font-bold text-lg">{text('٢. تفاصيل التصميم','2. Design details')}</h2>
            <div><label htmlFor="design-title" className="block text-sm font-medium mb-2">{t('upload_name')} · {required}</label><input id="design-title" required={!review} value={values.title} onChange={e => update('title', e.target.value)} placeholder={text('مثال: حامل جوال مكتبي','Example: Desktop phone stand')} className={field} /></div>
            <div className="grid sm:grid-cols-2 gap-4">

              <div><label htmlFor="design-category" className="block text-sm font-medium mb-2">{t('upload_category')}</label><select id="design-category" value={values.category} onChange={e => update('category', e.target.value)} className={field}>{['decor','toys','home','hobby','edu'].map(key => <option key={key} value={key}>{t(`cat_${key}`)}</option>)}</select></div>
            </div>
            <div><label htmlFor="design-description" className="block text-sm font-medium mb-2">{t('upload_description')} · {optional}</label><textarea id="design-description" rows={3} value={values.description} onChange={e => update('description', e.target.value)} placeholder={text('وش يميز تصميمك؟ اذكر استخدامه وأي ملاحظات تساعد المشتري.','Describe its use and any helpful notes for buyers.')} className={field} /></div>
            <div><label htmlFor="design-image" className="block text-sm font-medium mb-2">{text('صور التصميم — JPG / PNG / WEBP، حتى 5 MB للصورة','Design images — JPG / PNG / WEBP, up to 5 MB each')}</label><p className="text-sm text-gray-500 mb-3">{text('أضف صورًا من عدة زوايا، واختر الصورة الرئيسية التي تظهر في المعرض.','Add images from different angles and choose the main image shown in the store.')}</p><input id="design-image" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={chooseImage} className="w-full text-sm" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {images.map((image, index) => <div key={index} className="min-w-0 border rounded-xl overflow-hidden">
                  <div className="aspect-square bg-gray-50 p-2"><img src={imageUrls[index]} alt={`${values.title} ${index + 1}`} className="h-full w-full object-contain" /></div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs break-all">{image.name}</p>
                    <button type="button" disabled={index === 0} onClick={() => setImages(old => [old[index], ...old.filter((_, i) => i !== index)])} className="w-full text-sm rounded-lg border px-2 py-2 disabled:bg-teal/10">{index === 0 ? text('الصورة الرئيسية','Main image') : text('تعيين كرئيسية','Make main')}</button>
                    {index > 0 && <button type="button" onClick={() => setImages(old => { const next = [...old]; [next[index-1], next[index]] = [next[index], next[index-1]]; return next; })} className="w-full text-sm underline py-1">{text('تقديم الصورة في الترتيب','Move image earlier')}</button>}
                    <label className="block text-center cursor-pointer border rounded-lg py-2 text-sm">{text('استبدال','Replace')}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={e => {
                      const replacement = e.target.files?.[0]; e.target.value = '';
                      if (!replacement) return;
                      const problem = validateImageFile(replacement);
                      if (problem) { setError(t(problem)); return; }
                      setError(''); setImages(old => old.map((item, i) => i === index ? replacement : item));
                    }} /></label>
                    <button type="button" onClick={() => setImages(old => old.filter((_, i) => i !== index))} className="w-full text-sm text-red-600 py-2">{text('إزالة','Remove')}</button>
                  </div>
                </div>)}
              </div>
            </div>
          </section>

        </div>
        {review && <section aria-labelledby="review-heading"><h2 ref={heading} tabIndex={-1} id="review-heading" className="text-xl font-bold text-navy">{text('٣. المراجعة والنشر','3. Review and publish')}</h2><p className="text-gray-500 mt-2 mb-5">{text('راجع التفاصيل، ثم انشر تصميمك في المتجر.','Check your details, then publish your design to the store.')}</p>
          <div className="grid sm:grid-cols-2 gap-5 border rounded-xl p-4">{imageUrl ? <img src={imageUrl} alt={values.title} className="w-full h-48 object-contain rounded-lg" /> : <div className="bg-gray-50 rounded-xl h-40 flex items-center justify-center text-gray-500">{text('لم تُضف صورة معاينة','No preview image added')}</div>}<div className="space-y-3 min-w-0"><h3 className="text-xl font-bold break-words">{values.title}</h3><p>{t(`cat_${values.category}`)}</p><p dir="auto" className="text-sm break-all text-gray-500">{file?.name}</p></div></div>
          {values.description && <p className="mt-4 whitespace-pre-wrap break-words">{values.description}</p>}
        </section>}
        {error && <p ref={errorBox} tabIndex={-1} role="alert" className="text-red-600 border border-red-300 rounded-xl p-3 text-sm">{error}</p>}
        <p role="status" aria-live="polite" className="text-sm text-teal font-bold">{busy ? (stage === 'image' ? text('جاري رفع صور التصميم…','Uploading design images…') : stage === 'save' ? text('جاري نشر التصميم…','Publishing design…') : t('upload_uploading')) : ''}</p>
        <div className="flex flex-col sm:flex-row gap-3 border-t pt-5">{review && <button type="button" onClick={() => { setReview(false); setError(''); }} className="border rounded-xl px-6 py-3 font-bold">{text('تعديل التفاصيل','Edit details')}</button>}{review ? <button type="button" onClick={publish} className="flex-1 bg-teal text-white py-3 rounded-xl font-bold disabled:opacity-50">{success ? t('upload_success_short') : busy ? t('upload_uploading') : t('upload_submit')}</button> : <button type="submit" className="flex-1 bg-teal text-white py-3 rounded-xl font-bold">{text('مراجعة التصميم','Review design')}</button>}</div>
      </fieldset>
    </form>
  </div>;
}
