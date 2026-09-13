import type { ServiceId } from "./lead-options";

/**
 * Cross-section contract: any component can ask the lead form to pre-select a service.
 *
 *   window.dispatchEvent(new CustomEvent("assyl:select-service", { detail: "ai", cancelable: true }))
 *
 * The contact form listens, adds the service, scrolls itself into view and calls
 * `preventDefault()` to signal that the request was handled.
 */
export const SELECT_SERVICE_EVENT = "assyl:select-service";

declare global {
  interface WindowEventMap {
    "assyl:select-service": CustomEvent<ServiceId>;
  }
}

/** Returns `true` when a mounted form handled the request. */
export function requestService(id: ServiceId): boolean {
  if (typeof window === "undefined") return false;
  const event = new CustomEvent<ServiceId>(SELECT_SERVICE_EVENT, { detail: id, cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}
