const STATIC_CACHE = "simple-road-static-v8";
const RUNTIME_CACHE = "simple-road-runtime-v8";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/logo.svg",
  "/placeholder.svg",
  "/robots.txt",
];

// Cache static data files for offline access
const DATA_FILES = [
  // Grade 9 data
  "/src/data/grade9Questions.ts",
  "/src/data/grade9Subjects.ts",
  "/src/data/grade9Gamification.ts",
  // Add more data files as needed
];

const isSameOrigin = (url) => url.origin === self.location.origin;

const isApiRequest = (request) => {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("parse") ||
    request.headers.get("authorization") !== null
  );
};

// Network-first strategy for API requests with cache fallback
const networkFirst = async (request) => {
  // Cache Storage only accepts GET requests. Room creation, joining, answers,
  // and other API writes must pass through unchanged to the network.
  if (request.method !== "GET") {
    return fetch(request);
  }

  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Stale-while-revalidate strategy for static data
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  if (cachedResponse) {
    networkPromise; // Trigger background update
    return cachedResponse;
  }

  return networkPromise;
};

const isStaticAssetRequest = (request) =>
  request.method === "GET" &&
  isSameOrigin(new URL(request.url)) &&
  !isApiRequest(request) &&
  (request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "manifest" ||
    request.destination === "document" ||
    request.url.includes("/assets/") ||
    request.url.includes("/books/"));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const cacheResponse = async (cacheName, request, response) => {
  if (!response || !response.ok) {
    return response;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
};

const getCachedAppShell = async () => {
  const cachedIndex = await caches.match("/index.html");
  return cachedIndex || caches.match("/");
};

const createPartialContentResponse = async (request, cachedResponse) => {
  const rangeHeader = request.headers.get("range");
  if (!rangeHeader || !cachedResponse) {
    return cachedResponse;
  }

  const buffer = await cachedResponse.arrayBuffer();
  const size = buffer.byteLength;
  const matches = /bytes=(\d*)-(\d*)/.exec(rangeHeader);

  if (!matches) {
    return new Response(null, { status: 416 });
  }

  const start = matches[1] ? Number.parseInt(matches[1], 10) : 0;
  const end = matches[2] ? Number.parseInt(matches[2], 10) : size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    return new Response(null, {
      status: 416,
      headers: {
        "Content-Range": `bytes */${size}`,
      },
    });
  }

  const chunk = buffer.slice(start, end + 1);
  const headers = new Headers(cachedResponse.headers);
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(chunk.byteLength));
  headers.set("Accept-Ranges", "bytes");

  return new Response(chunk, {
    status: 206,
    statusText: "Partial Content",
    headers,
  });
};

// Push notification handling
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New notification",
    icon: "/logo.svg",
    badge: "/favicon.ico",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Explore",
        icon: "/logo.svg",
      },
      {
        action: "close",
        title: "Close",
        icon: "/favicon.ico",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("AlexFix", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(
      clients.openWindow("/")
    );
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Use network-first strategy for API requests with cache fallback
  if (isApiRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Don't cache non-GET requests
  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(RUNTIME_CACHE, "/index.html", response))
        .catch(() => getCachedAppShell()),
    );
    return;
  }

  if (request.headers.has("range")) {
    event.respondWith(
      caches.match(request.url).then(async (cachedResponse) => {
        if (cachedResponse) {
          return createPartialContentResponse(request, cachedResponse);
        }

        try {
          const networkResponse = await fetch(request.url);
          await cacheResponse(RUNTIME_CACHE, request.url, networkResponse.clone());
          return createPartialContentResponse(request, networkResponse);
        } catch (error) {
          return new Response(null, { status: 504, statusText: "Offline" });
        }
      }),
    );
    return;
  }

  if (!isStaticAssetRequest(request)) {
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) {
        fetch(request)
          .then((response) => cacheResponse(RUNTIME_CACHE, request, response))
          .catch(() => undefined);
        return cached;
      }

      try {
        const response = await fetch(request);
        return cacheResponse(RUNTIME_CACHE, request, response);
      } catch (error) {
        return caches.match(request);
      }
    }),
  );
});
