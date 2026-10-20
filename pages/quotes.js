import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/LanguageContext';
import { getPublishableKey, paymentKeyIsConfigured, paymentUnavailableMessage } from '../lib/paymentConfig';

export default function Quotes() {
  const { user, profile, loading } = useAuth();
  const { lang } = useLanguage();
  const tr = (ar, en) => lang === 'en' ? en : ar;
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const lock = useRef(false);
  async function load() {
    const { data, error: problem } = await supabase.from('print_quotes').select('*, designs(title)').order('created_at', {ascending:false});
    if (problem) setError(tr('تعذر تحميل عروض الطباعة. حاول التحديث.','Unable to load quotes. Try refreshing.'));
    else setQuotes(data || []);
    setLoaded(true);
  }
  useEffect(() => { if (user) load(); }, [user]);
  useEffect(() => {
    if (!checkout || !ready || !window.Moyasar) return;
    window.Moyasar.init({element:'.quote-payment',amount:Math.round((Number(checkout.total_price)+Number(checkout.shipping_cost))*100),currency:'SAR',
      description:'Savana3D print quote',publishable_api_key:getPublishableKey(),
      callback_url:`${window.location.origin}/order-success?order_ids=${checkout.id}`,supported_networks:['mada','visa','mastercard'],methods:['creditcard']});
  }, [checkout, ready]);
  async function act(fn) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { await fn(); await load(); }
    catch (err) { setError(err.message || tr('تعذر تنفيذ العملية. حدّث الصفحة للتحقق من الحالة قبل إعادة المحاولة.','Unable to complete. Refresh to check the request status before retrying.')); }
    finally { lock.current=false; setBusy(false); }
  }
  async function post(url, body) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token || ''}`}, body:JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر تنفيذ العملية');
    return data;
  }
  async function payment(orderId) {
    if (!paymentKeyIsConfigured(getPublishableKey()) || !ready) { setError(paymentUnavailableMessage(lang)); return; }
    const {data, error: problem} = await supabase.from('orders').select('id,total_price,shipping_cost,payment_status,status').eq('id',orderId).eq('customer_id',user.id).single();
    if (problem) throw problem;
    if (data.payment_status === 'paid') { setError(tr('هذا الطلب مدفوع بالفعل. تابعه من لوحتك.','This order is already paid. Track it on your dashboard.')); return; }
    if (data.status !== 'pending_payment') throw new Error('Unavailable');
    setCheckout(data);
  }
  const field = 'w-full border rounded-xl px-3 py-2 mt-1';
  if (loading) return <p>{tr('جارٍ التحميل…','Loading…')}</p>;
  if (!user) return <Link href="/login">{tr('سجّل الدخول لمتابعة عروض الطباعة','Log in to view print quotes')}</Link>;
  const printer = profile?.role === 'printer';
  const statuses = {open:tr('بانتظار عرض طابع','Awaiting a printer'),offered:tr('عرض جاهز للمراجعة','Offer ready'),accepted:tr('تمت الموافقة — تابع الدفع أو الطلب','Approved — continue payment or track order'),cancelled:tr('ملغي','Cancelled')};
  return <div className="max-w-3xl mx-auto space-y-5">
    <Head><title>{tr('عروض الطباعة | Savana3D','Print quotes | Savana3D')}</title><meta name="robots" content="noindex,nofollow" /><link href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css" rel="stylesheet" /></Head>
    <Script src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js" onReady={() => setReady(true)} onError={() => setError(paymentUnavailableMessage(lang))} />
    <h1 className="text-2xl font-bold">{tr('عروض الطباعة','Print quotes')}</h1>
    <div className="flex gap-5"><Link href="/dashboard" className="underline">{tr('لوحتي','Dashboard')}</Link><button disabled={busy} onClick={load} className="underline">{tr('تحديث','Refresh')}</button></div>
    {error && <p role="alert" className="rounded-xl p-4 bg-red-50 text-red-700">{error}</p>}
    {checkout && <section className="bg-white p-5 border rounded-2xl"><h2 className="font-bold mb-3">{tr('الدفع للعرض الذي وافقت عليه','Pay for your approved quote')}</h2><p className="mb-3">{(Number(checkout.total_price)+Number(checkout.shipping_cost)).toFixed(2)} SAR</p><p className="text-xs text-gray-500 mb-3">{tr('بإتمام الدفع أنت توافق على ','By paying you agree to the ')}<a href="/terms" className="underline">{tr('الشروط والأحكام','terms')}</a>{tr(' و',' and ')}<a href="/refund" className="underline">{tr('سياسة الاسترجاع','refund policy')}</a>.</p><div className="quote-payment" /><button onClick={() => setCheckout(null)} className="underline mt-3">{tr('إغلاق','Close')}</button></section>}
    {!loaded ? <p>{tr('جارٍ تحميل الطلبات…','Loading requests…')}</p> : quotes.length===0 && <p>{tr('لا توجد طلبات تسعير حاليًا.','No quote requests yet.')}</p>}
    {quotes.map(q => <article key={q.id} className="bg-white border rounded-2xl p-5 space-y-4">
      <div><Link href={`/store/${q.design_id}`} className="font-bold text-lg underline">{q.designs?.title}</Link><p className="text-sm text-teal mt-2">{statuses[q.status]}</p></div>
      <p className="break-words">{q.quantity} × {q.material} · {q.color} · {q.city}</p><p className="whitespace-pre-wrap break-words">{q.notes}</p>
      {printer && ['open','offered'].includes(q.status) && <button disabled={busy} className="underline" onClick={()=>act(async()=>{const data=await post('/api/files/download',{quoteId:q.id});window.location.assign(data.url);})}>{tr('تحميل ملف التصميم للتقييم','Download design for assessment')}</button>}
      {q.product_price != null && <p>{tr('المنتج','Product')}: {q.product_price} SAR · {tr('الشحن','Shipping')}: {q.shipping_price} SAR · {tr('الإجمالي','Total')}: {(Number(q.product_price)+Number(q.shipping_price)).toFixed(2)} SAR</p>}
      {printer && q.status==='open' && <form onSubmit={e => { e.preventDefault(); const f=new FormData(e.currentTarget); act(async()=>{const {error:p}=await supabase.rpc('offer_print_quote',{p_id:q.id,p_product:Number(f.get('product')),p_shipping:Number(f.get('shipping'))});if(p)throw p;}); }}>
        <p className="text-sm text-gray-600 mb-3">{tr('تأكد من إمكانية تنفيذ المقاس والخامة واللون المطلوبة. أدخل السعر النهائي لكل الكمية؛ يتضمن نصيب المصمم ١٠٪. لا تبدأ الطباعة قبل تأكيد الدفع.','Confirm the requested size, material and color. Enter the final price for all units, including the designer’s 10% share. Do not print before payment is confirmed.')}</p>
        <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-3"><label>{tr('سعر المنتجات كاملًا (ريال)','Total product price (SAR)')}<input name="product" required min="0.01" max="100000" step="0.01" type="number" className={field} /></label><label>{tr('تكلفة الشحن (ريال)','Shipping (SAR)')}<input name="shipping" required min="0" max="10000" step="0.01" type="number" className={field} /></label><button className="bg-navy text-white p-3 rounded-xl sm:col-span-2">{tr('تأكيد إمكانية التنفيذ وإرسال السعر','Confirm availability and send quote')}</button></fieldset>
      </form>}
      {!printer && q.status==='offered' && <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);act(async()=>{const data=await post('/api/accept-quote',{id:q.id,name:f.get('name'),phone:f.get('phone'),address:f.get('address')});await payment(data.orderId);});}}>
        <fieldset disabled={busy} className="space-y-3"><label className="block">{tr('اسم المستلم','Recipient name')}<input name="name" required maxLength={200} className={field} /></label><label className="block">{tr('رقم التواصل','Phone')}<input name="phone" type="tel" required maxLength={30} className={field} /></label><label className="block">{tr('عنوان التوصيل في المدينة المحددة','Delivery address in the selected city')}<textarea name="address" required maxLength={1000} className={field} /></label><button className="bg-teal text-white p-3 rounded-xl w-full">{tr('أوافق على العرض — متابعة الدفع','Approve quote — continue to payment')}</button></fieldset>
      </form>}
      {!printer && q.status==='accepted' && <button disabled={busy} onClick={()=>act(()=>payment(q.order_id))} className="bg-navy text-white p-3 rounded-xl">{tr('متابعة الدفع','Continue payment')}</button>}
      {!printer && ['open','offered'].includes(q.status) && <button disabled={busy} onClick={()=>act(async()=>{const {error:p}=await supabase.rpc('decline_print_quote',{p_id:q.id});if(p)throw p;})} className="text-red-600 underline">{tr('إلغاء الطلب','Cancel request')}</button>}
    </article>)}
  </div>;
}
