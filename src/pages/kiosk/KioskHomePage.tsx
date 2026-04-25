import { PrimaryActionCard } from "../../components/common/PrimaryActionCard";
import { KioskLayout } from "../../components/kiosk/KioskLayout";

export function KioskHomePage() {
  return (
    <KioskLayout
      title="Welcome"
      subtitle="Choose the action you need."
      showBack={false}
    >
      <section className="hero-grid">
        <PrimaryActionCard
          to="/checkin"
          title="Check in"
          description="Register a new visitor and capture the required signature."
        >
          Arrival
        </PrimaryActionCard>
        <PrimaryActionCard
          to="/checkout"
          title="Check out"
          description="Close an open visit and capture the final signature."
        >
          Close visit
        </PrimaryActionCard>
      </section>
    </KioskLayout>
  );
}
