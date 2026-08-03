import { Link, useLocation } from "wouter";
import { ShieldCheck, Search, BookOpen, Users, MessageSquare, LayoutDashboard, LogOut } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { clearAuthSession, getIsAuthenticated } from "@/lib/auth";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const isAuthenticated = getIsAuthenticated();

  const navItems = [
    { href: "/verify", label: t("nav.verify"), icon: Search },
    { href: "/learn", label: t("nav.learn"), icon: BookOpen },
    { href: "/community", label: t("nav.community"), icon: Users },
    { href: "/chat", label: t("nav.aiChat"), icon: MessageSquare },
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-xl group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                {t("nav.brand")}
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  clearAuthSession();
                  setLocation("/");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
