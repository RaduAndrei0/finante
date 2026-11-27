/* Finanțe Lunare: aplicația merge și fără net.
   Mereu încearcă întâi varianta nouă de pe site; dacă nu e net, deschide ultima variantă salvată.
   Datele nu trec pe aici: ele merg direct la Firebase (alt domeniu, pe care nu-l atingem). */
var CACHE = "finante-v1";
var SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-180.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  /* doar pagina aplicației se ține ca „index.html”; alte pagini (de ex. termeni.html) se țin sub numele lor */
  var app = r.mode === "navigate" && /\/(index\.html)?$/.test(u.pathname);
  var key = app ? "index.html" : (r.mode === "navigate" ? u.origin + u.pathname : r);
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok && res.type === "basic") {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(key, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(key).then(function (m) { return m || caches.match("index.html") || caches.match("./"); });
  }));
});
