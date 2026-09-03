import Head from "next/head";
import "../styles/globals.css";
import Navbar from "../components/Navbar";

export default function App({ Component, pageProps }) {
  return (
    <div dir="rtl">
      <Head>
        <title>Savana3D</title>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </Head>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
