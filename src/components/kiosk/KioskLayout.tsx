import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../../utils/dateTime";

type KioskLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  showBack?: boolean;
}>;

export function KioskLayout({
  children,
  title,
  subtitle,
  showBack = true,
}: KioskLayoutProps) {
  return (
    <main className="kiosk-shell">
      <section className="kiosk-panel">
        <header className="kiosk-panel__header">
          <div>
            <span className="eyebrow">Visitor register</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="kiosk-panel__header-actions">
            <div className="clock-card">{formatDateTime(new Date())}</div>
            {showBack ? (
              <Link className="ghost-button" to="/">
                Home
              </Link>
            ) : null}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
