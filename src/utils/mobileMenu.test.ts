// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initMobileMenu, TOGGLE_SELECTOR, MENU_SELECTOR } from "./mobileMenu";

let controller: AbortController | null = null;
let foreignListeners: AbortController | null = null;

function mount(menuInner = '<a href="#a">A</a><a href="#b">B</a>'): void {
  document.body.innerHTML = `
    <button data-mobile-toggle aria-expanded="false">Menu</button>
    <nav class="hidden" data-mobile-menu>${menuInner}</nav>
  `;
}

const toggle = (): HTMLButtonElement =>
  document.querySelector<HTMLButtonElement>(TOGGLE_SELECTOR)!;
const menu = (): HTMLElement => document.querySelector<HTMLElement>(MENU_SELECTOR)!;

/**
 * Class-only on purpose. The util additionally consults computed style, and T24
 * depends on the two disagreeing.
 */
const hasOpenClass = (): boolean => !menu().classList.contains("hidden");

function press(key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  mount();
  controller = initMobileMenu(document);
});

afterEach(() => {
  controller?.abort();
  controller = null;
  // Any listener a test attaches to `document` outlives `body.innerHTML = ""`,
  // so it must be owned and aborted or it silently suppresses later tests.
  foreignListeners?.abort();
  foreignListeners = null;
  document.body.innerHTML = "";
});

describe("toggle behavior", () => {
  it("T17: click flips aria-expanded and the hidden/flex classes", () => {
    expect(hasOpenClass()).toBe(false);

    toggle().click();
    expect(hasOpenClass()).toBe(true);
    expect(menu().classList.contains("flex")).toBe(true);
    expect(toggle().getAttribute("aria-expanded")).toBe("true");

    toggle().click();
    expect(hasOpenClass()).toBe(false);
    expect(menu().classList.contains("flex")).toBe(false);
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });
});

