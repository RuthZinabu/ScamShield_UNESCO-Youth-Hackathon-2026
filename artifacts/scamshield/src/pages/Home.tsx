import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Shield, Brain, CheckCircle2, Search, BookOpen, Users, AlertTriangle, Quote, Loader2 } from "lucide-react";
import heroAbstract from "@assets/generated_images/hero-abstract.png";
import { useGetTrendingReports } from "@workspace/api-client-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthToken, getIsAuthenticated } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api-config";

interface PublicStats {
  confidencePercent: number;
  lessonsThisMonth: number;
  totalAnalyses: number;
}

async function fetchPublicStats(): Promise<PublicStats> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/public-stats`);
  if (!response.ok) throw new Error("Failed to load stats");
  return response.json() as Promise<PublicStats>;
}

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}k+`;
  return n.toString();
}

const SEVERITY_MAP: Record<string, "high" | "medium" | "low"> = {
  phishing: "high",
  investment: "high",
  romance: "high",
  job: "medium",
  shopping: "medium",
  news: "medium",
  scholarship: "low",
  other: "low",
};

interface TestimonialItem {
  id: number;
  name: string;
  role: string;
  quote: string;
  createdAt: string;
}

const testimonialsQueryKey = ["testimonials"];

async function fetchTestimonials(): Promise<TestimonialItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/testimonials`);
  if (!response.ok) {
    throw new Error("Failed to load testimonials");
  }
  return response.json();
}

async function createTestimonial(payload: { name: string; role: string; quote: string }): Promise<TestimonialItem> {
  const response = await fetch(`${API_BASE_URL}/api/testimonials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error((errorBody as { message?: string; error?: string }).message || (errorBody as { message?: string; error?: string }).error || "Unable to submit testimonial");
  }

  return response.json();
}

