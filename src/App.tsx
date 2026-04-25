import { Navigate, Route, Routes } from "react-router-dom";
import { AdminGuard } from "./components/admin/AdminGuard";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { CheckinPage } from "./pages/kiosk/CheckinPage";
import { CheckoutPage } from "./pages/kiosk/CheckoutPage";
import { KioskHomePage } from "./pages/kiosk/KioskHomePage";
import { KioskSuccessPage } from "./pages/kiosk/KioskSuccessPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<KioskHomePage />} />
      <Route path="/checkin" element={<CheckinPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/success/:kind" element={<KioskSuccessPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminDashboardPage />
          </AdminGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
