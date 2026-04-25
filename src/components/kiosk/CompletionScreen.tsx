import { Link } from "react-router-dom";

type CompletionScreenProps = {
  title: string;
  message: string;
  countdown: number;
};

export function CompletionScreen({
  title,
  message,
  countdown,
}: CompletionScreenProps) {
  return (
    <div className="completion-card">
      <div className="completion-card__mark" aria-hidden="true">
        OK
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      <p className="completion-card__countdown">
        Returning to the home screen in {countdown} seconds.
      </p>
      <Link className="primary-button" to="/">
        Return home now
      </Link>
    </div>
  );
}
