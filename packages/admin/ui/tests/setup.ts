import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

export const feedbackStateFixtures = Object.freeze({
  loading: "Loading categories...",
  empty: "No categories yet",
  noMatch: "No matching categories",
  error: "Categories unavailable",
  unauthorized: "Session expired",
  notFound: "Category not found",
  unavailable: "Categories are temporarily unavailable",
  conflict: "The category changed before it could be saved",
  mixedRelatedFailure: "Related data could not be loaded",
});

afterEach(() => cleanup());

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: { configurable: true, value: () => false },
  setPointerCapture: { configurable: true, value: () => undefined },
  releasePointerCapture: { configurable: true, value: () => undefined },
  scrollIntoView: { configurable: true, value: () => undefined },
});

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: { writeText: async () => undefined },
});
