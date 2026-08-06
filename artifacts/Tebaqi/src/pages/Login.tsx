import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveAuthSession } from "@/lib/auth";
import { Chrome } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = useMemo(() => {
    const configured = import.meta.env.VITE_GOOGLE_REDIRECT_URI as string | undefined;
    if (configured) return configured;
    if (typeof window !== "undefined") {
      return `${window.location.origin}/login`;
    }
    return "http://localhost:3000/login";
  }, []);

  const handleGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setError("Google OAuth is not configured for this deployment yet.");
      return;
    }

    const search = new URLSearchParams(window.location.search);
    const redirect = search.get("redirect") || "/dashboard";

   const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "openid email profile",
  access_type: "offline",
  prompt: "consent",
  state: redirect,
});

    window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  };

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const code = search.get("code");
    const state = search.get("state") || "/dashboard";

    if (!code) {
      return;
    }

    const exchangeCode = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/google/exchange`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!response.ok) {
          throw new Error((await response.json()).message || "Google sign-in failed");
        }

        const data = await response.json();
        saveAuthSession(data.token, data.user);
        setLocation(state);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Google sign-in failed");
        setIsLoading(false);
      }
    };

    void exchangeCode();
  }, [redirectUri, setLocation]);

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Continue with Google</CardTitle>
          <CardDescription>Sign in with your Google account to access your personal dashboard and report threats.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full gap-2 rounded-full">
            <Chrome className="h-5 w-5" />
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
