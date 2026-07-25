import { useGetDashboardStats, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { 
  Trophy, Flame, Target, BookOpen, Search, Medal, ShieldCheck, Zap, Activity, Loader2
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();

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
          My Learning Journey
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your progress and continue building your media literacy skills.
        </p>
      </div>

      {/* Literacy Score Hero */}
      <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-[2rem] p-8 md:p-12 mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-lg font-medium opacity-90 mb-2 uppercase tracking-widest">Media Literacy Score</h2>
            <div className="text-6xl md:text-8xl font-bold font-display mb-4">
              {stats.literacyScore} <span className="text-2xl md:text-3xl opacity-70">/ 100</span>
            </div>
            <p className="text-primary-foreground/80 text-lg">
              {stats.literacyScore < 30 ? "You're just getting started! Complete lessons to boost your score." : 
               stats.literacyScore < 70 ? "Good progress! You're developing a strong critical eye." : 
               "Excellent! You're highly resistant to digital manipulation."}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center min-w-[200px]">
            <Flame className="w-12 h-12 text-orange-300 mx-auto mb-3" />
            <div className="text-4xl font-bold font-display mb-1">{stats.currentStreak} Day</div>
            <div className="text-sm font-medium opacity-80 uppercase tracking-wider">Current Streak</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Analyses Performed", value: stats.analysesCompleted, icon: Search, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Lessons Finished", value: stats.lessonsFinished, icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Avg Quiz Score", value: `${stats.averageQuizScore || 0}%`, icon: Target, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Achievements", value: stats.achievements?.length || 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
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
            <Activity className="w-6 h-6 text-primary" /> Recent Activity
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
                    return (
                      <div key={item.id} className="p-4 sm:p-6 flex gap-4 hover:bg-muted/30 transition-colors">
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No activity yet. Start by taking a lesson or verifying a link!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold font-display flex items-center gap-2">
            <Medal className="w-6 h-6 text-amber-500" /> Badges
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
                <p className="text-sm text-muted-foreground">Complete tasks to earn achievements.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}