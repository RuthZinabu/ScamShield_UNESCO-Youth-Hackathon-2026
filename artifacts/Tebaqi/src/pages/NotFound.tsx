import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background">
      <div className="text-center px-4 max-w-md">
        <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-display text-foreground mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          The page you are looking for doesn't exist or has been moved. Keep your guard up and navigate back to safety.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-full px-8">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}