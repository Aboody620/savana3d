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
  if (!user) return <Link href="/login" className="block rounded-2xl bg-gold text-white py-4 text-center font-bold">{tr('سجّل الدخول لطلب سعر الطباعة','Log in to request a print quote')}</Link>;
  if (profile?.role !== 'customer') return <p>{tr('طلب الطباعة متاح من حساب الزبون.','Use a customer account to request printing.')}</p>;
  if (sent) return <div role="status" className="rounded-2xl bg-teal/10 p-5"><p className="font-bold">{tr('وصل طلبك','Request sent')}</p><p className="my-2">{tr('بنعلمك أول ما يوصلك السعر. ما تدفع إلا إذا وافقت.','We’ll show the price as soon as it arrives. You pay only if you approve.')}</p><Link className="font-semibold text-gold" href="/quotes">{tr('متابعة الطلب','Track request')}</Link></div>;
  const field = 'w-full rounded-xl border border-line dark:border-[#323b37] bg-white dark:bg-[#1a201e] px-3 py-3 mt-1.5';
  const label = 'text-sm font-medium text-graphite dark:text-[#e7ebe6]';
  return <form onSubmit={submit} className="space-y-4">
    <p className="text-[#4a5551] dark:text-gray-400">{tr('صاحب طابعة يرسل لك السعر، وتدفع بس إذا وافقت.','A printer owner sends you a price. You pay only if you approve it.')}</p>
    <fieldset disabled={busy} className="grid grid-cols-2 gap-3">
      <label className={label}>{tr('اللون','Color')}<input name="color" required maxLength={100} placeholder={tr('مثلًا: أسود','e.g. black')} className={field} /></label>
      <label className={label}>{tr('الكمية','Quantity')}<input name="quantity" type="number" inputMode="numeric" min="1" max="100" defaultValue="1" required className={field} /></label>
      <label className={label}>{tr('المدينة','City')}<input name="city" required maxLength={100} className={field} /></label>
      <label className={label}>{tr('الخامة','Material')}<select name="material" defaultValue="PLA" className={field}>{['PLA','PETG','ABS','Resin'].map(m => <option key={m}>{m}</option>)}</select></label>
      <details className="col-span-2">
        <summary className="cursor-pointer text-sm text-[#5d6864] dark:text-gray-400">{tr('إضافة ملاحظة أو مقاس (اختياري)','Add a note or size (optional)')}</summary>
        <textarea name="notes" rows={3} maxLength={2000} className={field} />
      </details>
      <button className="col-span-2 bg-gold text-white rounded-2xl py-4 font-bold hover:bg-[#bf3e0b] transition-colors">{busy ? tr('جارٍ الإرسال…','Sending…') : tr('اطلب السعر','Get a price')}</button>
    </fieldset>
    {error && <p role="alert" className="text-red-600">{error}</p>}
  </form>;
}
