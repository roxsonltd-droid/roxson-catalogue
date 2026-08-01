import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = nextUrl.pathname.startsWith("/admin");
      const isLogin = nextUrl.pathname === "/admin/login";

      if (isAdmin && !isLoggedIn && !isLogin) return false;
      if (isLogin && isLoggedIn) return Response.redirect(new URL("/admin", nextUrl));
      return true;
    },
  },
} satisfies NextAuthConfig;
