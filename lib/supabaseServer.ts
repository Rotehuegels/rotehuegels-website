// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function supabaseServer() {
  const store = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // next/headers cookies are mutable in server actions/route handlers
          try { store.set({ name, value, ...options }); } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { store.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}