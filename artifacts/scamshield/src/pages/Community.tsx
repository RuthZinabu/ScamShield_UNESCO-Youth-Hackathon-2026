import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useListReports, useCreateReport, useGetTrendingReports, getListReportsQueryKey, getGetTrendingReportsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Search, Flame, MapPin, MessageSquareWarning, ArrowUp, Plus, Loader2, ShieldAlert, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ListReportsCategory, ReportInputCategory } from "@workspace/api-client-react/src/generated/api.schemas";

const reportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details to help others"),
  category: z.enum(["job", "investment", "shopping", "news", "scholarship", "phishing", "romance", "other"]),
  country: z.string().optional(),
});

export default function Community() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ListReportsCategory | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useListReports({ 
    search: search || undefined, 
    category: category !== "all" ? category as ListReportsCategory : undefined 
  });
  
  const { data: trending } = useGetTrendingReports();
  const createReport = useCreateReport();

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: { title: "", description: "", category: "phishing", country: "" },
  });

  const onSubmit = (values: z.infer<typeof reportSchema>) => {
    createReport.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Report Submitted", description: "Thank you for helping the community stay safe." });
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTrendingReportsQueryKey() });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-foreground mb-4">
            Community Reports
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Stay updated on the latest threats. Share what you've encountered to help protect others.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg gap-2 shrink-0">
              <Plus className="w-5 h-5" /> Report a Threat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Share a Threat Report</DialogTitle>
              <DialogDescription>
                Describe the scam or misinformation campaign you encountered. Do not include personal information.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input placeholder="e.g. Fake Job Offer on LinkedIn" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="phishing">Phishing</SelectItem>
                          <SelectItem value="job">Job Scam</SelectItem>
                          <SelectItem value="investment">Investment/Crypto</SelectItem>
                          <SelectItem value="shopping">Fake Store</SelectItem>
                          <SelectItem value="news">Disinformation</SelectItem>
                          <SelectItem value="romance">Romance Scam</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details</FormLabel>
                      <FormControl>
                        <Textarea placeholder="How did they contact you? What were the red flags?" className="resize-none h-24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createReport.isPending}>
                  {createReport.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Submit Report
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        
        {/* Main Feed */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search reports..." 
                className="pl-9 bg-background border-none shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select onValueChange={(v) => setCategory(v as any)} defaultValue="all">
              <SelectTrigger className="w-full sm:w-[180px] bg-background border-none shadow-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="phishing">Phishing</SelectItem>
                <SelectItem value="job">Job Scam</SelectItem>
                <SelectItem value="investment">Investment/Crypto</SelectItem>
                <SelectItem value="shopping">Fake Store</SelectItem>
                <SelectItem value="news">Disinformation</SelectItem>
                <SelectItem value="romance">Romance Scam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({length: 3}).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
              ))
            ) : reports?.length === 0 ? (
              <div className="text-center py-20 bg-background border border-dashed rounded-xl">
                <MessageSquareWarning className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No reports found matching your criteria.</p>
              </div>
            ) : (
              reports?.map(report => (
                <Card key={report.id} className="hover:shadow-md transition-shadow group">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold text-sm">{report.upvoteCount}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {report.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                          </span>
                          {report.country && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                              <MapPin className="w-3 h-3" /> {report.country}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{report.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-slate-50 dark:bg-slate-900 border-border">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {trending?.topCategories.map((cat, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{cat.category}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                    {cat.count} reports
                  </span>
                </div>
              ))}
              {!trending && <div className="text-sm text-muted-foreground">Loading trends...</div>}
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground shadow-lg">
            <CardContent className="p-6 text-center">
              <ShieldAlert className="w-10 h-10 mx-auto mb-4 opacity-80" />
              <h3 className="font-bold mb-2">Verify Before Reporting</h3>
              <p className="text-sm opacity-90 mb-4">
                Not sure if what you're seeing is a scam? Run it through our analyzer first.
              </p>
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/verify">Analyze Content</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

