// PWA 설치용 최소 서비스워커. 캐시 없음, 페이지 이동 요청만 네트워크로 그대로 통과
// ponytail: 오프라인 지원 필요해지면 vite-plugin-pwa(Workbox precache)로 교체
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// 빈 핸들러는 Chrome 이 no-op 으로 취급해서 navigate 만 처리. API, 정적파일, MinIO 요청은 건드리지 않음
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
  }
});