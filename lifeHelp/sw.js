/* 生活小助手 Service Worker — 本地资源缓存，支持添加到主屏幕后离线使用 */
var CACHE = 'lifehelp-v1';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './assets/css/style.css',
  './assets/js/ui.js',
  './assets/js/store.js',
  './assets/js/tools-calc.js',
  './assets/js/tools-record.js',
  './assets/js/tools-life.js',
  './assets/js/tools-scan.js',
  './assets/js/registry.js',
  './assets/js/app.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // CDN / API 交给网络
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
