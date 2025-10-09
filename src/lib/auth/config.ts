import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { serverEnv } from "@/env/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/dashboard/sign-in",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const { email, password } = parsed.data;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()));
        if (!user) {
          // Bootstrap flow: allow first login using OWNER_EMAIL/OWNER_PASSWORD
          // and create the owner user on the fly for convenience.
          if (
            serverEnv.OWNER_EMAIL &&
            serverEnv.OWNER_PASSWORD &&
            email.toLowerCase() === serverEnv.OWNER_EMAIL.toLowerCase()
          ) {
            // OWNER_PASSWORD can be plain text (preferred) or a bcrypt hash.
            const looksHashed = serverEnv.OWNER_PASSWORD.startsWith("$2");
            const passwordMatches = looksHashed
              ? await bcrypt.compare(password, serverEnv.OWNER_PASSWORD)
              : password === serverEnv.OWNER_PASSWORD;

            if (!passwordMatches) {
              return null;
            }

            const passwordHash = looksHashed
              ? serverEnv.OWNER_PASSWORD
              : await bcrypt.hash(serverEnv.OWNER_PASSWORD, 12);

            await db.insert(users).values({
              email: serverEnv.OWNER_EMAIL.toLowerCase(),
              passwordHash,
              role: "owner",
              name: "Owner",
            });

            const [created] = await db
              .select()
              .from(users)
              .where(eq(users.email, serverEnv.OWNER_EMAIL.toLowerCase()));

            if (!created) return null;

            return {
              id: created.id,
              email: created.email,
              name: created.name ?? undefined,
              image: created.image ?? undefined,
              role: created.role,
            } as const;
          }

          return null;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
        } as const;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const role = token.role;
        if (role === "owner" || role === "editor" || role === "viewer") {
          session.user.role = role;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (serverEnv.OWNER_EMAIL && user.email === serverEnv.OWNER_EMAIL && user.id) {
        await db
          .update(users)
          .set({ role: "owner" })
          .where(eq(users.id, user.id));
      }
    },
  },
};
