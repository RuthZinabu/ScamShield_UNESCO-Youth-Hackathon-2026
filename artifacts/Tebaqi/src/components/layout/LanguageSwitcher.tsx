import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGUAGES } from '@/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <Select
      value={i18n.language}
      onValueChange={(lng) => i18n.changeLanguage(lng)}
    >
      <SelectTrigger className="h-9 w-auto gap-1.5 border-border/50 bg-background/50 text-sm font-medium px-2.5 min-w-[120px]">
        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{currentLang.nativeLabel}</span>
      </SelectTrigger>
      <SelectContent align="end">
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span className="font-medium">{lang.nativeLabel}</span>
              {lang.nativeLabel !== lang.label && (
                <span className="text-muted-foreground text-xs">{lang.label}</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
