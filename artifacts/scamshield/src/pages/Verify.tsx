import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, HelpCircle, Lightbulb, ListChecks, GraduationCap, AlertTriangle, ArrowRight, Loader2, Info, Search } from "lucide-react";
import { useCreateAnalysis, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { Analysis, AnalysisInputContentType } from "@workspace/api-client-react/src/generated/api.schemas";

const formSchema = z.object({
  contentType: z.enum(["text", "url", "email", "social-media", "job", "scholarship", "news", "general"]),
  inputText: z.string().min(5, {
    message: "Please enter at least 5 characters to analyze.",
  }),
  sourceUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
});

export default function Verify() {
  const [activeTab, setActiveTab] = useState<AnalysisInputContentType>("text");
  const [result, setResult] = useState<Analysis | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const createAnalysis = useCreateAnalysis();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentType: "text",
      inputText: "",
      sourceUrl: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setResult(null);
    createAnalysis.mutate(
      {
        data: {
          contentType: values.contentType,
          inputText: values.inputText,
          sourceUrl: values.sourceUrl || undefined,
          responseLanguage: i18n.language,
        }
      },
      {
        onSuccess: (data) => {
          setResult(data);
          toast({
            title: t("verify.toast_success_title"),
            description: t("verify.toast_success_desc"),
          });
          queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
        },
        onError: () => {
          toast({
            title: t("verify.toast_error_title"),
            description: t("verify.toast_error_desc"),
            variant: "destructive",
          });
        }
      }
    );
  }

  const handleTabChange = (val: string) => {
    const type = val as AnalysisInputContentType;
    setActiveTab(type);
    form.setValue("contentType", type);
    form.setValue("inputText", "");
    form.setValue("sourceUrl", "");
    form.clearErrors();
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">{t("verify.title")}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("verify.subtitle")}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_minmax(0,1.2fr)] gap-10 items-start">
        {/* Input Column */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-md">
            <CardHeader>
              <CardTitle>{t("verify.card_title")}</CardTitle>
              <CardDescription>{t("verify.card_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="text">{t("verify.tab_text")}</TabsTrigger>
                  <TabsTrigger value="url">{t("verify.tab_link")}</TabsTrigger>
                  <TabsTrigger value="email">{t("verify.tab_email")}</TabsTrigger>
                  <TabsTrigger value="social-media">{t("verify.tab_social")}</TabsTrigger>
                </TabsList>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {activeTab === "url" ? (
                      <FormField
                        control={form.control}
                        name="inputText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("verify.label_url")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("verify.placeholder_url")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="inputText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("verify.label_content")}</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={
                                    activeTab === "email" ? t("verify.placeholder_email") :
                                    activeTab === "social-media" ? t("verify.placeholder_social") :
                                    t("verify.placeholder_text")
                                  }
                                  className="min-h-[150px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {activeTab === "social-media" && (
                          <FormField
                            control={form.control}
                            name="sourceUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("verify.label_source_url")}</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://twitter.com/..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 text-base rounded-xl"
                      disabled={createAnalysis.isPending}
                    >
                      {createAnalysis.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("verify.btn_analyzing")}
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-5 w-5" /> {t("verify.btn_analyze")}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </Tabs>
            </CardContent>
          </Card>

          {/* SIFT Helper */}
          {!result && (
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 flex items-start gap-4">
              <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-primary mb-1">{t("verify.sift_title")}</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>S</strong>{t("verify.sift_s").slice(1)}</li>
                  <li><strong>I</strong>{t("verify.sift_i").slice(1)}</li>
                  <li><strong>F</strong>{t("verify.sift_f").slice(1)}</li>
                  <li><strong>T</strong>{t("verify.sift_t").slice(1)}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className="w-full">
          {!result ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("verify.awaiting_title")}</h3>
              <p className="text-muted-foreground max-w-sm">{t("verify.awaiting_desc")}</p>
            </div>
          ) : !result.result ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-destructive/30 rounded-2xl bg-destructive/5">
              <AlertTriangle className="w-10 h-10 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("verify.error_title", "Analysis could not be completed")}</h3>
              <p className="text-muted-foreground max-w-sm text-sm">{t("verify.error_desc", "The AI was unable to process your content. Please try again or rephrase your input.")}</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              <div className="bg-background rounded-2xl border shadow-lg overflow-hidden glass-panel">
                <div className="bg-slate-100 dark:bg-slate-800/50 p-6 border-b flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                      {t("verify.result_title")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{t("verify.result_category")}: {result.result.contentCategory}</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-center px-4 py-2 bg-background rounded-lg border shadow-sm">
                      <span className="block text-xl font-bold text-orange-500">{result.warningSignCount || 0}</span>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{t("verify.warnings_label")}</span>
                    </div>
                    <div className="text-center px-4 py-2 bg-background rounded-lg border shadow-sm">
                      <span className="block text-xl font-bold text-emerald-500">{result.trustIndicatorCount || 0}</span>
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{t("verify.trust_label")}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <ShieldAlert className="w-5 h-5" /> {t("verify.section_warning")}
                      </h3>
                      {result.result.warningSigns.length > 0 ? (
                        <ul className="space-y-3">
                          {result.result.warningSigns.map((ws, i) => (
                            <li key={i} className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/50">
                              <span className="font-medium text-sm block mb-1">{ws.title}</span>
                              <span className="text-xs text-muted-foreground">{ws.explanation}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">{t("verify.no_warnings")}</p>
                      )}
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="w-5 h-5" /> {t("verify.section_trust")}
                      </h3>
                      {result.result.trustIndicators.length > 0 ? (
                        <ul className="space-y-3">
                          {result.result.trustIndicators.map((ti, i) => (
                            <li key={i} className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                              <span className="font-medium text-sm block mb-1">{ti.title}</span>
                              <span className="text-xs text-muted-foreground">{ti.explanation}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">{t("verify.no_trust")}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold flex items-center gap-2 text-primary mb-4">
                      <HelpCircle className="w-5 h-5" /> {t("verify.section_questions")}
                    </h3>
                    <div className="grid gap-3">
                      {result.result.reflectiveQuestions.map((q, i) => (
                        <div key={i} className="flex gap-3 items-start bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border">
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                          <p className="text-sm font-medium pt-0.5">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold flex items-center gap-2 text-foreground mb-4">
                      <ListChecks className="w-5 h-5" /> {t("verify.section_steps")}
                    </h3>
                    <ul className="space-y-2">
                      {result.result.verificationSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                    <h3 className="font-semibold flex items-center gap-2 text-primary mb-2">
                      <GraduationCap className="w-5 h-5" /> {t("verify.section_lesson")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {result.result.literacyLesson}
                    </p>
                    <div className="bg-background rounded-xl p-4 border flex items-start gap-3 mt-4">
                      <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-sm block mb-1">{t("verify.quick_tip")}</span>
                        <span className="text-sm text-muted-foreground">{result.result.educationalTip}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
