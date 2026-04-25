import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

type PrimaryActionCardProps = PropsWithChildren<{
  title: string;
  description: string;
  to: string;
}>;

export function PrimaryActionCard({
  title,
  description,
  to,
  children,
}: PrimaryActionCardProps) {
  return (
    <Link className="primary-action-card" to={to}>
      <div className="primary-action-card__content">
        <span className="eyebrow">{children}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span className="primary-action-card__cta">Open</span>
    </Link>
  );
}