describe("dismissal", () => {
  it("T29: closes when a menu link is activated", () => {
    toggle().click();
    expect(hasOpenClass()).toBe(true);

    menu().querySelector("a")!.click();

    expect(hasOpenClass()).toBe(false);
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("T30: closes on a click outside the menu and toggle", () => {
    toggle().click();

    document.body.click();

    expect(hasOpenClass()).toBe(false);
  });

  it("T31: stays open when the click lands inside the menu but not on a link", () => {
    toggle().click();

    menu().click();

    expect(hasOpenClass()).toBe(true);
  });

  it("T32: closes when the viewport crosses the md breakpoint", () => {
    toggle().click();
    expect(hasOpenClass()).toBe(true);

    // `md:hidden` applies `display: none` past the breakpoint while the open
    // class survives.
    menu().style.display = "none";
    window.dispatchEvent(new Event("resize"));

    expect(hasOpenClass()).toBe(false);
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("T33: a resize below the breakpoint leaves an open menu alone", () => {
    toggle().click();

    window.dispatchEvent(new Event("resize"));

    expect(hasOpenClass()).toBe(true);
  });

  it("T34: a resize while the menu is closed does not re-announce closed state", () => {
    // The early return matters because `setOpen` also moves focus. Running it
    // on every resize would steal focus from whatever the user is typing in.
    const other = document.createElement("input");
    document.body.append(other);
    other.focus();

    window.dispatchEvent(new Event("resize"));

    expect(hasOpenClass()).toBe(false);
    expect(document.activeElement).toBe(other);
  });
});

describe("Escape handling", () => {
  it("T8: Escape closes an open menu", () => {
    toggle().click();
    press("Escape");
    expect(hasOpenClass()).toBe(false);
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
  });

  it("T9: Escape restores focus to the toggle", () => {
    toggle().click();
    menu().querySelector<HTMLElement>('a[href="#b"]')!.focus();
    press("Escape");
    expect(document.activeElement).toBe(toggle());
  });

  it("T10: Escape is a no-op when the menu is already closed", () => {
    const before = toggle().getAttribute("aria-expanded");
    press("Escape");
    expect(hasOpenClass()).toBe(false);
    expect(toggle().getAttribute("aria-expanded")).toBe(before);
  });
});

describe("focus management", () => {
  it("T44: opening moves focus into the ring when the toggle was not focused", () => {
    // Safari and iOS do not focus a <button> on click, so activeElement can
    // still be <body> here. The Tab trap only engages from the ends of the
    // ring, so an unfocused open would leave the overlay tabbable-behind.
    expect(document.activeElement).toBe(document.body);

    toggle().click();

    expect(document.activeElement).toBe(toggle());
  });

  it("T45: activating a menu link returns focus to the toggle", () => {
    toggle().click();
    const link = menu().querySelector<HTMLElement>('a[href="#a"]')!;
    link.focus();
    expect(document.activeElement).toBe(link);

    link.click();

    // Without this, focus is stranded on a display:none element and the browser
    // drops it to <body>, restarting the next Tab at the top of the page.
    expect(hasOpenClass()).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it("T46: an outside click returns focus to the toggle when it was inside the menu", () => {
    toggle().click();
    menu().querySelector<HTMLElement>('a[href="#b"]')!.focus();

    document.body.click();

    expect(hasOpenClass()).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it("T47: dismissing does not steal focus that was already outside the menu", () => {
    document.body.insertAdjacentHTML("beforeend", '<input id="elsewhere" />');
    const elsewhere = document.querySelector<HTMLElement>("#elsewhere")!;
    toggle().click();
    elsewhere.focus();

    // Clicking a third element dismisses the menu, but the user's focus was
    // never inside it, so yanking it to the toggle would be a surprise.
    document.body.click();

    expect(hasOpenClass()).toBe(false);
    expect(document.activeElement).toBe(elsewhere);
  });
});

describe("focus trap", () => {
  it("T11: Tab from the last focusable wraps to the first", () => {
    toggle().click();
    menu().querySelector<HTMLElement>('a[href="#b"]')!.focus();
    const event = press("Tab");
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(toggle());
  });

  it("T12: Shift+Tab from the first focusable wraps to the last", () => {
    toggle().click();
    toggle().focus();
    const event = press("Tab", true);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(menu().querySelector('a[href="#b"]'));
  });

  it("T13: the trap is inactive while the menu is closed", () => {
    toggle().focus();
    const event = press("Tab");
    expect(event.defaultPrevented).toBe(false);
  });

  it("T35: keys other than Tab and Escape pass through untouched", () => {
    toggle().click();
    toggle().focus();

    const event = press("ArrowDown");

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(toggle());
    expect(hasOpenClass()).toBe(true);
  });

  it("T36: Tab from the middle of the ring is left to the browser", () => {
    // Only the two edges wrap. Intercepting interior Tabs would break the
    // browser's own DOM-order traversal.
    toggle().click();
    menu().querySelector<HTMLElement>('a[href="#a"]')!.focus();

    const event = press("Tab");

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(menu().querySelector('a[href="#a"]'));
  });

  it("T24: the trap is inactive when the menu is open but not rendered", () => {
    // Widening past the `md` breakpoint applies `display: none` via `md:hidden`
    // while the class state still says open. Trapping Tab here would kill
    // keyboard navigation for the whole page.
    toggle().click();
    menu().style.display = "none";

    const event = press("Tab");
    expect(event.defaultPrevented).toBe(false);
  });

  it("T25: yields to another widget that already handled the key", () => {
    toggle().click();
    foreignListeners = new AbortController();
    document.addEventListener("keydown", (e) => e.preventDefault(), {
      capture: true,
      signal: foreignListeners.signal,
    });

    press("Escape");

    expect(hasOpenClass()).toBe(true);
  });

  it("T14: tolerates a menu with no focusable children", () => {
    controller?.abort();
    mount("<span>nothing focusable</span>");
    controller = initMobileMenu(document);

    toggle().click();
    toggle().focus();
    expect(() => press("Tab")).not.toThrow();
    expect(document.activeElement).toBe(toggle());
  });
});

describe("lifecycle", () => {
  it("T15: aborting removes listeners so re-initialising does not double-fire", () => {
    controller?.abort();
    controller = initMobileMenu(document);

    toggle().click();

    expect(hasOpenClass()).toBe(true);
  });

  it("T16: initialising is a no-op when the toggle and menu are absent", () => {
    controller?.abort();
    document.body.innerHTML = "<p>no header here</p>";

    expect(() => {
      controller = initMobileMenu(document);
    }).not.toThrow();
    expect(controller).toBeInstanceOf(AbortController);
  });
});
