import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server-side Supabase client for use in Route Handlers / Server Components.
 * Still uses the anon key + the caller's auth cookie, so RLS applies exactly
 * as it would client-side — this is NOT a privilege escalation, just SSR
 * plumbing. Use `createAdminClient` when you deliberately need to bypass RLS. */
export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL and publishable key are required.");
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component with no request context to write
            // cookies to — safe to ignore, middleware refreshes the session.
          }
        },
      },
    }
  );
}
