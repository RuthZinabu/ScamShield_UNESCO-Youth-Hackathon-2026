import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t py-12 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                ScamShield AI
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Empowering individuals with media and information literacy. We don't just tell you what's true—we teach you how to find out for yourself.
            </p>
          </div>
          <div>
            <h3 className="font-display font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/verify" className="text-muted-foreground hover:text-primary transition-colors">Verify Content</Link>
              </li>
              <li>
                <Link href="/learn" className="text-muted-foreground hover:text-primary transition-colors">Lessons & Quizzes</Link>
              </li>
              <li>
                <Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">Community Reports</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold mb-4 text-foreground">Legal & Info</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">About Us</span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ScamShield AI. A conceptual digital public service.
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Not a real scam detector</span>
          </div>
        </div>
      </div>
    </footer>
  );
}