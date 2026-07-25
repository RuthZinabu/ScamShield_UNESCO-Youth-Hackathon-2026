import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Brain, CheckCircle2, Search, BookOpen, Users, AlertTriangle } from "lucide-react";
import heroAbstract from "@assets/generated_images/hero-abstract.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
                <Shield className="w-4 h-4" />
                <span>Media & Information Literacy</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.1] tracking-tight mb-6 text-foreground">
                Think Before <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  You Trust.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                ScamShield AI doesn't just tell you what's true or false. We guide you to ask the right questions, spot the warning signs, and navigate the digital world with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/verify">
                  <Button size="lg" className="w-full sm:w-auto gap-2 text-base h-14 px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl transition-all">
                    Verify Content <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/learn">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base h-14 px-8 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-border hover:bg-white dark:hover:bg-slate-800 transition-all">
                    Start Learning
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
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl z-20 border border-border flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 delay-500 duration-700">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Critical Thinking</p>
                  <p className="text-xs text-muted-foreground">Enhanced</p>
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
              <div className="text-4xl md:text-5xl font-bold font-display text-primary mb-2">85%</div>
              <p className="text-muted-foreground font-medium">of users feel more confident online</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold font-display text-secondary mb-2">10k+</div>
              <p className="text-muted-foreground font-medium">lessons completed this month</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold font-display text-primary mb-2">50k</div>
              <p className="text-muted-foreground font-medium">scam reports analyzed</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">How ScamShield Empowers You</h2>
            <p className="text-muted-foreground text-lg">Our goal is to build your digital resilience through guided practice and community awareness.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Analyze & Reflect",
                desc: "Submit suspicious links, emails, or text. Our AI highlights trust indicators and warning signs, then prompts you with questions to investigate further.",
                href: "/verify",
                linkText: "Try Verification"
              },
              {
                icon: BookOpen,
                title: "Learn the Patterns",
                desc: "Take bite-sized interactive lessons on phishing, deepfakes, and social engineering to recognize manipulation tactics before they work.",
                href: "/learn",
                linkText: "Browse Lessons"
              },
              {
                icon: Users,
                title: "Community Intelligence",
                desc: "Explore trending scams reported by others. See real-world examples of how attackers operate in your region right now.",
                href: "/community",
                linkText: "View Reports"
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-card hover:shadow-xl transition-all duration-300 border-border/50 group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.desc}
                  </p>
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
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Trending Threats</h2>
              <p className="text-muted-foreground">What the community is reporting right now.</p>
            </div>
            <Link href="/community">
              <Button variant="outline" className="gap-2 rounded-full">
                See all reports <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { type: "Phishing", title: "Urgent Bank Alerts", count: 342, severity: "high" },
              { type: "Investment", title: "Crypto 'Guaranteed' Returns", count: 215, severity: "high" },
              { type: "Job", title: "Remote Data Entry Hiring", count: 189, severity: "medium" },
              { type: "Romance", title: "Overseas Emergency Funds", count: 156, severity: "high" },
            ].map((scam, i) => (
              <div key={i} className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{scam.type}</span>
                </div>
                <h4 className="font-bold mb-4 line-clamp-2">{scam.title}</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{scam.count} reports</span>
                  <span className="px-2 py-1 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-medium">
                    {scam.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Learn more about how our platform works.</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">Is this an automated scam detector?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                No. ScamShield AI is an educational tool. We do not make definitive "True" or "False" judgments on your behalf. Instead, we highlight warning signs and trust indicators, and guide you through the verification process so you build your own critical thinking skills.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">What happens to the content I verify?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Content submitted for verification is analyzed securely and temporarily stored for your personal dashboard if you choose to bookmark it. We strip personally identifiable information before analysis to protect your privacy.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">Who creates the learning materials?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Our lessons and quizzes are developed by media and information literacy experts, following guidelines set by international organizations like UNESCO.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}