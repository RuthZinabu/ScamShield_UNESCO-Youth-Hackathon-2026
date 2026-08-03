import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  useListReports,
  useCreateReport,
  useGetTrendingReports,
  useUpvoteReport,
  getListReportsQueryKey,
  getGetTrendingReportsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Search,
  Flame,
  MapPin,
  MessageSquareWarning,
  ArrowUp,
  Plus,
  Loader2,
  ShieldAlert,
  Globe,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ListReportsCategory, Report } from "@workspace/api-client-react";
import { LANGUAGES } from "@/i18n";
import { Link, useLocation } from "wouter";
import { getIsAuthenticated } from "@/lib/auth";

const reportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details to help others"),
  category: z.enum([
    "job",
    "investment",
    "shopping",
    "news",
    "scholarship",
    "phishing",
    "romance",
    "other",
  ]),
  country: z.string().optional(),
  language: z.string().optional(),
  evidenceUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export default function Community() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ListReportsCategory | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  // Track optimistic upvote state per report id
  const [upvotedIds, setUpvotedIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const isAuthenticated = getIsAuthenticated();

  const { data: reports, isLoading } = useListReports({
    search: search || undefined,
    category:
      category !== ("all" as any) ? (category as ListReportsCategory) : undefined,
  });

  const { data: trending } = useGetTrendingReports();
  const createReport = useCreateReport();
  const upvoteReport = useUpvoteReport();

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "phishing",
      country: "",
      language: "",
      evidenceUrl: "",
    },
  });

  const onSubmit = (values: z.infer<typeof reportSchema>) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    // Normalise empty strings → omit field
    const payload = {
      ...values,
      evidenceUrl: values.evidenceUrl || undefined,
      language: values.language || undefined,
      country: values.country || undefined,
    };
    createReport.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({
            title: t("community.toast_submitted"),
            description: t("community.toast_submitted_desc"),
          });
          setIsDialogOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
          queryClient.invalidateQueries({
            queryKey: getGetTrendingReportsQueryKey(),
          });
        },
      }
    );
  };

  const handleUpvote = (reportId: number) => {
    if (upvotedIds.has(reportId)) return; // prevent double-click
    setUpvotedIds((prev) => new Set(prev).add(reportId));
    upvoteReport.mutate(
      { id: reportId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        },
        onError: () => {
          // Revert optimistic mark on failure
          setUpvotedIds((prev) => {
            const next = new Set(prev);
            next.delete(reportId);
            return next;
          });
        },
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-foreground mb-4">
            {t("community.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t("community.subtitle")}
          </p>
        </div>

        {isAuthenticated ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg gap-2 shrink-0">
                <Plus className="w-5 h-5" /> {t("community.report_btn")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("community.dialog_title")}</DialogTitle>
                <DialogDescription>{t("community.dialog_desc")}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 pt-4"
                >
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("community.field_title")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("community.field_title_placeholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("community.field_category")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "community.field_category_placeholder"
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="phishing">
                            {t("community.cat_phishing")}
                          </SelectItem>
                          <SelectItem value="job">
                            {t("community.cat_job")}
                          </SelectItem>
                          <SelectItem value="investment">
                            {t("community.cat_investment")}
                          </SelectItem>
                          <SelectItem value="shopping">
                            {t("community.cat_shopping")}
                          </SelectItem>
                          <SelectItem value="news">
                            {t("community.cat_news")}
                          </SelectItem>
                          <SelectItem value="romance">
                            {t("community.cat_romance")}
                          </SelectItem>
                          <SelectItem value="scholarship">
                            {t("community.cat_scholarship")}
                          </SelectItem>
                          <SelectItem value="other">
                            {t("community.cat_other")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("community.field_language")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "community.field_language_placeholder"
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.nativeLabel} — {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Evidence URL */}
                <FormField
                  control={form.control}
                  name="evidenceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("community.field_evidence_url")}{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          ({t("community.optional")})
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/screenshot.png"
                          type="url"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("community.field_description")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("community.field_description_placeholder")}
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createReport.isPending}
                >
                  {createReport.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}{" "}
                  {t("community.submit_report")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="flex flex-col items-end gap-3">
          <Button
            size="lg"
            className="rounded-full shadow-lg gap-2 shrink-0"
            onClick={() => setShowAuthPrompt(true)}
          >
            <Plus className="w-5 h-5" /> {t("community.report_btn")}
          </Button>
          {showAuthPrompt && (
            <div className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">Please log in first to report a threat.</p>
              <Button
                variant="outline"
                className="mt-3 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                onClick={() => setLocation("/login?redirect=/community")}
              >
                Log In
              </Button>
            </div>
          )}
        </div>
      )}
    </div>

    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Main Feed */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("community.search_placeholder")}
                className="pl-9 bg-background border-none shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              onValueChange={(v) => setCategory(v as any)}
              defaultValue="all"
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-background border-none shadow-sm">
                <SelectValue placeholder={t("community.cat_all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("community.cat_all")}</SelectItem>
                <SelectItem value="phishing">
                  {t("community.cat_phishing")}
                </SelectItem>
                <SelectItem value="job">{t("community.cat_job")}</SelectItem>
                <SelectItem value="investment">
                  {t("community.cat_investment")}
                </SelectItem>
                <SelectItem value="shopping">
                  {t("community.cat_shopping")}
                </SelectItem>
                <SelectItem value="news">{t("community.cat_news")}</SelectItem>
                <SelectItem value="romance">
                  {t("community.cat_romance")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
              ))
            ) : reports?.length === 0 ? (
              <div className="text-center py-20 bg-background border border-dashed rounded-xl">
                <MessageSquareWarning className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">{t("community.no_reports")}</p>
              </div>
            ) : (
              reports?.map((report: Report) => {
                const hasUpvoted = upvotedIds.has(report.id);
                return (
                  <Card
                    key={report.id}
                    className="hover:shadow-md transition-shadow group"
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Upvote column */}
                        <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpvote(report.id)}
                            disabled={hasUpvoted}
                            className={`h-8 w-8 rounded-full transition-colors ${
                              hasUpvoted
                                ? "text-primary bg-primary/10 cursor-default"
                                : "text-muted-foreground hover:text-primary"
                            }`}
                            title={hasUpvoted ? "Upvoted" : "Upvote this report"}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <span
                            className={`font-semibold text-sm tabular-nums ${
                              hasUpvoted ? "text-primary" : ""
                            }`}
                          >
                            {hasUpvoted
                              ? report.upvoteCount + 1
                              : report.upvoteCount}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                              {report.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(report.createdAt),
                                { addSuffix: true }
                              )}
                            </span>
                            {report.country && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                                <MapPin className="w-3 h-3" /> {report.country}
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                            {report.title}
                          </h3>

                          {/* Language meta */}
                          {report.language && (
                            <div className="flex flex-wrap gap-3 mb-2">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Globe className="w-3 h-3 shrink-0" />
                                {LANGUAGES.find(
                                  (l) => l.code === report.language
                                )?.nativeLabel ?? report.language}
                              </span>
                            </div>
                          )}

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {report.description}
                          </p>

                          {/* Evidence link */}
                          {report.evidenceUrl && (
                            <a
                              href={report.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />{" "}
                              {t("community.view_evidence")}
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-slate-50 dark:bg-slate-900 border-border">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />{" "}
                {t("community.trending_title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {trending?.topCategories.map((cat: { category: string; count: number }, i: number) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">
                    {cat.category}
                  </span>
                  <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                    {cat.count} {t("community.reports_count")}
                  </span>
                </div>
              ))}
              {!trending && (
                <div className="text-sm text-muted-foreground">
                  {t("community.loading_trends")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground shadow-lg">
            <CardContent className="p-6 text-center">
              <ShieldAlert className="w-10 h-10 mx-auto mb-4 opacity-80" />
              <h3 className="font-bold mb-2">
                {t("community.verify_card_title")}
              </h3>
              <p className="text-sm opacity-90 mb-4">
                {t("community.verify_card_desc")}
              </p>
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/verify">{t("community.analyze_btn")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
