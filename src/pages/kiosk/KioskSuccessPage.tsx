import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CompletionScreen } from "../../components/kiosk/CompletionScreen";
import { KioskLayout } from "../../components/kiosk/KioskLayout";

export function KioskSuccessPage() {
  const navigate = useNavigate();
  const { kind } = useParams();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdown((value) => (value > 1 ? value - 1 : value));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      navigate("/", { replace: true });
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [navigate]);

  const isCheckin = kind === "checkin";

  return (
    <KioskLayout
      title={isCheckin ? "Check-in complete" : "Check-out complete"}
      subtitle="The operation was completed successfully."
      showBack={false}
    >
      <CompletionScreen
        title={isCheckin ? "Check-in registered" : "Check-out registered"}
        message={
          isCheckin
            ? "The visitor was registered successfully."
            : "The visit was closed successfully."
        }
        countdown={countdown}
      />
    </KioskLayout>
  );
}
