import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "./fetch";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // This runs on every page view. Ten seconds of nothing is already bad;
      // five minutes of nothing on every page would be the whole site down.
      global: { fetch: fetchWithTimeout(10_000) },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Keeps the login session fresh on every request. The user comes back too,
  // so the caller can decide who is allowed where without asking twice.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
