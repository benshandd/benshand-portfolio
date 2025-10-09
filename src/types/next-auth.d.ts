import type { DefaultSession } from "next-auth";

type Role = "owner" | "editor" | "viewer";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      role?: Role;
    };
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
  }
}
