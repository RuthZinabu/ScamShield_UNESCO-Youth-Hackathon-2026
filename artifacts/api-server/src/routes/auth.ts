import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signJwt, upsertGoogleUser } from "../lib/auth";

const router: IRouter = Router();

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

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || "http://localhost:3000/login",
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange Google authorization code");
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
    console.error(error);
    res.status(500).json({ message: "Failed to complete Google sign-in." });
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
