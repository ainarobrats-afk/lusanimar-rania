import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n/LanguageContext";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: "tet", label: "🇹🇱 Tetun" },
    { code: "id", label: "🇮🇩 Indonesia" },
    { code: "pt", label: "🇵🇹 Portugis" },
    { code: "en", label: "🇬🇧 English" },
  ];

  const getActiveFlag = () => {
    const lang = languages.find((l) => l.code === language);
    return lang ? lang.label.split(" ")[0] : "🌍";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800/70">
          <span className="text-lg">{getActiveFlag()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-900/95 backdrop-blur-xl border-slate-700/50">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as any)}
            className={`cursor-pointer ${language === lang.code ? "text-blue-300" : "text-slate-200"}`}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
