import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        {/* يطبّق المظهر الداكن واللغة فورًا قبل عرض الصفحة، عشان نتجنب
            وميض لحظي بإعدادات افتراضية خاطئة قبل ما يشتغل الكود بجافاسكربت */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('savana3d-theme');
                  if (theme !== 'light' && theme !== 'dark') theme = 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
                try {
                  var lang = localStorage.getItem('savana3d-lang');
                  if (lang !== 'en' && lang !== 'ar') lang = 'ar';
                  document.documentElement.lang = lang;
                  document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
                } catch (e) {
                  document.documentElement.lang = 'ar';
                  document.documentElement.dir = 'rtl';
                }
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
