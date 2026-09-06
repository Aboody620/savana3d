import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        {/* يطبّق المظهر الداكن فورًا قبل عرض الصفحة، عشان نتجنب
            وميض لحظي بالمظهر الفاتح قبل ما يشتغل الكود بجافاسكربت */}
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
