import { formatAgo } from "../dates";
import { AlertIcon } from "../icons";

interface ErrorProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorProps) {
  return (
    <div className="banner banner-error" role="alert">
      <AlertIcon size={16} />
      <span className="banner-text">{message}</span>
      <button type="button" className="btn-link" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

interface StaleProps {
  updatedAt: number | null;
  now: number;
}

export function StaleBanner({ updatedAt, now }: StaleProps) {
  return (
    <div className="banner banner-stale" role="status">
      <span className="banner-text">
        Showing cached data — last updated {formatAgo(updatedAt, now)}.
      </span>
    </div>
  );
}
