import { restoreUsefulFocus } from "./Dialog";
import { useEffect, useRef, type ReactNode } from "react";
export function DetailSurface({
  title,
  onClose,
  children,
  origin,
  returnLabel = "Back to map",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  origin: HTMLElement | null;
  returnLabel?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    return () => {
      restoreUsefulFocus(origin);
    };
  }, []);
  return (
    <aside
      className="detail-surface"
      aria-labelledby="passage-detail-title"
      onKeyDown={(e) => {
        if (
          e.key === "Escape" &&
          !(
            e.target instanceof HTMLElement &&
            e.target.closest("input,textarea,select,form")
          )
        ) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <button className="secondary" onClick={onClose}>
        {returnLabel}
      </button>
      <h2 id="passage-detail-title" ref={heading} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </aside>
  );
}
export function CaptureSurface({
  title,
  onClose,
  busy,
  origin,
  children,
}: {
  title: string;
  onClose: () => void;
  busy: boolean;
  origin: HTMLElement | null;
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    root.current?.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
    return () => {
      restoreUsefulFocus(origin);
    };
  }, []);
  return (
    <main
      className="capture-page"
      id="capture-content"
      tabIndex={-1}
      ref={root}
      aria-busy={busy}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <section className="capture-card" aria-labelledby="capture-title">
        <div className="capture-heading">
          <h1 id="capture-title">{title}</h1>
          <button className="secondary" disabled={busy} onClick={onClose}>
            Back
          </button>
        </div>
        {children}
      </section>
    </main>
  );
}
