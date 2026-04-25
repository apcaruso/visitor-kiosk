import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { AuthContextValue } from "../types/domain";
import {
  getAdminProfile,
  getCurrentSession,
  signOutAdmin,
  subscribeToAuthChanges,
} from "../services/auth";
import { toErrorMessage } from "../utils/errors";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextValue["profile"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function hydrate(nextSession: Session | null) {
      setSession(nextSession);

      if (!nextSession?.user) {
        if (isActive) {
          setProfile(null);
          setErrorMessage(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const nextProfile = await getAdminProfile(nextSession.user.id);
        if (isActive) {
          setProfile(nextProfile);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          setProfile(null);
          setErrorMessage(toErrorMessage(error, "Unable to verify the admin profile."));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    getCurrentSession()
      .then((currentSession) => hydrate(currentSession))
      .catch((error) => {
        if (isActive) {
          setErrorMessage(toErrorMessage(error, "Unable to retrieve the session."));
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = subscribeToAuthChanges((nextSession) => {
      setIsLoading(true);
      hydrate(nextSession).catch((error) => {
        setErrorMessage(
          toErrorMessage(error, "Unable to update the authentication state."),
        );
        setIsLoading(false);
      });
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    profile,
    isAdmin: Boolean(profile?.isAdmin),
    isLoading,
    errorMessage,
    signOut: signOutAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
