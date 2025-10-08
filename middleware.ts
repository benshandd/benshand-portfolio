import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export default auth((req) => {
  if (req.nextUrl.pathname === "/dashboard/sign-in") {
    return NextResponse.next();
  }
  const role = req.auth?.user?.role;
  if (!role) {
    const signInUrl = new URL("/dashboard/sign-in", req.nextUrl);
    signInUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
