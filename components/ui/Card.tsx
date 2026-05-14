import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded border border-zinc-300 bg-white ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="border-b border-zinc-200 px-4 py-3">{children}</div>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="px-4 py-3">{children}</div>;
}
