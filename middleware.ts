import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  if (request.auth?.user) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", request.nextUrl);
  signInUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    "/today/:path*",
    "/capture/:path*",
    "/commitments/:path*",
    "/meetings/:path*",
    "/notes/:path*",
    "/people/:path*",
    "/proposals/:path*",
    "/opportunities/:path*",
    "/search/:path*",
    "/account/:path*",
    "/settings/:path*",
    "/tasks/:path*",
  ],
};
