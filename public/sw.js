// Lala 웹 푸시 서비스워커
self.addEventListener('push', (event) => {
  let data = { title: 'Lala', body: '' };
  try { data = event.data.json(); } catch { /* 텍스트만 온 경우 무시 */ }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Lala', {
      body: data.body || '',
      icon: '/icon.png',
      badge: '/icon.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    }),
  );
});
