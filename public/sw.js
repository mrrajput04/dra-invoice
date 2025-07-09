// public/sw.js
const CACHE_NAME = 'invoice-app-v1';

// Only cache resources that actually exist
const urlsToCache = [
	'/',
	'/manifest.json' // only if you have this file
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => {
				// Only cache the root path for now
				return cache.addAll(['/']);
			})
			.catch(error => {
				console.log('Cache addAll failed:', error);
				// Continue without caching if it fails
			})
	);
});

self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request)
			.then((response) => {
				// Return cached version or fetch from network
				return response || fetch(event.request);
			})
			.catch(error => {
				console.log('Fetch failed:', error);
				return fetch(event.request);
			})
	);
});