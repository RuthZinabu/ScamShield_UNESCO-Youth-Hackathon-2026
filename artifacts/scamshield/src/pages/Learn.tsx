import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useListLessons, useGetLessonCategories } from "@workspace/api-client-react";
import { Search, BookOpen, Clock, CheckCircle2, ChevronRight, Filter } from "lucide-react";
import type { ListLessonsCategory } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Learn() {
  const [selectedCategory, setSelectedCategory] = useState<ListLessonsCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const { data: categories } = useGetLessonCategories();
  const { data: lessons, isLoading } = useListLessons(
    selectedCategory === "all" ? {} : { category: selectedCategory }
  );

  const filteredLessons = lessons?.filter(lesson =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-foreground mb-4">
            {t("learn.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t("learn.subtitle")}
          </p>
        </div>
        <div className="w-full md:w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("learn.search_placeholder")}
            className="pl-9 h-11 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-border">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4" /> {t("learn.categories_label")}
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground"
                }`}
              >
                {t("learn.all_topics")}
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category as ListLessonsCategory)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${
                    selectedCategory === cat.category
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-slate-200 dark:hover:bg-slate-800 text-muted-foreground"
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  <span className="text-[10px] opacity-70 bg-black/10 px-1.5 py-0.5 rounded-full">
                    {cat.lessonCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="p-5">
              <BookOpen className="w-8 h-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">{t("learn.why_title")}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {t("learn.why_desc")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lessons Grid */}
        <div>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[280px] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredLessons?.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{t("learn.no_lessons_title")}</h3>
              <p className="text-muted-foreground">{t("learn.no_lessons_desc")}</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                {t("learn.clear_filters")}
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {filteredLessons?.map((lesson) => (
                <Link key={lesson.id} href={`/learn/${lesson.id}`}>
                  <Card className={`h-full flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/40 group ${lesson.isCompleted ? 'bg-slate-50 dark:bg-slate-900/40' : 'bg-card'}`}>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className="bg-background">
                          {categories?.find(c => c.category === lesson.category)?.label || lesson.category.replace("-", " ")}
                        </Badge>
                        {lesson.isCompleted && (
                          <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 p-1.5 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                        {lesson.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                        {lesson.summary}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-4 border-t flex justify-between items-center bg-muted/20">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {lesson.durationMinutes} {t("learn.min_label")}
                        </span>
                        <span className="capitalize px-2 py-0.5 rounded bg-background border">
                          {lesson.difficulty}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
