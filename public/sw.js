/* Caches immutable static assets only. Pages and their data are user-specific,
 * so they must never be stored here, where they would outlive a logout. */
const CACHE = "expenses-v1";

/* Dev assets keep their URLs when their code changes, so a worker left behind by
 * a local production run would keep serving old code. It removes itself instead. */
const IS_LOCAL = self.location.hostname === "localhost";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => IS_LOCAL || k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() =>
        IS_LOCAL ? self.registration.unregister() : self.clients.claim(),
      ),
  );
});

self.addEventListener("fetch", (event) => {
  if (IS_LOCAL) return;

  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/_next/static/") && !url.pathname.startsWith("/icons/")) {
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
