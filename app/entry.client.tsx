/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser } from "@remix-run/react";
import { startTransition } from "react";
import { hydrateRoot } from "react-dom/client";

// Work around occasional NotFoundError from third‑party scripts (e.g. Google OAuth)
if (typeof window !== "undefined") {
  // Prevent "Failed to fetch" from causing unhandled promise rejection overlays in the app
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason &&
      (event.reason instanceof TypeError || event.reason.name === "AxiosError") &&
      (event.reason.message?.includes("Failed to fetch") || event.reason.message?.includes("Network Error"))
    ) {
      event.preventDefault();
      console.warn("Caught expected network disconnection error silently:", event.reason.message);
    }
  });

  if (!(window as any).__patchedRemoveChild) {
    const originalRemoveChild = Node.prototype.removeChild;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Node.prototype as any).removeChild = function (child: Node) {
      try {
        // Only remove if this node is actually the parent
        if (child && child.parentNode === this) {
          return originalRemoveChild.call(this, child);
        }
        return child;
      } catch (err: any) {
        if (err && err.name === "NotFoundError") {
          // Ignore attempts to remove nodes that are no longer in the DOM
          return child;
        }
        throw err;
      }
    };
    (window as any).__patchedRemoveChild = true;
  }
} // <-- added closing brace for if (typeof window !== "undefined")

startTransition(() => {
  hydrateRoot(document, <RemixBrowser />);
});
