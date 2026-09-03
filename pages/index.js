import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Savana3D</title>
      </Head>

      <div className="text-center py-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-lockup.svg"
          alt="Savana3D"
          className="h-40 mx-auto mb-8"
        />

        <h1 className="text-4xl font-black text-navy mb-4">
          مع Savana3D اطبع أي تصميم ثلاثي الأبعاد، بدون ما تملك طابعة
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          ارفع تصميمك أو اختر من متجرنا، وشبكة من أصحاب الطابعات الجاهزين
          بتطبعه وتوصله لك.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/store"
            className="bg-navy text-white px-6 py-3 rounded-lg font-bold hover:opacity-90"
          >
            تصفّح المتجر
          </Link>
          <Link
            href="/signup"
            className="bg-teal text-white px-6 py-3 rounded-lg font-bold hover:opacity-90"
          >
            ابدأ الآن
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-right">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-navy mb-2">للزبون</h3>
            <p className="text-gray-600 text-sm">
              ارفع تصميمك الخاص أو اختر من المتجر، واطلب طباعته وتوصيله لباب
              بيتك.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-teal mb-2">للمصمم</h3>
            <p className="text-gray-600 text-sm">
              ارفع تصاميمك وبيعها للزبائن، وخذ نسبتك من كل عملية بيع.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-gold mb-2">لصاحب الطابعة</h3>
            <p className="text-gray-600 text-sm">
              استغل وقت طابعتك الفاضي، اقبل طلبات طباعة، واربح مقابل كل طلب
              تنفّذه.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
