const CACHE = "husco-5000-guide-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./figures.js",
  "./figures/fig-layout.jpg",
  "./figures/fig-tools.jpg",
  "./figures/fig-tierods.jpg",
  "./figures/fig-loadcheck.jpg",
  "./figures/fig-outlet.jpg",
  "./figures/fig-torque.jpg",
  "./figures/fig-wrench.jpg",
  "./figures/fig-aux.jpg",
  "./figures/fig-sc-endmech.jpg",
  "./figures/fig-pilot-endmech.jpg",
  "./figures/fig-sealkit.jpg",
  "./figures/fig-tierod-diagram.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        if (res.ok && new URL(req.url).origin === location.origin) {
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
