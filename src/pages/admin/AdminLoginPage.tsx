import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { AdminLoginForm } from "../../components/admin/AdminLoginForm";
import { StatusBanner } from "../../components/common/StatusBanner";
import { signInAdmin } from "../../services/auth";
import { toErrorMessage } from "../../utils/errors";

export function AdminLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isLoading && auth.session && auth.isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [auth.isAdmin, auth.isLoading, auth.session, navigate]);

  async function handleSubmit(credentials: { email: string; password: string }) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signInAdmin(credentials.email.trim(), credentials.password);
    } catch (error) {
      setErrorMessage(
        toErrorMessage(error, "Authentication failed. Check the credentials."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-shell admin-shell--centered">
      <section className="admin-card admin-card--compact">
        <header className="admin-card__header admin-card__header--stacked">
          <div>
            <span className="eyebrow">Admin area</span>
            <h1>Admin login</h1>
          </div>
        </header>
        {auth.errorMessage ? <StatusBanner tone="error" message={auth.errorMessage} /> : null}
        <AdminLoginForm
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
      </section>
    </main>
  );
}
