import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "savana3d-lang";

const LanguageContext = createContext({
  lang: "ar",
  dir: "rtl",
  setLang: () => {},
});

function applyLang(next) {
  const dir = next === "en" ? "ltr" : "rtl";
  document.documentElement.lang = next;
  document.documentElement.dir = dir;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("ar");

  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // تجاهل لو localStorage غير متاح
    }
    const initial = stored === "en" || stored === "ar" ? stored : "ar";
    setLangState(initial);
    applyLang(initial);
  }, []);

  function setLang(next) {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // تجاهل لو فشل الحفظ
    }
    applyLang(next);
  }

  const dir = lang === "en" ? "ltr" : "rtl";

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
