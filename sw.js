// Studyio service worker — only caches the app's own shell so it can open
// instantly (and even if you're briefly offline). Every other request
// (Gemini, Firebase, fonts, mammoth.js) always goes straight to the network —
// nothing about your data or API calls is cached here.
var CACHE_NAME = "studyio-shell-v2";
var SHELL_FILES = ["./index.html", "./manifest.json"];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(SHELL_FILES); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  var url = new URL(req.url);
  // Only handle same-origin GET requests for our own shell files. Everything
  // else (Gemini API, Firebase, Google Fonts, mammoth.js CDN) is left alone.
  if(req.method !== "GET" || url.origin !== self.location.origin) return;
  if(url.pathname.endsWith("/index.html") || url.pathname.endsWith("/manifest.json") || url.pathname === "/" || url.pathname.endsWith("/answer-script/")){
    event.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        return res;
      }).catch(function(){ return caches.match(req); })
    );
  }
});
