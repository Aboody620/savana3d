import Head from "next/head";
import Link from "next/link";
import { BUSINESS } from "../lib/businessInfo";

const LINKS = [
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/refund", label: "الاسترجاع والاستبدال" },
];

// قالب موحّد لصفحات السياسات: عنوان، تاريخ التحديث، أقسام، وروابط للسياسات الثانية
export default function PolicyPage({ path, title, intro, sections }) {
  return (
    <article dir="rtl" lang="ar" className="max-w-3xl mx-auto">
      <Head>
        <title>{`${title} | Savana3D`}</title>
        <meta name="description" content={intro} />
        <link rel="canonical" href={`https://savana3d.com${path}`} />
      </Head>

      <nav aria-label="السياسات" className="flex flex-wrap gap-1 mb-8">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={l.href === path ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              l.href === path
                ? "bg-graphite text-white dark:bg-[#F2F2EF] dark:text-[#0E0E0D]"
                : "text-graphite dark:text-[#F2F2EF] hover:bg-graphite/5"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <h1 className="font-bold text-3xl sm:text-4xl text-graphite dark:text-[#F2F2EF] mb-3">{title}</h1>
      <p className="text-sm text-[#8A8A84] mb-6">آخر تحديث: {BUSINESS.updated}</p>
      <p className="text-lg text-[#55554F] dark:text-gray-300 mb-10 max-w-[65ch]">{intro}</p>

      <div className="space-y-9">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-bold text-xl text-graphite dark:text-[#F2F2EF] mb-3">{s.title}</h2>
            {s.text && <p className="text-[#3A3A36] dark:text-gray-300 max-w-[65ch] leading-8">{s.text}</p>}
            {s.items && (
              <ul className="list-disc ps-6 space-y-2 text-[#3A3A36] dark:text-gray-300 max-w-[65ch] leading-8">
                {s.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-line dark:border-[#2E2E2B] p-6">
        <h2 className="font-bold text-lg text-graphite dark:text-[#F2F2EF] mb-3">بيانات المتجر والتواصل</h2>
        <dl className="grid sm:grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[#3A3A36] dark:text-gray-300">
          <dt className="font-semibold">اسم المتجر</dt><dd>{BUSINESS.name} ({BUSINESS.nameAr})</dd>
          <dt className="font-semibold">وثيقة العمل الحر</dt><dd dir="ltr" className="text-right">{BUSINESS.freelanceDocument}</dd>
          <dt className="font-semibold">توثيق المركز السعودي للأعمال</dt><dd dir="ltr" className="text-right">{BUSINESS.businessCenterAuth}</dd>
          <dt className="font-semibold">البريد الإلكتروني</dt>
          <dd><a href={`mailto:${BUSINESS.email}`} className="text-gold font-semibold break-all">{BUSINESS.email}</a></dd>
          <dt className="font-semibold">الدولة</dt><dd>{BUSINESS.country}</dd>
        </dl>
      </section>
    </article>
  );
}
