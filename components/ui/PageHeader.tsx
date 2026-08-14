import type { ReactNode } from "react";

/**
 * Tool-page header. Left-aligned with a deliberate right-hand void, which is
 * what keeps these pages from reading as centered templates.
 */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] md:gap-14">
      <div>
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-[26ch] text-3xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-4xl">
          {title}
        </h1>
      </div>

      {children && (
        <div className="max-w-[62ch] space-y-3 text-sm leading-relaxed text-fg-subtle md:pt-11">
          {children}
        </div>
      )}
    </header>
  );
}
