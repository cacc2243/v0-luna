/* Service Worker da Luna Privé — PWA + Web Push.
 * Responsavel por receber notificacoes push (vendas aprovadas) e abrir o
 * painel ao tocar na notificacao. Mantido simples de proposito. */

// Ativa o SW imediatamente, sem esperar recarregar todas as abas.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Recebe o push do servidor (Web Push / VAPID).
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (_e) {
    payload = { title: 'Luna Privé', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Luna Privé'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag || undefined,
    // Renotifica mesmo quando ha uma notificacao com a mesma tag.
    renotify: Boolean(payload.tag),
    data: {
      url: payload.url || '/painel',
    },
    vibrate: [80, 40, 80],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Ao tocar na notificacao, foca uma aba existente do painel ou abre uma nova.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/painel'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl).catch(() => {})
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    }),
  )
})
