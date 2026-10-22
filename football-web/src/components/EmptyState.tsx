import type { ReactNode } from "react";
import { WhistleIcon } from "../icons";

interface Props {
  title: string;
  hint: string;
  action?: ReactNode;
}

export function EmptyState({ title, hint, action }: Props) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden="true">
        <WhistleIcon size={22} />
      </span>
      <h2 className="empty-title">{title}</h2>
      <p className="empty-hint">{hint}</p>
      {action}
    </div>
  );
}
