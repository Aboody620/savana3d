import { useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';

export default function QuoteRequestForm({ designId, lang }) {
  const { user, profile, loading } = useAuth();
  const en = lang === 'en';
  const tr = (ar, english) => en ? english : ar;
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(e) {
    e.preventDefault(); if (lock.current) return;
    const f = new FormData(e.currentTarget);
    lock.current = true; setBusy(true); setError('');
    try {
      const { error: problem } = await supabase.rpc('request_print_quote', {
        p_design: designId, p_quantity: Number(f.get('quantity')), p_material: f.get('material'),
        p_color: f.get('color'), p_city: f.get('city'), p_notes: f.get('notes'),
      });
      if (problem) throw problem;
      setSent(true);
    } catch { setError(tr('تعذر إرسال الطلب. احتفظنا بخياراتك؛ حاول مرة أخرى.','Unable to send. Your choices are preserved; please try again.')); }
    finally { setBusy(false); lock.current = false; }
  }
  if (loading) return <p role="status">{tr('جارٍ التحميل…','Loading…')}</p>;
  if (!user) return <Link href="/login" className="block rounded-xl bg-navy text-white p-3 text-center">{tr('سجّل الدخول لطلب سعر الطباعة','Log in to request a print quote')}</Link>;
  if (profile?.role !== 'customer') return <p>{tr('طلب الطباعة متاح من حساب الزبون.','Use a customer account to request printing.')}</p>;
  if (sent) return <div role="status" className="rounded-xl bg-teal/10 p-5"><p className="font-bold">{tr('تم إرسال طلب التسعير بنجاح','Quote request sent')}</p><p className="my-2">{tr('تابع عرض الطابع من صفحة عروض الطباعة. لن تدفع قبل موافقتك على السعر.','Track the printer’s offer on Print quotes. You only pay after approving the price.')}</p><Link className="underline" href="/quotes">{tr('متابعة الطلب','Track request')}</Link></div>;
  const field = 'w-full border rounded-xl px-3 py-3 mt-1';
  return <form onSubmit={submit} className="space-y-4 border rounded-2xl p-5">
    <h2 className="font-bold text-xl">{tr('اطلب سعر الطباعة','Request a print quote')}</h2>
    <p className="text-sm text-gray-600">{tr('اختر تفضيلاتك. يؤكد الطابع توفر الخامة واللون والسعر النهائي قبل موافقتك والدفع.','Choose your preferences. A printer confirms material, color and the final price before you approve and pay.')}</p>
    <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-4">
      <label>{tr('الخامة المطلوبة','Preferred material')}<select name="material" className={field} required><option value="">{tr('اختر الخامة','Select material')}</option>{['PLA','PETG','ABS','Resin'].map(m => <option key={m}>{m}</option>)}</select></label>
      <label>{tr('اللون المطلوب','Preferred color')}<input name="color" required maxLength={100} className={field} /></label>
      <label>{tr('الكمية','Quantity')}<input name="quantity" type="number" min="1" max="100" defaultValue="1" required className={field} /></label>
      <label>{tr('مدينة التوصيل','Delivery city')}<input name="city" required maxLength={100} className={field} /></label>
      <label className="sm:col-span-2">{tr('المقاس المطلوب أو ملاحظات','Size or other notes')}<textarea name="notes" rows={3} maxLength={2000} className={field} /></label>
      <button className="sm:col-span-2 bg-navy text-white rounded-xl p-3 font-bold">{busy ? tr('جارٍ الإرسال…','Sending…') : tr('إرسال طلب التسعير — بدون دفع','Request a quote — no payment')}</button>
    </fieldset>
    {error && <p role="alert" className="text-red-600">{error}</p>}
  </form>;
}