export default function Home() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isAuthenticated = getIsAuthenticated();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: testimonials = [], isLoading, isError, refetch } = useQuery({
    queryKey: testimonialsQueryKey,
    queryFn: fetchTestimonials,
  });

  const { data: publicStats, isError: statsError } = useQuery({
    queryKey: ["public-stats"],
    queryFn: fetchPublicStats,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });

  // Fallback values shown when the DB isn't connected yet
  const displayStats = publicStats ?? (statsError ? { confidencePercent: 85, lessonsThisMonth: 0, totalAnalyses: 0 } : null);

  const { data: trendingData } = useGetTrendingReports();

  const submitMutation = useMutation({
    mutationFn: createTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialsQueryKey });
      void refetch();
      setName("");
      setRole("");
      setQuote("");
      setFormError(null);
      setShowForm(false);
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const handleAddTestimonial = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      setLocation("/login?redirect=/");
      return;
    }

    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    const trimmedQuote = quote.trim();

    if (!trimmedName || trimmedQuote.length < 10) {
      setFormError(t("home.testimonials_quote") + " must be at least 10 characters long.");
      return;
    }

    setFormError(null);
    submitMutation.mutate({
      name: trimmedName,
      role: trimmedRole || t("home.testimonials_role_placeholder"),
      quote: trimmedQuote,
    });
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
                <Shield className="w-4 h-4" />
                <span>{t("home.badge")}</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.1] tracking-tight mb-6 text-foreground">
                {t("home.hero_line1")} <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  {t("home.hero_line2")}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                {t("home.hero_subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/verify">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-base h-14 px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl transition-all">
                    {t("home.cta_verify")} <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/learn">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base h-14 px-8 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-border hover:bg-white dark:hover:bg-slate-800 transition-all">
                    {t("home.cta_learn")}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[3rem] blur-3xl" />
              <img
                src={heroAbstract}
                alt="Abstract Trust Illustration"
                className="w-full h-auto object-cover rounded-[2rem] shadow-2xl relative z-10 glass-panel"
              />
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl z-20 border border-border flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 delay-500 duration-700">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("home.floating_label")}</p>
                  <p className="text-xs text-muted-foreground">{t("home.floating_sub")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary/5 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold font-display text-primary mb-2">
                {displayStats ? `${displayStats.confidencePercent}%` : "…"}
              </div>
              <p className="text-muted-foreground font-medium">{t("home.stat1_label")}</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold font-display text-secondary mb-2">
                {displayStats ? formatStat(displayStats.lessonsThisMonth) : "…"}
              </div>
              <p className="text-muted-foreground font-medium">{t("home.stat2_label")}</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold font-display text-primary mb-2">
                {displayStats ? formatStat(displayStats.totalAnalyses) : "…"}
              </div>
              <p className="text-muted-foreground font-medium">{t("home.stat3_label")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">{t("home.how_title")}</h2>
            <p className="text-muted-foreground text-lg">{t("home.how_subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: t("home.feature1_title"), desc: t("home.feature1_desc"), href: "/verify", linkText: t("home.feature1_link") },
              { icon: BookOpen, title: t("home.feature2_title"), desc: t("home.feature2_desc"), href: "/learn", linkText: t("home.feature2_link") },
              { icon: Users, title: t("home.feature3_title"), desc: t("home.feature3_desc"), href: "/community", linkText: t("home.feature3_link") },
            ].map((feature, i) => (
              <Card key={i} className="bg-card hover:shadow-xl transition-all duration-300 border-border/50 group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{feature.desc}</p>
                  <Link href={feature.href} className="inline-flex items-center text-primary font-semibold group/link">
                    {feature.linkText}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Common Scams */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">{t("home.trending_title")}</h2>
              <p className="text-muted-foreground">{t("home.trending_subtitle")}</p>
            </div>
            <Link href="/community">
              <Button variant="outline" className="gap-2 rounded-full">
                {t("home.see_all_reports")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingData?.topCategories && trendingData.topCategories.length > 0
              ? trendingData.topCategories.map((item, i) => {
                  const severity = SEVERITY_MAP[item.category] ?? "medium";
                  const severityColors =
                    severity === "high"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : severity === "medium"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
                  return (
                    <div key={i} className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="font-bold mb-4 line-clamp-2">{item.title}</h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.count} {t("home.scam_reports")}
                        </span>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${severityColors}`}>
                          {severity}
                        </span>
                      </div>
                    </div>
                  );
                })
              : /* Skeleton placeholders while loading or empty */
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm animate-pulse">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-4 h-4 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                    </div>
                    <div className="h-5 w-full rounded bg-muted mb-2" />
                    <div className="h-4 w-3/4 rounded bg-muted mb-4" />
                    <div className="flex justify-between">
                      <div className="h-3 w-16 rounded bg-muted" />
                      <div className="h-5 w-12 rounded bg-muted" />
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">{t("home.testimonials_title")}</h2>
              <p className="text-muted-foreground text-lg">{t("home.testimonials_subtitle")}</p>
            </div>
            <Button variant="outline" className="gap-2 rounded-full" onClick={() => {
              if (!isAuthenticated) {
                setLocation("/login?redirect=/");
                return;
              }
              setShowForm((current) => !current);
            }}>
              {t("home.testimonials_add")}
            </Button>
          </div>

          {showForm && (
            <Card className="mb-8 border-border/60 shadow-sm">
              <CardContent className="p-6">
                <form onSubmit={handleAddTestimonial} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="testimonial-name">
                      {t("home.testimonials_name")}
                    </label>
                    <Input
                      id="testimonial-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t("home.testimonials_name_placeholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="testimonial-role">
                      {t("home.testimonials_role")}
                    </label>
                    <Input
                      id="testimonial-role"
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                      placeholder={t("home.testimonials_role_placeholder")}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="testimonial-quote">
                      {t("home.testimonials_quote")}
                    </label>
                    <Textarea
                      id="testimonial-quote"
                      value={quote}
                      onChange={(event) => setQuote(event.target.value)}
                      placeholder={t("home.testimonials_quote_placeholder")}
                      className="min-h-[110px]"
                    />
                  </div>
                  {formError ? (
                    <div className="md:col-span-2 text-sm text-red-600">{formError}</div>
                  ) : null}
                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <Button type="submit" className="rounded-full" disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t("home.testimonials_submit")}
                    </Button>
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => setShowForm(false)}>
                      {t("home.testimonials_cancel")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading testimonials...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
              We couldn’t load testimonials right now. Please try again shortly.
            </div>
          ) : testimonials.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-center text-sm text-muted-foreground">
              No testimonials available yet. Be the first to share your experience.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="border-border/60 shadow-sm bg-card/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-5">
                      <Quote className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-6">“{testimonial.quote}”</p>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">{t("home.faq_title")}</h2>
            <p className="text-muted-foreground">{t("home.faq_subtitle")}</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">{t("home.faq1_q")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t("home.faq1_a")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">{t("home.faq2_q")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t("home.faq2_a")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">{t("home.faq3_q")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t("home.faq3_a")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
