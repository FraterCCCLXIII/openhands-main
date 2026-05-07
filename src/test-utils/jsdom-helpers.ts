/**
 * Shared jsdom helpers for component tests.
 *
 * Component test files in this repo use direct `createRoot(...)` rendering
 * plus native DOM events instead of Testing Library. The two helpers below
 * are repeated across many test files; export them once so test
 * infrastructure changes need only happen in one place.
 */

/**
 * Marks the current globalThis as a React act() environment so React 19
 * suppresses the "not wrapped in act(...)" warnings that would otherwise
 * fire during synchronous test renders.
 */
export const enableReactActEnvironment = () => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
};

/**
 * Sets the value of an HTMLInputElement, HTMLTextAreaElement, or
 * HTMLSelectElement and dispatches the appropriate input/change events so
 * React's controlled-component handlers fire.
 *
 * Accepts a permissive `Element | null | undefined` to match the various
 * call-site signatures across component tests (`querySelector` returns
 * `Element | null`, our typed lookups sometimes return `undefined`). When
 * the element is missing or not a supported form element the call throws,
 * matching the previous local helpers.
 */
export const setInputValue = (
  element: Element | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null | undefined,
  value: string,
): void => {
  if (!element) {
    throw new Error("Expected input element");
  }

  if (element instanceof HTMLSelectElement) {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (element instanceof HTMLTextAreaElement) {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (element instanceof HTMLInputElement) {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  throw new Error("Expected input, select, or textarea element");
};
