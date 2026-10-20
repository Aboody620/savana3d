import Head from "next/head";
import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import PrintingVase from "../components/PrintingVase";
import { LOCAL_SHIPPING_COST, SHIPPING_COST } from "../lib/checkout";

export default function Home() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const steps = ar
    ? [
        { title: "اختر التصميم", text: "تصفّح المتجر واختر القطعة اللي تعجبك." },
        { title: "حدد اللون والجودة", text: "من الألوان المتوفرة، والسعر واضح قبل الدفع." },
        { title: "ادفع بأمان", text: "بمدى أو فيزا أو ماستركارد." },
        { title: "نطبعه ونوصله لك", text: "وتتابع حالة طلبك من صفحة طلباتي." },
      ]
    : [
        { title: "Pick a design", text: "Browse the store and choose the piece you like." },
        { title: "Choose color and quality", text: "From the colors in stock, with the price shown before you pay." },
        { title: "Pay securely", text: "With mada, Visa or Mastercard." },
        { title: "We print and deliver it", text: "Follow your order on My orders." },
      ];

  const reasons = ar
    ? [
        ["يُطبع لك خصيصًا", "كل قطعة تنطبع بعد طلبك باللون اللي اخترته، مو من مخزون قديم."],
        ["توصيل لبابك", "داخل المدينة المنورة نوصلها بأنفسنا، ولباقي المملكة عن طريق شركات الشحن مع رقم تتبع."],
        ["دفع آمن واسترجاع واضح", "الدفع عبر ميسر، ولو وصلتك القطعة فيها عيب نعيد طباعتها أو نرجع لك المبلغ."],
      ]
    : [
        ["Printed for you", "Every piece is printed after you order, in the color you chose."],
        ["Delivered to your door", "We deliver in Madinah ourselves, and ship across Saudi Arabia with tracking."],
        ["Secure payment, clear refunds", "Payments by Moyasar. A damaged piece gets reprinted or refunded."],
      ];

  const faqs = ar
    ? [
        { q: "كم ياخذ الطلب لين يوصلني؟", a: "نجهّز القطعة خلال المدة المكتوبة في صفحة المنتج، غالبًا من 3 إلى 5 أيام عمل. بعدها التوصيل داخل المدينة المنورة خلال يوم أو يومين، ولباقي المدن من 2 إلى 5 أيام." },
        { q: "كم سعر التوصيل؟", a: `${LOCAL_SHIPPING_COST} ريال داخل المدينة المنورة، و${SHIPPING_COST} ريال لباقي مدن المملكة.` },
        { q: "وش أسوي لو وصلتني القطعة مكسورة؟", a: "راسلنا خلال 7 أيام مع صور للقطعة، ونعيد طباعتها أو نرجع لك المبلغ حسب سياسة الاسترجاع." },
      ]
    : [
        { q: "How long until my order arrives?", a: "We prepare it within the time on the product page, usually 3–5 business days. Delivery takes 1–2 days in Madinah and 2–5 days elsewhere." },
        { q: "How much is delivery?", a: `${LOCAL_SHIPPING_COST} SAR in Madinah and ${SHIPPING_COST} SAR for other cities in Saudi Arabia.` },
        { q: "What if my piece arrives broken?", a: "Message us within 7 days with photos, and we reprint it or refund you under our refund policy." },
      ];

  return (
    <>
      <Head>
        <title>Savana3D سافانا | مجسمات وديكورات مطبوعة ثلاثية الأبعاد</title>
        <meta
          name="description"
          content="Savana3D متجر سعودي لمجسمات وديكورات وهدايا مطبوعة بتقنية ثلاثية الأبعاد. اختر التصميم واللون، ونطبعه لك خصيصًا ونوصله لبابك في المدينة المنورة وكل مدن المملكة."
        />
        <meta name="keywords" content="طباعة ثلاثية الأبعاد, طباعة 3D, مجسمات 3D, هدايا مطبوعة, ديكور مطبوع, المدينة المنورة, Savana3D, 3D printing Saudi Arabia" />
        <link rel="canonical" href="https://savana3d.com/" />
        <meta property="og:site_name" content="Savana3D" />
        <meta property="og:title" content="Savana3D | مجسمات مطبوعة ثلاثية الأبعاد" />
        <meta property="og:description" content="اختر التصميم واللون، ونطبعه لك خصيصًا ونوصله لبابك" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://savana3d.com/" />
        <meta property="og:image" content="https://savana3d.com/logo-lockup.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "Savana3D",
              alternateName: "سافانا",
              url: "https://savana3d.com",
              logo: "https://savana3d.com/logo.png",
              description: "متجر سعودي لمجسمات وديكورات مطبوعة بتقنية ثلاثية الأبعاد",
              address: { "@type": "PostalAddress", addressLocality: "المدينة المنورة", addressCountry: "SA" },
            }),
          }}
        />
      </Head>

      <section className="grid items-center gap-6 md:grid-cols-[1.15fr_0.85fr] pt-4 pb-14 md:pt-10 md:pb-20">
        <div>
          <h1 className="font-bold text-graphite dark:text-[#e7ebe6] text-[2.2rem] leading-[1.3] sm:text-5xl md:text-[3.3rem] md:leading-[1.25] max-w-[16ch]">
            {ar ? "مجسمات ثلاثية الأبعاد، تنطبع لك خصيصًا" : "3D-printed pieces, made just for you"}
          </h1>
          <p className="mt-5 text-lg text-[#4a5551] dark:text-gray-400 max-w-[46ch]">
            {ar
              ? "ديكورات وهدايا وأدوات مطبوعة بتقنية ثلاثية الأبعاد. اختر التصميم واللون، ونطبعه لك ونوصله لبابك."
              : "Decor, gifts and tools printed in 3D. Choose the design and the color, and we print it and deliver it to your door."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/store" className="bg-gold text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#bf3e0b] transition-colors">
              {ar ? "تصفّح المتجر" : "Browse the store"}
            </Link>
            <a href="#flow-title" className="px-6 py-3.5 rounded-xl font-semibold border-2 border-graphite/80 text-graphite dark:text-[#e7ebe6] dark:border-[#e7ebe6]/60 hover:bg-graphite hover:text-white transition-colors">
              {ar ? "كيف يوصلك طلبك" : "How it works"}
            </a>
          </div>
          <p className="mt-6 text-sm text-[#5d6864] dark:text-gray-500">
            {ar ? "توصيل داخل المدينة المنورة ولكل مدن المملكة · مدى وفيزا وماستركارد" : "Delivery in Madinah and across Saudi Arabia · mada, Visa, Mastercard"}
          </p>
        </div>
        <div className="order-first md:order-none text-graphite dark:text-[#e7ebe6]">
          <PrintingVase className="w-full max-w-[300px] md:max-w-[400px] mx-auto" />
        </div>
      </section>

      <section aria-labelledby="flow-title" className="py-14 border-t border-line dark:border-[#323b37] scroll-mt-24">
        <h2 id="flow-title" className="font-bold text-2xl sm:text-3xl text-graphite dark:text-[#e7ebe6] mb-10">
          {ar ? "كيف يوصلك طلبك" : "How your order reaches you"}
        </h2>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title}>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-bold text-gold text-lg w-10 h-10 rounded-full border-2 border-gold flex items-center justify-center shrink-0">
                  {ar ? "١٢٣٤"[i] : i + 1}
                </span>
                {i < steps.length - 1 && <span aria-hidden="true" className="hidden lg:block h-[2px] flex-1 bg-[repeating-linear-gradient(90deg,#d9480f_0_8px,transparent_8px_14px)] opacity-60" />}
              </div>
              <h3 className="font-semibold text-lg text-graphite dark:text-[#e7ebe6] mb-1.5">{step.title}</h3>
              <p className="text-[#4a5551] dark:text-gray-400 text-[0.95rem]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-3 pb-16">
        {reasons.map(([title, text], i) => (
          <div key={title} className={`rounded-3xl p-7 ${i === 1 ? "bg-graphite text-[#e7ebe6]" : "bg-[#f6d9c9] dark:bg-[#3a2418] text-graphite dark:text-[#f6e6dc]"}`}>
            <h2 className="font-bold text-xl mb-2">{title}</h2>
            <p className={i === 1 ? "text-[#b9c2bd]" : "text-[#4d3426] dark:text-[#e4c9b9]"}>{text}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="faq-title" className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] py-14 border-t border-line dark:border-[#323b37]">
        <div>
          <h2 id="faq-title" className="font-bold text-2xl sm:text-3xl text-graphite dark:text-[#e7ebe6] mb-4">
            {ar ? "أسئلة شائعة" : "Common questions"}
          </h2>
          <p className="text-[#4a5551] dark:text-gray-400 text-[0.95rem] max-w-[40ch]">
            {ar
              ? "Savana3D متجر سعودي من المدينة المنورة، يصمم ويطبع مجسمات وديكورات بتقنية ثلاثية الأبعاد."
              : "Savana3D is a Saudi store from Madinah that designs and prints 3D decor and gifts."}
          </p>
        </div>
        <div className="divide-y divide-line dark:divide-[#323b37] border-y border-line dark:border-[#323b37]">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-graphite dark:text-[#e7ebe6]">
                <span>{faq.q}</span>
                <span aria-hidden="true" className="text-gold text-xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[#4a5551] dark:text-gray-400 max-w-[60ch]">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })),
          }),
        }}
      />
    </>
  );
}
