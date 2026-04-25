const DEFAULT_TIMEZONE = "Europe/Rome";

function readRequiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Create .env from .env.example and restart Vite.`,
    );
  }

  return value;
}

export const env = {
  supabaseUrl: readRequiredEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: readRequiredEnv("VITE_SUPABASE_ANON_KEY"),
  appTimezone: import.meta.env.VITE_APP_TIMEZONE || DEFAULT_TIMEZONE,
} as const;
