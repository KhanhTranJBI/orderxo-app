import GoogleProvider from "next-auth/providers/google";
import { backendUrl } from "./backend";

export const googleAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "not-configured",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "not-configured",
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "google" || !account.id_token) return false;
      try {
        const r = await fetch(backendUrl("/api/auth/google-owner"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: account.id_token }),
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        return r.ok;
      } catch {
        return false;
      }
    },
    async jwt({ token, account }) {
      if (account?.provider === "google" && account.id_token) {
        const r = await fetch(backendUrl("/api/auth/google-owner"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: account.id_token }),
          cache: "no-store",
        });
        if (!r.ok) throw new Error("Google owner authorization failed");
        const data = await r.json();
        token.ownerToken = data.token;
      }
      return token;
    },
    async session({ session }) {
      // Never expose the backend bearer token to browser JavaScript.
      return { ...session, ownerAuthorized: true };
    },
  },
};
