import { useTranslation } from "react-i18next";
import { useGetDashboardStats, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  Trophy, Flame, Target, BookOpen, Search, Medal, ShieldCheck, Zap, Activity, Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { getIsAuthenticated } from "@/lib/auth";

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const isAuthenticated = getIsAuthenticated();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <h1 className="text-3xl font-bold font-display text-foreground mb-3">
            Please log in first to access your dashboard.
          </h1>
          <p className="text-muted-foreground mb-6">
            Sign in to view your progress, lessons, and achievements.
          </p>
          <Button onClick={() => setLocation("/login?redirect=/dashboard")}>Log In</Button>
        </div>
      </div>
    );
  }

  if (statsLoading || activityLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-display tracking-tight text-foreground mb-2">
          {t("dashboard.title")}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Literacy Score Hero */}
      <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-[2rem] p-8 md:p-12 mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-lg font-medium opacity-90 mb-2 uppercase tracking-widest">{t("dashboard.score_label")}</h2>
            <div className="text-6xl md:text-8xl font-bold font-display mb-4">
              {stats.literacyScore} <span className="text-2xl md:text-3xl opacity-70">{t("dashboard.score_unit")}</span>
            </div>
            <p className="text-primary-foreground/80 text-lg">
              {stats.literacyScore < 30 ? t("dashboard.score_low") :
               stats.literacyScore < 70 ? t("dashboard.score_mid") :
               t("dashboard.score_high")}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center min-w-[200px]">
            <Flame className="w-12 h-12 text-orange-300 mx-auto mb-3" />
            <div className="text-4xl font-bold font-display mb-1">{stats.currentStreak} {t("dashboard.streak_unit")}</div>
            <div className="text-sm font-medium opacity-80 uppercase tracking-wider">{t("dashboard.streak_label")}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: t("dashboard.stat_analyses"), value: stats.analysesCompleted, icon: Search, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: t("dashboard.stat_lessons"), value: stats.lessonsFinished, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: t("dashboard.stat_quiz"), value: `${stats.averageQuizScore || 0}%`, icon: Target, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: t("dashboard.stat_achievements"), value: stats.achievements?.length || 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold font-display">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr_350px] gap-8">
        {/* Recent Activity */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold font-display flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> {t("dashboard.activity_title")}
          </h3>
          <Card className="border-border/50">
            <CardContent className="p-0">
              {activity && activity.length > 0 ? (
                <div className="divide-y border-border">
                  {activity.map((item) => {
                    const icons = {
                      analysis: <Search className="w-4 h-4 text-blue-500" />,
                      lesson: <BookOpen className="w-4 h-4 text-emerald-500" />,
                      report: <ShieldCheck className="w-4 h-4 text-purple-500" />,
                      achievement: <Medal className="w-4 h-4 text-amber-500" />
                    };
                    const activityContent = (
                      <>
                        <div className="mt-1 shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center shadow-sm">
                          {icons[item.type]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm mb-1">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground mt-2 font-medium">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </>
                    );

                    if (item.type === "analysis") {
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setLocation(`/verify/${item.id}`)}
                          className="w-full text-left p-4 sm:p-6 flex gap-4 hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary transition-colors"
                          aria-label={`View saved analysis: ${item.description}`}
                        >
                          {activityContent}
                        </button>
                      );
                    }

                    return (
                      <div key={item.id} className="p-4 sm:p-6 flex gap-4 hover:bg-muted/30 transition-colors">
                        {activityContent}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  {t("dashboard.no_activity")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold font-display flex items-center gap-2">
            <Medal className="w-6 h-6 text-amber-500" /> {t("dashboard.badges_title")}
          </h3>
          <div className="grid gap-4">
            {stats.achievements && stats.achievements.length > 0 ? (
              stats.achievements.map((ach) => (
                <Card key={ach.id} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-100 dark:border-amber-900/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-amber-950 dark:text-amber-100">{ach.title}</h4>
                      <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">{ach.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center border border-dashed">
                <Zap className="w-8 h-8 text-muted-foreground opacity-50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("dashboard.no_badges")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
