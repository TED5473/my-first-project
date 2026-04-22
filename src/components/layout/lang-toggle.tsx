"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Minimal EN/HE toggle that flips the <html> dir/lang attributes. */
export function LangToggle() {
  const [lang, setLang] = useState<"en" | "he">("en");

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("ilcl.lang")) as
      | "en"
      | "he"
      | null;
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "he" ? "rtl" : "ltr");
    try {
      localStorage.setItem("ilcl.lang", lang);
    } catch {}
  }, [lang]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang((l) => (l === "en" ? "he" : "en"))}
      className="gap-1.5 text-xs uppercase tracking-wider"
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5" />
      {lang === "en" ? "EN" : "HE"}
    </Button>
  );
}
