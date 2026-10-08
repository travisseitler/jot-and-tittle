import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
const dialogStack: HTMLElement[] = [];
const originalInert = new Map<HTMLElement, boolean>();
let originalOverflow = "";
const focusSelector =
  'button:not(:disabled),input:not(:disabled):not([type="hidden"]),textarea:not(:disabled),select:not(:disabled),a[href],summary,[tabindex]';
function available(el: HTMLElement) {
  return (
    el.isConnected &&
    !el.closest("[inert], [hidden]") &&
    el.getClientRects().length > 0 &&
    !el.matches(":disabled")
  );
}
function tabbables(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(focusSelector)).filter(
    (el) => el.tabIndex >= 0 && available(el),
  );
}
function syncDialogs() {
  // Restore first so a previously inert ancestor never hides a nested top dialog.
  for (const [child, value] of originalInert) child.inert = value;
  const top = dialogStack.at(-1);
  if (!top) {
    originalInert.clear();
    document.body.style.overflow = originalOverflow;
    return;
  }
  let branch: HTMLElement = top;
  while (branch.parentElement) {
    for (const child of Array.from(branch.parentElement.children)) {
      if (!(child instanceof HTMLElement) || child === branch) continue;
      if (!originalInert.has(child)) originalInert.set(child, child.inert);
      child.inert = true;
    }
    if (branch.parentElement === document.body) break;
    branch = branch.parentElement;
  }
}
export function restoreUsefulFocus(origin?: HTMLElement | null) {
  if (origin && available(origin)) {
    origin.focus();
    return;
  }
  const top = dialogStack.at(-1)?.querySelector<HTMLElement>('[role="dialog"]');
  const candidate = top
    ? tabbables(top)[0] || top
    : Array.from(
        document.querySelectorAll<HTMLElement>(
          "main h1, main h2, header button, nav button",
        ),
      ).find(available);
  if (candidate) {
    if (!candidate.matches(focusSelector)) candidate.tabIndex = -1;
    candidate.focus();
  }
}
export function Dialog({
  title,
  onClose,
  children,
  busy = false,
  busyLabel = "Saving…",
  initialFocus = "auto",
  restoreFocus,
  error,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  busy?: boolean;
  busyLabel?: string;
  initialFocus?: "auto" | "heading" | "cancel";
  restoreFocus?: HTMLElement | null;
  error?: string;
}) {
  const titleId = React.useId();
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const initial = useRef({ initialFocus, restoreFocus });
  useEffect(() => {
    const previous =
      initial.current.restoreFocus ?? (document.activeElement as HTMLElement);
    const current = root.current!;
    const backdrop = current.parentElement!;
    if (!dialogStack.length) originalOverflow = document.body.style.overflow;
    dialogStack.push(backdrop);
    document.body.style.overflow = "hidden";
    syncDialogs();
    const options = tabbables(current);
    const requested = current.querySelector<HTMLElement>(
      "[data-initial-focus]",
    );
    const cancel = options.find(
      (el) =>
        el.hasAttribute("data-cancel-focus") ||
        /^(cancel|keep)/i.test(el.textContent?.trim() || ""),
    );
    const field = options.find((el) => el.matches("input,textarea,select"));
    (initial.current.initialFocus === "heading"
      ? heading.current
      : initial.current.initialFocus === "cancel"
        ? cancel || heading.current
        : requested && available(requested)
          ? requested
          : field || options[0] || current
    )?.focus();
    const guard = (e: FocusEvent) => {
      if (
        dialogStack.at(-1) === backdrop &&
        !current.contains(e.target as Node)
      )
        (tabbables(current)[0] || current).focus();
    };
    document.addEventListener("focusin", guard);
    return () => {
      document.removeEventListener("focusin", guard);
      const index = dialogStack.indexOf(backdrop);
      const wasTop = index === dialogStack.length - 1;
      if (index >= 0) dialogStack.splice(index, 1);
      syncDialogs();
      if (wasTop) restoreUsefulFocus(previous);
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (
          !busy &&
          e.target === e.currentTarget &&
          dialogStack.at(-1) === e.currentTarget
        )
          onClose();
      }}
    >
      <div
        className="dialog"
        ref={root}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy || undefined}
        onKeyDown={(e) => {
          if (dialogStack.at(-1) !== root.current?.parentElement) return;
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            if (!busy) onClose();
            return;
          }
          if (e.key === "Tab") {
            e.preventDefault();
            const options = tabbables(root.current!);
            if (!options.length) {
              root.current?.focus();
            } else {
              // Safari's default Tab preference may skip buttons. Advance through
              // every enabled control explicitly so the modal has one predictable cycle.
              const index = options.indexOf(
                document.activeElement as HTMLElement,
              );
              const next =
                index < 0
                  ? e.shiftKey
                    ? options.length - 1
                    : 0
                  : (index + (e.shiftKey ? -1 : 1) + options.length) %
                    options.length;
              options[next].focus();
            }
          }
        }}
      >
        <div className="dialog-heading">
          <h2 id={titleId} tabIndex={-1} ref={heading}>
            {title}
          </h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close dialog"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {busy && <p role="status">{busyLabel} Please wait before closing.</p>}
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
