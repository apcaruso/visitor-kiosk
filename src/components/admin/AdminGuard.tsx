import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { LoadingBlock } from "../common/LoadingBlock";
import { StatusBanner } from "../common/StatusBanner";

export function AdminGuard({ children }: PropsWithChildren) {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <main className="admin-shell admin-shell--centered">
        <LoadingBlock label="Checking admin access..." />
      </main>
    );
  }

  if (!auth.session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!auth.isAdmin) {
    return (
      <main className="admin-shell admin-shell--centered">
        <section className="admin-card admin-card--compact">
          <StatusBanner
            tone="error"
            message="The authenticated user is not authorized to access the admin area."
          />
          <button className="primary-button" type="button" onClick={() => auth.signOut()}>
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
