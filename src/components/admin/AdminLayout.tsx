import type { PropsWithChildren } from "react";
import { useAuth } from "../../auth/AuthProvider";

type AdminLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AdminLayout({
  children,
  title,
  subtitle,
}: AdminLayoutProps) {
  const auth = useAuth();

  return (
    <main className="admin-shell">
      <section className="admin-card">
        <header className="admin-card__header">
          <div>
            <span className="eyebrow">Admin area</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="admin-card__actions">
            <div className="admin-user-chip">
              <strong>{auth.profile?.fullName ?? "Admin"}</strong>
              <span>{auth.profile?.email ?? auth.session?.user.email}</span>
            </div>
            <button className="ghost-button" type="button" onClick={() => auth.signOut()}>
              Logout
            </button>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
