import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
const dialogStack: HTMLElement[] = [];
const originalInert = new Map<HTMLElement, boolean>();
let originalOverflow = "";
function syncDialogs() {
  const top = dialogStack.at(-1);
  const host = top?.parentElement;
  if (top)
    for (const child of Array.from(host?.children || [])) {
      if (!(child instanceof HTMLElement)) continue;
      if (!originalInert.has(child)) originalInert.set(child, child.inert);
      child.inert = child !== top;
    }
  else {
    for (const [child, value] of originalInert) child.inert = value;
    originalInert.clear();
    document.body.style.overflow = originalOverflow;
  }
}
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = React.useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const backdrop = root.current!.parentElement!;
    if (!dialogStack.length) originalOverflow = document.body.style.overflow;
    dialogStack.push(backdrop);
    document.body.style.overflow = "hidden";
    syncDialogs();
    const focus =
      root.current?.querySelector<HTMLElement>("[data-initial-focus]") ||
      root.current?.querySelector<HTMLElement>(
        'input:not(:disabled):not([type="hidden"]),textarea:not(:disabled),select:not(:disabled)',
      ) ||
      root.current?.querySelector<HTMLElement>("button:not(:disabled)") ||
      root.current;
    focus?.focus();
    return () => {
      const index = dialogStack.indexOf(backdrop);
      if (index >= 0) dialogStack.splice(index, 1);
      syncDialogs();
      if (previous?.isConnected && !previous.closest("[inert]"))
        previous.focus();
      else
        (
          dialogStack
            .at(-1)
            ?.querySelector<HTMLElement>("button:not(:disabled)") ||
          document.querySelector<HTMLElement>("header button:not(:disabled)")
        )?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dialog"
        ref={root}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
            return;
          }
          if (e.key === "Tab") {
            const elements = Array.from(
              root.current?.querySelectorAll<HTMLElement>(
                'button:not(:disabled),input:not(:disabled):not([type="hidden"]),textarea:not(:disabled),select:not(:disabled),a[href],summary,[tabindex="0"]',
              ) || [],
            );
            const visible = elements.filter(
              (el) => el.getClientRects().length > 0,
            );
            const first = visible[0],
              last = visible.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
