import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface-1 ${className}`}>
      <div className="border-b border-border px-4 py-2.5">
        <h3 className="text-xs font-medium tracking-wide text-text-secondary uppercase">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
