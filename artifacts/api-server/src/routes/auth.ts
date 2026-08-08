import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signJwt, upsertGoogleUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/auth/google/config", (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    res.status(503).json({ message: "Google OAuth is not configured on the server." });
    return;
  }

  res.json({ clientId });
});

router.post("/auth/google/exchange", async (req, res) => {
  const { code, redirectUri } = req.body as {
    code?: string;
    redirectUri?: string;
  };

  if (!code) {
    res.status(400).json({ message: "Authorization code is required." });
    return;
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      res.status(500).json({ message: "Google OAuth is not configured on the server." });
      return;
    }

    const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (configuredRedirectUri && redirectUri && configuredRedirectUri !== redirectUri) {
      res.status(400).json({
        message: "Google OAuth redirect URI mismatch. The browser and server must use the same callback URL.",
      });
      return;
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
 
        //redirect_uri: redirectUri ?? process.env.GOOGLE_REDIRECT_URI!,
 
        // Google binds the authorization code to the exact URI used by the
        // browser. Use that same value for the exchange, falling back to the
        // server setting for clients that do not send it.
        redirect_uri: redirectUri || configuredRedirectUri || "",
 
        grant_type: "authorization_code",
      }),
    });

   if (!tokenResponse.ok) {
  const googleError = await tokenResponse.text();

  console.error("========== GOOGLE TOKEN EXCHANGE FAILED ==========");
  console.error("Status:", tokenResponse.status);
  console.error("Google response:", googleError);
  console.error("Frontend redirectUri:", redirectUri);
  console.error("Env redirectUri:", process.env.GOOGLE_REDIRECT_URI);

  throw new Error(googleError);
}

    const tokenPayload = (await tokenResponse.json()) as { id_token?: string };
    if (!tokenPayload.id_token) {
      throw new Error("Google did not return an ID token");
    }

    const payload = JSON.parse(Buffer.from(tokenPayload.id_token.split(".")[1], "base64").toString("utf8")) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!payload.sub || !payload.email) {
      throw new Error("Incomplete Google profile information");
    }

    const user = await upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    });
    const token = signJwt({ sub: String(user.id) });

    res.json({
      token,
      user: {
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
 } catch (error) {
  console.error("GOOGLE LOGIN ERROR:", error);

  res.status(500).json({
    message: error instanceof Error ? error.message : "Unknown error",
  });
}
});

router.get("/auth/me", async (req, res) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Missing token" });
    return;
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
    const userId = Number(payload.sub);
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!users[0]) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    res.json({ user: users[0] });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
