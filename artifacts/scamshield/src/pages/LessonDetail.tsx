import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetLesson, useCompleteLesson, getListLessonsQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LessonDetail() {
  const [, params] = useRoute("/learn/:id");
  const [, setLocation] = useLocation();
  const id = Number(params?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading, error } = useGetLesson(id, { query: { enabled: !!id } });
  const completeLesson = useCompleteLesson();

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error || !lesson) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Lesson not found</h2>
        <Link href="/learn"><Button>Return to Lessons</Button></Link>
      </div>
    );
  }

  const handleStartQuiz = () => setQuizStarted(true);

  const handleSelectOption = (index: number) => {
    if (!isAnswered) setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    
    setIsAnswered(true);
    const isCorrect = selectedOption === lesson.quiz[currentQuestionIndex].correctIndex;
    if (isCorrect) setScore(s => s + 1);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < lesson.quiz.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    const finalScore = Math.round(((score + (selectedOption === lesson.quiz[currentQuestionIndex].correctIndex ? 1 : 0)) / lesson.quiz.length) * 100);
    
    completeLesson.mutate({ id, data: { quizScore: finalScore } }, {
      onSuccess: () => {
        toast({ title: "Lesson Completed!", description: `You scored ${finalScore}% on the quiz.` });
        queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to all lessons
      </Link>

      {!quizStarted ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                {lesson.category.replace("-", " ")}
              </span>
              <span className="flex items-center text-sm text-muted-foreground font-medium">
                <Clock className="w-4 h-4 mr-1.5" /> {lesson.durationMinutes} min read
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display leading-tight mb-6">
              {lesson.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {lesson.summary}
            </p>
          </div>

          <div 
            className="prose prose-slate dark:prose-invert max-w-none mb-12 prose-headings:font-display prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />

          <Card className="bg-primary/5 border-primary/20 text-center py-10 shadow-lg">
            <CardContent>
              <h3 className="text-2xl font-bold font-display mb-4">Ready to test your knowledge?</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Take a quick {lesson.quiz.length}-question quiz to complete this lesson and earn points toward your literacy score.
              </p>
              <Button size="lg" className="rounded-full px-10 h-14 text-lg shadow-lg" onClick={handleStartQuiz}>
                Start Knowledge Check
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : !quizFinished ? (
        <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
          <div className="mb-8 flex justify-between items-center">
            <h3 className="font-bold text-lg">Question {currentQuestionIndex + 1} of {lesson.quiz.length}</h3>
            <div className="flex gap-1.5">
              {lesson.quiz.map((_, i) => (
                <div key={i} className={`h-2 w-8 rounded-full ${i <= currentQuestionIndex ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
          </div>

          <Card className="shadow-lg border-border/60">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-8">
                {lesson.quiz[currentQuestionIndex].question}
              </h2>
              
              <div className="space-y-3 mb-8">
                {lesson.quiz[currentQuestionIndex].options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrect = i === lesson.quiz[currentQuestionIndex].correctIndex;
                  
                  let optStyle = "border-border hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900";
                  if (isAnswered) {
                    if (isCorrect) optStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-500 dark:text-emerald-100";
                    else if (isSelected) optStyle = "bg-destructive/10 border-destructive text-destructive dark:text-red-400";
                    else optStyle = "opacity-50 border-border bg-background";
                  } else if (isSelected) {
                    optStyle = "border-primary bg-primary/5 ring-1 ring-primary";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(i)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="bg-primary/5 p-4 rounded-xl mb-8 animate-in fade-in">
                  <span className="font-bold block mb-1">Explanation</span>
                  <p className="text-sm text-muted-foreground">{lesson.quiz[currentQuestionIndex].explanation}</p>
                </div>
              )}

              <div className="flex justify-end">
                {!isAnswered ? (
                  <Button size="lg" onClick={handleSubmitAnswer} disabled={selectedOption === null}>
                    Submit Answer
                  </Button>
                ) : (
                  <Button size="lg" onClick={handleNextQuestion}>
                    {currentQuestionIndex < lesson.quiz.length - 1 ? "Next Question" : "Finish Lesson"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-20 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-4xl font-bold font-display mb-4">Lesson Complete!</h2>
          <p className="text-xl text-muted-foreground mb-8">
            You scored {Math.round((score / lesson.quiz.length) * 100)}% on the knowledge check.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/learn")} variant="outline">
              Back to Lessons
            </Button>
            <Button size="lg" onClick={() => setLocation("/dashboard")}>
              View Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}