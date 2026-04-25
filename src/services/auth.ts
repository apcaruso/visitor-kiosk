import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { assertCondition } from "../utils/errors";
import type { AdminProfile } from "../types/domain";

export async function signInAdmin(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export function subscribeToAuthChanges(
  callback: (session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

export async function getAdminProfile(userId: string): Promise<AdminProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_admin")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  assertCondition(data, "Admin profile is not available.");

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    isAdmin: data.is_admin,
  };
}
