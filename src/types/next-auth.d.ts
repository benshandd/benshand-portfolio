import type { DefaultSession } from "next-auth";

type AppUserRole = "owner" | "editor" | "viewer";

declare module "next-auth" {
  interface Session {
    user: {
      role?: AppUserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppUserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppUserRole;
  }
}
