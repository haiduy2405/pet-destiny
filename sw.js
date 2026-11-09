'use strict';
/* Pet Destiny service worker. VERSION must equal the vNN label in index.html (a test checks it);
   bumping it makes the browser drop the old cache. Strategy: network first (always fresh when online),
   falling back to the cache so the game still opens offline. */
const VERSION = 'v44';
const CACHE = 'pet-destiny-' + VERSION;
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'mobile.css', 'pets.png', 'garden.jpg', 'Bravura.woff',
  'save-store.js', 'economy-core.js', 'visual-core.js', 'shape-camera-core.js', 'music-core.js', 'income-core.js',
  'atelier-core.js', 'egg-journey-core.js', 'home-core.js', 'adventure-core.js',
  'mobile.js', 'adventure.js', 'arcade.js', 'garden.js', 'shop.js', 'garden-options.js', 'visual-polish.js',
  'pet-loop.js', 'shape-camera.js', 'music.js', 'learning.js', 'homes.js', 'egg-journey.js', 'atelier.js',
  'prosperity.js', 'practice-games.js', 'game-packs-core.js', 'game-packs.js', 'pet-bond.js',
  'english-games.js', 'vietnamese-games.js', 'english-speaking.js', 'dollhouse-core.js', 'dollhouse-photo-core.js', 'home-games-core.js', 'dollhouse.js', 'dollhouse-photo.js', 'home-games.js', 'levels-core.js', 'balance-core.js', 'arcade-levels.js', 'levels.js', 'lucky-core.js', 'sfx-core.js', 'sfx.js', 'app-kit.js', 'farm-core.js', 'farm.js', 'fishing-core.js', 'fishing.js', 'lucky.js',
  'audio/ui/press.mp3', 'audio/ui/snap.mp3', 'audio/ui/forward.mp3', 'audio/ui/check.mp3', 'audio/ui/blocked.mp3', 'audio/ui/level-up.mp3', 'audio/ui/reward.mp3', 'audio/ui/purchase.mp3', 'audio/ui/drop.mp3', 'audio/ui/bonus.mp3', 'audio/ui/reaction.mp3', 'audio/ui/unlock.mp3', 'audio/ui/badge.mp3', 'audio/ui/achievement.mp3', 'audio/ui/receive.mp3', 'audio/piano/C2.mp3', 'audio/piano/Fs2.mp3', 'audio/piano/C3.mp3', 'audio/piano/Fs3.mp3', 'audio/piano/C4.mp3', 'audio/piano/Fs4.mp3', 'audio/piano/C5.mp3', 'audio/piano/Fs5.mp3', 'audio/piano/C6.mp3',
  'rewards.js', 'evolution-fx.js', 'backup.js', 'slots.js', 'pwa.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(ASSETS.map(url => cache.add(new Request(url, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pet-destiny-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response && response.status === 200) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (err) {
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    if (request.mode === 'navigate') {
      const page = (await cache.match('index.html')) || (await cache.match('./'));
      if (page) return page;
    }
    throw err;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.headers.has('range')) return;
  event.respondWith(networkFirst(request));
});
