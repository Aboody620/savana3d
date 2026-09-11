import Head from "next/head";
import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import { getT } from "../lib/translations";
import WaterHero from "../components/WaterHero";

export default function Home() {
  const { lang } = useLanguage();
  const t = getT(lang);

  const faqs =
    lang === "ar"
      ? [
          {
            q: "كيف أطبع تصميمي ثلاثي الأبعاد بدون ما أملك طابعة؟",
            a: "ارفع ملف التصميم (STL) على Savana3D، واختر صاحب طابعة قريب منك من الشبكة، وهو يطبعه ويوصله لك.",
          },
          {
            q: "هل أقدر أبيع تصاميمي ثلاثية الأبعاد على المنصة؟",
            a: "إي، سجّل كمصمم وارفع تصاميمك الجاهزة بمتجر Savana3D، وتاخذ نسبتك من كل عملية بيع.",
          },
          {
            q: "كيف أربح كصاحب طابعة ثلاثية الأبعاد؟",
            a: "سجّل كصاحب طابعة، واقبل طلبات الطباعة اللي تناسب وقتك الفاضي، وتاخذ مقابل كل طلب تنفذه.",
          },
        ]
      : [
          {
            q: "How can I print my 3D design without owning a printer?",
            a: "Upload your STL file to Savana3D, choose a nearby printer owner from the network, and they'll print and deliver it to you.",
          },
          {
            q: "Can I sell my 3D designs on the platform?",
            a: "Yes, register as a designer and upload your ready designs to the Savana3D store to earn a share of every sale.",
          },
          {
            q: "How do I earn as a 3D printer owner?",
            a: "Register as a printer owner, accept printing requests that fit your free time, and earn for every order you fulfill.",
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

      <div className="text-center">
        <WaterHero className="h-[480px] sm:h-[560px] flex items-center justify-center rounded-b-3xl">
          <div className="px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-lockup.png"
              alt="Savana3D"
              className="h-28 sm:h-36 mx-auto mb-6 drop-shadow-lg"
            />

            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 drop-shadow-md">
              {t("home_title")}
            </h1>
            <p className="text-base sm:text-lg text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-sm">
              {t("home_subtitle")}
            </p>

            <div className="flex justify-center gap-4">
              <Link
                href="/store"
                className="bg-white text-navy px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                {t("home_browse_store")}
              </Link>
              <Link
                href="/signup"
                className="bg-gold text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                {t("home_start_now")}
              </Link>
            </div>
          </div>
        </WaterHero>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-16 px-4 max-w-5xl mx-auto text-right">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-navy mb-2">{t("home_customer_title")}</h3>
            <p className="text-gray-600 text-sm">{t("home_customer_desc")}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-teal mb-2">{t("home_designer_title")}</h3>
            <p className="text-gray-600 text-sm">{t("home_designer_desc")}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-gold mb-2">{t("home_printer_title")}</h3>
            <p className="text-gray-600 text-sm">{t("home_printer_desc")}</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 mb-16 text-right">
          <h2 className="text-xl sm:text-2xl font-bold text-navy mb-4">
            {lang === "ar" ? "منصة طباعة ثلاثية الأبعاد في السعودية" : "3D Printing Platform in Saudi Arabia"}
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            {lang === "ar"
              ? "Savana3D هي منصة سعودية متخصصة في خدمات الطباعة الثلاثية الأبعاد، تربط بين ثلاثة أطراف: العميل اللي يبغى يطبع تصميم، المصمم اللي يبيع تصاميمه الجاهزة، وصاحب الطابعة اللي ينفّذ الطلب. سواء كنت تدور على مكان يطبع لك تصميمك الخاص، تبغى تشتري تصميم 3D جاهز من متجرنا، أو عندك طابعة ثلاثية الأبعاد وتبغى تربح من وقتها الفاضي — Savana3D يجمعكم بشبكة واحدة، بدون ما تحتاج تملك طابعة بنفسك."
              : "Savana3D is a Saudi platform for 3D printing services, connecting customers who want to print a design, designers who sell ready-made 3D designs, and printer owners who fulfill the orders. Whether you're looking to print your own design, buy a ready 3D design from our store, or own a 3D printer and want to earn from your idle time — Savana3D brings you all together in one network."}
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-4 mb-16 text-right">
          <h2 className="text-xl sm:text-2xl font-bold text-navy mb-4">
            {lang === "ar" ? "أسئلة شائعة" : "Frequently Asked Questions"}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl shadow-sm p-4">
                <summary className="font-bold text-navy cursor-pointer">{faq.q}</summary>
                <p className="text-gray-600 text-sm mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

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
      </div>
    </>
  );
}
