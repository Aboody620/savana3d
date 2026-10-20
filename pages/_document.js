import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#ECEEE9" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('savana3d-theme');
                  if (theme !== 'light' && theme !== 'dark') theme = 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
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
