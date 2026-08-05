/**
 * Shared mobile menu behavior for azd-web-core's Header.
 *
 * Extracted from an inline `<script>` so the keyboard behavior is directly
 * testable. Two inline blocks previously competed here: one queried
 * `[data-menu-toggle]`, which the markup never emits, so the Escape handler and
 * focus trap it contained could never bind. Keeping the wiring in a module makes
 * that class of selector drift visible to unit tests.
 *
 * Returns an AbortController so callers can tear down listeners on View
 * Transition navigations (preventing duplicate listener accumulation), matching
 * the convention established by `initClipboardButtons`.
 */

/** Attribute selector for the button that opens and closes the menu. */
export const TOGGLE_SELECTOR = "[data-mobile-toggle]";

/** Attribute selector for the menu container itself. */
export const MENU_SELECTOR = "[data-mobile-menu]";

/** Elements that can receive keyboard focus inside the open menu. */
const FOCUSABLE_SELECTOR = 'a[href], button, [tabindex]:not([tabindex="-1"])';

/**
 * True only when the menu is both toggled open and actually rendered.
 *
 * Reading the `hidden` class alone is not enough. The menu and its toggle both
 * carry `md:hidden`, so widening the viewport past the `md` breakpoint applies
 * `display: none` while the class state still reads "open". Trusting the class
 * there would leave the Tab handler below trapping focus inside a menu nobody
 * can see, and `.focus()` on a `display: none` element is a no-op, so keyboard
 * navigation would die for the entire page until reload (WCAG 2.1.2).
 *
 * Computed style is used rather than a hardcoded `matchMedia("(min-width: 768px)")`
 * so the breakpoint stays defined in exactly one place: the Tailwind config.
 */
function isOpen(menu: HTMLElement): boolean {
  if (menu.classList.contains("hidden")) return false;
  const view = menu.ownerDocument.defaultView;
  return view ? view.getComputedStyle(menu).display !== "none" : true;
}

/**
 * Applies open/closed state, keeping focus somewhere sane in both directions.
 *
 * Focus has to be handled here rather than at each call site because there are
 * three ways to dismiss (Escape, activating a link, clicking outside) and it is
 * easy to add a fourth that forgets. Closing while focus sits inside the menu
 * strands it on a `display: none` element, which browsers resolve by dropping
 * focus to `<body>`, restarting the user's next Tab at the top of the page
 * (WCAG 2.4.3). Opening without focus inside the ring is just as bad: the Tab
 * trap below only engages when `activeElement` is the first or last member, and
 * Safari does not focus a `<button>` on click, so the overlay would be trivially
 * tabbable-behind.
 */
function setOpen(toggle: HTMLElement, menu: HTMLElement, open: boolean): void {
  const active = toggle.ownerDocument.activeElement;

  menu.classList.toggle("hidden", !open);
  menu.classList.toggle("flex", open);
  toggle.setAttribute("aria-expanded", String(open));

  if (open) {
    if (!menu.contains(active) && active !== toggle) toggle.focus();
    return;
  }

  if (menu.contains(active)) toggle.focus();
}

/**
 * Collects the focus ring for the open menu.
 *
 * The toggle is included as the first stop so Shift+Tab from the first menu item
 * lands back on the control that opened it, rather than escaping the overlay.
 * This also guarantees at least one member, so the ring is never empty.
 */
function focusRing(toggle: HTMLElement, menu: HTMLElement): HTMLElement[] {
  return [toggle, ...Array.from(menu.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))];
}

/**
 * Wires click, Escape, and Tab handling for the mobile menu within `root`.
 *
 * Safe to call when the header is absent: if either the toggle or the menu is
 * missing, no listeners are attached and the returned controller is inert.
 *
 * @param root Node to search for the toggle and menu.
 * @returns An AbortController whose `.abort()` removes every listener attached.
 */
export function initMobileMenu(root: ParentNode): AbortController {
  const controller = new AbortController();
  const { signal } = controller;

  const toggle = root.querySelector<HTMLElement>(TOGGLE_SELECTOR);
  const menu = root.querySelector<HTMLElement>(MENU_SELECTOR);
  if (!toggle || !menu) return controller;

  toggle.addEventListener(
    "click",
    () => {
      setOpen(toggle, menu, !isOpen(menu));
    },
    { signal },
  );

  const doc = toggle.ownerDocument;

  // Dismiss on link activation. In-page anchors (`#install`) navigate without a
  // page load, so nothing else re-renders the menu closed and the overlay would
  // sit on top of the section the user just jumped to, with focus still trapped.
  menu.addEventListener(
    "click",
    (event) => {
      if ((event.target as Element | null)?.closest("a[href]")) {
        setOpen(toggle, menu, false);
      }
    },
    { signal },
  );

  doc.addEventListener(
    "click",
    (event) => {
      const target = event.target as Node | null;
      if (!target || !isOpen(menu)) return;
      if (menu.contains(target) || toggle.contains(target)) return;
      setOpen(toggle, menu, false);
    },
    { signal },
  );

  // Crossing the `md` breakpoint hides both controls via `md:hidden` while the
  // open class remains, leaving `aria-expanded="true"` on an invisible button
  // and re-revealing an open menu on the way back down. Detected through the
  // same computed-style check as `isOpen`, so the breakpoint itself stays
  // defined only in the Tailwind config.
  doc.defaultView?.addEventListener(
    "resize",
    () => {
      if (menu.classList.contains("hidden")) return;
      if (isOpen(menu)) return;
      setOpen(toggle, menu, false);
    },
    { signal },
  );

  doc.addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      // Another widget on the consuming page may already have claimed this key.
      if (event.defaultPrevented) return;
      if (!isOpen(menu)) return;

      if (event.key === "Escape") {
        // `setOpen` restores focus only when it was inside the menu; Escape
        // should pull it back regardless of where the user pressed it.
        setOpen(toggle, menu, false);
        toggle.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = focusRing(toggle, menu);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = doc.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    { signal },
  );

  return controller;
}
