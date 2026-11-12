"use client";
import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Makes an element behave as a modal dialog for the keyboard, which `aria-modal="true"` only promises:
 * Tab and Shift+Tab stay inside it, and when it closes, focus goes back to whatever opened it.
 * `lockScroll` also stops the page behind from scrolling; leave it off for a dialog that scrolls the page itself.
 */
export function useModalFocus(ref: RefObject<HTMLElement>, active: boolean, { lockScroll = true }: { lockScroll?: boolean } = {}) {
  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const root = ref.current;
      if (!root) return;
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!root.contains(current)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      if (lockScroll) document.body.style.overflow = overflow;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [ref, active, lockScroll]);
}
