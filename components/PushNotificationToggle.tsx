'use client';

import { useEffect, useState } from 'react';
import { savePushSubscription, removePushSubscription } from '@/lib/push-actions';
import { urlBase64ToUint8Array } from '@/lib/push-client';

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // navigator/window는 서버 렌더에 없어 여기(마운트 후)에서만 안전하게 감지 가능
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setSupported(false); return; }
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      setSubscribed(!!existing);
    });
  }, []);

  async function subscribe() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) { setMsg('알림 설정(NEXT_PUBLIC_VAPID_PUBLIC_KEY)이 아직 없습니다.'); return; }
    setBusy(true); setMsg(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setMsg('알림 권한이 허용되지 않았습니다.'); setBusy(false); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });
      setSubscribed(true);
    } catch {
      setMsg('알림 구독에 실패했습니다.');
    }
    setBusy(false);
  }

  async function unsubscribe() {
    setBusy(true); setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setMsg('알림 해제에 실패했습니다.');
    }
    setBusy(false);
  }

  if (!supported) return null;

  return (
    <div className="pf-row">
      <label>알림</label>
      <button
        type="button"
        className="cta ghost addr-btn push-toggle-btn"
        style={{ marginLeft: 'auto' }}
        disabled={busy}
        onClick={subscribed ? unsubscribe : subscribe}
      >
        {subscribed ? '푸시 알림 끄기' : '푸시 알림 받기'}
      </button>
      {msg && <div className="hint">{msg}</div>}
    </div>
  );
}
