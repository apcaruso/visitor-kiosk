import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "visitor-register-auth",
  },
  global: {
    headers: {
      "X-Client-Info": "visitor-register-frontend",
    },
  },
});
