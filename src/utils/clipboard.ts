/**
 * Shared clipboard copy utility for azd-web-core components.
 *
 * Attaches click-to-copy behavior to buttons matching a selector within a
 * given root. Returns an AbortController so callers can tear down listeners
 * on View Transition navigations (preventing duplicate listener accumulation).
 */

export interface ClipboardButtonOptions {
  /** CSS selector for copy buttons within the root. */
  selector: string;
  /** Resolves the text to copy from a matched button element. */
  getText: (btn: Element) => string;
  /**
   * Feedback shown on the button after a successful copy.
   * Can be a string (applied to textContent) or a function for custom behavior.
   * @default "Copied!"
   */
  onSuccess?: string | ((btn: Element) => void);
  /**
   * Feedback shown on the button after a failed copy.
   * @default "Error"
   */
  onError?: string | ((btn: Element) => void);
  /**
   * Restores the button to its original state after feedback.
   * Called after resetDelay ms. If omitted, textContent is restored automatically.
   */
  onReset?: (btn: Element) => void;
  /**
   * Time in ms before resetting the button state.
   * @default 1500
   */
  resetDelay?: number;
}

/**
 * Initializes clipboard copy behavior on all buttons matching options.selector
 * within root. Returns an AbortController whose .abort() removes all
 * listeners (e.g., on astro:before-swap).
 */
export function initClipboardButtons(
  root: ParentNode,
  options: ClipboardButtonOptions,
): AbortController {
  const {
    selector,
    getText,
    onSuccess = "Copied!",
    onError = "Error",
    onReset,
    resetDelay = 1500,
  } = options;

  const controller = new AbortController();
  const { signal } = controller;

  root.querySelectorAll(selector).forEach((btn) => {
    let copying = false;
    const originalText = btn.textContent;
    const originalLabel = btn.getAttribute("aria-label");

    btn.addEventListener(
      "click",
      async () => {
        if (copying || !navigator.clipboard?.writeText) return;
        copying = true;

        const text = getText(btn);
        try {
          await navigator.clipboard.writeText(text);
          if (typeof onSuccess === "function") {
            onSuccess(btn);
          } else {
            btn.textContent = onSuccess;
          }
        } catch {
          if (typeof onError === "function") {
            onError(btn);
          } else {
            btn.textContent = onError;
          }
        }

        setTimeout(() => {
          if (onReset) {
            onReset(btn);
          } else if (originalLabel) {
            btn.setAttribute("aria-label", originalLabel);
          } else {
            btn.textContent = originalText;
          }
          copying = false;
        }, resetDelay);
      },
      { signal },
    );
  });

  return controller;
}
