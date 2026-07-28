import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t py-12 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                {t("nav.brand")}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h3 className="font-display font-semibold mb-4 text-foreground">{t("footer.resources_title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/verify" className="text-muted-foreground hover:text-primary transition-colors">{t("footer.link_verify")}</Link>
              </li>
              <li>
                <Link href="/learn" className="text-muted-foreground hover:text-primary transition-colors">{t("footer.link_lessons")}</Link>
              </li>
              <li>
                <Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">{t("footer.link_community")}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold mb-4 text-foreground">{t("footer.legal_title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">{t("footer.link_about")}</span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">{t("footer.link_privacy")}</span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">{t("footer.link_terms")}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{t("footer.not_detector")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
