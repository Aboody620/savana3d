import Head from "next/head";
import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import PrintingVase from "../components/PrintingVase";

export default function Home() {
  const { lang } = useLanguage();

  const ar = lang === "ar";
  const steps = ar
    ? [
        { title: "اختر تصميم أو ارفع ملفك", text: "حدد الخامة واللون والكمية ومدينة التوصيل." },
        { title: "صاحب طابعة يسعّره", text: "تشوف سعر المنتج والشحن قبل أي دفع." },
        { title: "توافق وتدفع", text: "بمدى أو فيزا أو ماستركارد، والدفع محمي." },
        { title: "يطبعه ويشحنه لك", text: "تتابع الشحنة برقم تتبع من لوحتك." },
      ]
    : [
        { title: "Pick a design or upload yours", text: "Choose material, color, quantity and delivery city." },
        { title: "A printer owner quotes it", text: "See the product and shipping price before paying anything." },
        { title: "Approve and pay", text: "With mada, Visa or Mastercard through a secure checkout." },
        { title: "Printed and shipped to you", text: "Follow the shipment with a tracking number on your dashboard." },
      ];

  const faqs =
    lang === "ar"
      ? [
          {
            q: "كيف أطبع تصميمي ثلاثي الأبعاد بدون ما أملك طابعة؟",
            a: "اختر تصميم من المتجر أو ارفع ملفك (STL أو OBJ أو 3MF)، وصاحب طابعة يرسل لك السعر. توافق وتدفع، وهو يطبعه ويشحنه لك.",
          },
          {
            q: "هل أقدر أبيع تصاميمي ثلاثية الأبعاد على المنصة؟",
            a: "إي، سجّل كمصمم وارفع تصاميمك مع صورها، وتاخذ ١٠٪ من قيمة المنتج في كل طلب مكتمل.",
          },
          {
            q: "كيف أربح كصاحب طابعة ثلاثية الأبعاد؟",
            a: "سجّل كصاحب طابعة، وسعّر الطلبات اللي تناسبك. تبدأ الطباعة بعد ما يدفع الزبون، وتاخذ قيمة الطلب اللي حددتها.",
          },
        ]
      : [
          {
            q: "How can I print my 3D design without owning a printer?",
            a: "Pick a design from the store or upload your file (STL, OBJ or 3MF). A printer owner sends you a price; once you approve and pay, they print and ship it.",
          },
          {
            q: "Can I sell my 3D designs on the platform?",
            a: "Yes. Join as a designer, upload your designs with photos, and earn 10% of the product value on every completed order.",
          },
          {
            q: "How do I earn as a 3D printer owner?",
            a: "Join as a printer owner and quote the requests that suit you. You print after the customer pays and earn the price you set.",
          },
        ];

  return (
    <>
      <Head>
        <title>Savana3D سافانا | طباعة ثلاثية الأبعاد بالسعودية — اطبع أو بيع تصاميمك 3D</title>
        <meta
          name="description"
          content="Savana3D منصة سعودية لخدمات الطباعة الثلاثية الأبعاد (3D Printing). ارفع تصميمك واطلب طباعته، أو اختر تصميمًا جاهزًا من متجرنا، أو انضم كصاحب طابعة واربح من طباعة طلبات العملاء. شبكة طابعات 3D بالسعودية توصلك بأقرب مقدم خدمة."
        />
        <meta
          name="keywords"
          content="طباعة ثلاثية الأبعاد, طباعة 3D, طباعة تصاميم 3D, بيع تصاميم 3D, اطبع تصميمي, طابعة 3D السعودية, Savana3D, 3D printing Saudi Arabia"
        />
        <link rel="canonical" href="https://savana3d.com/" />
        <meta property="og:site_name" content="Savana3D" />
        <meta property="og:title" content="Savana3D | طباعة ثلاثية الأبعاد بالسعودية" />
        <meta property="og:description" content="اطبع أي تصميم ثلاثي الأبعاد بدون ما تملك طابعة — أو اربح كصاحب طابعة" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://savana3d.com/" />
        <meta property="og:image" content="https://savana3d.com/logo-lockup.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Savana3D",
              alternateName: "سافانا",
              url: "https://savana3d.com",
              logo: "https://savana3d.com/logo.png",
              description: "منصة سعودية لخدمات الطباعة الثلاثية الأبعاد تربط العملاء بشبكة من أصحاب الطابعات والمصممين",
            }),
          }}
        />
      </Head>

      {/* الواجهة: عنوان كبير ومزهرية تنطبع */}
      <section className="grid items-center gap-6 md:grid-cols-[1.15fr_0.85fr] pt-4 pb-14 md:pt-10 md:pb-20">
        <div>
          <h1 className="font-bold text-graphite dark:text-[#e7ebe6] text-[2.2rem] leading-[1.3] sm:text-5xl md:text-[3.3rem] md:leading-[1.25] max-w-[16ch]">
            {ar ? "اطبع أي تصميم ثلاثي الأبعاد، بدون ما تملك طابعة" : "Print any 3D design without owning a printer"}
          </h1>
          <p className="mt-5 text-lg text-[#4a5551] dark:text-gray-400 max-w-[46ch]">
            {ar
              ? "اختر تصميم من المتجر أو ارفع ملفك، وصاحب طابعة قريب منك يسعّره ويطبعه ويوصله لبابك."
              : "Pick a design from the store or upload your own file. A printer owner near you quotes it, prints it, and ships it to your door."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/store" className="bg-gold text-white px-6 py-3.5 rounded-xl font-display font-semibold hover:bg-[#bf3e0b] transition-colors">
              {ar ? "تصفّح التصاميم" : "Browse designs"}
            </Link>
            <Link href="/custom-order" className="px-6 py-3.5 rounded-xl font-display font-semibold border-2 border-graphite/80 text-graphite dark:text-[#e7ebe6] dark:border-[#e7ebe6]/60 hover:bg-graphite hover:text-white transition-colors">
              {ar ? "ارفع ملفك" : "Upload your file"}
            </Link>
          </div>
          <p className="mt-6 text-sm text-[#5d6864] dark:text-gray-500">
            {ar ? "تدفع بعد ما توافق على السعر · مدى وفيزا وماستركارد" : "You pay only after approving the price · mada, Visa, Mastercard"}
          </p>
        </div>
        <div className="order-first md:order-none text-graphite dark:text-[#e7ebe6]">
          <PrintingVase className="w-full max-w-[300px] md:max-w-[400px] mx-auto" />
        </div>
      </section>

      {/* مسار الطلب — تسلسل حقيقي */}
      <section aria-labelledby="flow-title" className="py-14 border-t border-line dark:border-[#323b37]">
        <h2 id="flow-title" className="font-display font-bold text-2xl sm:text-3xl text-graphite dark:text-[#e7ebe6] mb-10">
          {ar ? "كيف يوصلك طلبك" : "How your order reaches you"}
        </h2>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative ps-0">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display font-bold text-gold text-lg w-10 h-10 rounded-full border-2 border-gold flex items-center justify-center shrink-0">
                  {ar ? "١٢٣٤"[i] : i + 1}
                </span>
                {i < steps.length - 1 && <span aria-hidden="true" className="hidden lg:block h-[2px] flex-1 bg-[repeating-linear-gradient(90deg,#d9480f_0_8px,transparent_8px_14px)] opacity-60" />}
              </div>
              <h3 className="font-display font-semibold text-lg text-graphite dark:text-[#e7ebe6] mb-1.5">{step.title}</h3>
              <p className="text-[#4a5551] dark:text-gray-400 text-[0.95rem]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* للمصممين ولأصحاب الطابعات */}
      <section className="grid gap-4 md:grid-cols-[1fr_1fr] pb-16">
        <div className="rounded-3xl bg-[#f6d9c9] dark:bg-[#3a2418] p-7 sm:p-9 flex flex-col">
          <p className="text-sm font-semibold text-[#8a3208] dark:text-[#f3a77f] mb-3">{ar ? "للمصممين" : "For designers"}</p>
          <h2 className="font-display font-bold text-2xl sm:text-[1.75rem] text-graphite dark:text-[#f6e6dc] mb-3">
            {ar ? "ارفع تصميمك مرة، واكسب من كل طباعة" : "Upload once, earn on every print"}
          </h2>
          <p className="text-[#4d3426] dark:text-[#e4c9b9] mb-6 max-w-[44ch]">
            {ar
              ? "تاخذ ١٠٪ من قيمة المنتج في كل طلب مكتمل. ملفك محمي، وما يحمّله إلا الطابع اللي استلم طلب مدفوع."
              : "You earn 10% of the product value on every completed order. Your file stays private; only the printer of a paid order can download it."}
          </p>
          <Link href="/signup" className="mt-auto self-start bg-graphite text-white px-5 py-3 rounded-xl font-display font-semibold hover:opacity-90">
            {ar ? "سجّل كمصمم" : "Join as a designer"}
          </Link>
        </div>
        <div className="rounded-3xl bg-graphite text-[#e7ebe6] p-7 sm:p-9 flex flex-col relative overflow-hidden">
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 opacity-[0.12] bg-[repeating-linear-gradient(0deg,#e7ebe6_0_3px,transparent_3px_9px)]" />
          <p className="text-sm font-semibold text-[#f3a77f] mb-3">{ar ? "لأصحاب الطابعات" : "For printer owners"}</p>
          <h2 className="font-display font-bold text-2xl sm:text-[1.75rem] mb-3">
            {ar ? "عندك طابعة؟ خلها تشتغل لك" : "Own a printer? Put it to work"}
          </h2>
          <p className="text-[#b9c2bd] mb-6 max-w-[44ch]">
            {ar
              ? "تشوف طلبات التسعير، تحمّل الملف وتقيّمه، وترسل سعرك. ما تبدأ الطباعة إلا بعد ما يدفع الزبون، وشركة الشحن تستلم من عندك."
              : "See quote requests, download and assess the file, and send your price. You print only after the customer pays, and the courier picks up from you."}
          </p>
          <Link href="/signup" className="relative mt-auto self-start bg-gold text-white px-5 py-3 rounded-xl font-display font-semibold hover:bg-[#bf3e0b]">
            {ar ? "سجّل كصاحب طابعة" : "Join as a printer owner"}
          </Link>
        </div>
      </section>

      {/* أسئلة شائعة */}
      <section aria-labelledby="faq-title" className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] py-14 border-t border-line dark:border-[#323b37]">
        <div>
          <h2 id="faq-title" className="font-display font-bold text-2xl sm:text-3xl text-graphite dark:text-[#e7ebe6] mb-4">
            {ar ? "أسئلة شائعة" : "Common questions"}
          </h2>
          <p className="text-[#4a5551] dark:text-gray-400 text-[0.95rem] max-w-[40ch]">
            {ar
              ? "Savana3D منصة سعودية للطباعة الثلاثية الأبعاد، تجمع الزبون والمصمم وصاحب الطابعة في شبكة وحدة."
              : "Savana3D is a Saudi 3D printing platform that brings customers, designers and printer owners into one network."}
          </p>
        </div>
        <div className="divide-y divide-line dark:divide-[#323b37] border-y border-line dark:border-[#323b37]">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-display font-semibold text-graphite dark:text-[#e7ebe6]">
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
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: { "@type": "Answer", text: faq.a },
              })),
            }),
          }}
        />
    </>
  );
}
