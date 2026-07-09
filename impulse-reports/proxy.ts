import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 proxy (replaces middleware): refreshes the Supabase session on
// every request and gates the whole app behind the single login.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/";

  // Auto sign-in: if credentials are baked in as env vars, skip the login page entirely.
  if (!user) {
    const autoEmail = process.env.SUPABASE_AUTO_EMAIL;
    const autoPass = process.env.SUPABASE_AUTO_PASSWORD;
    if (autoEmail && autoPass) {
      const { error } = await supabase.auth.signInWithPassword({
        email: autoEmail,
        password: autoPass,
      });
      if (!error) {
        const dest = request.nextUrl.clone();
        if (isLoginPage) dest.pathname = "/jobs";
        const redirect = NextResponse.redirect(dest);
        response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
        return redirect;
      }
    }
  }

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/jobs";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and PWA files
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)",
  ],
};
