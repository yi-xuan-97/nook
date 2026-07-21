/* Luba的窝 — service worker
   目的:离线也能打开。只缓存这个 app 自己的文件,不碰别的页面。
   策略:stale-while-revalidate —— 先给缓存(秒开/离线可用),后台悄悄更新。 */

const CACHE = "luba-nook-v1";
const ASSETS = [
  "index.html",
  "./",
  "manifest.webmanifest",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 只接管本 app 的文件,其它页面(IFS课程等)一律放行走网络
  const file = url.pathname.split("/").pop() || "";
  if (!ASSETS.includes(file)) return;

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
