'use client';

import { useEffect, useState } from 'react';
import { savePushSubscription } from '@/lib/push-actions';
import { urlBase64ToUint8Array } from '@/lib/push-client';

const DISMISSED_KEY = 'lala_push_prompt_dismissed';

export default function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // navigator/Notification/localStorage는 서버 렌더에 없어 여기(마운트 후)에서만 안전하게 확인 가능
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (Notification.permission !== 'default') return; // 이미 허용/거부한 적 있으면 다시 안 물어봄

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (!existing) setShow(true);
    });
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  async function allow() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) { dismiss(); return; }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
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
      }
    } catch {
      // 실패해도 프롬프트를 계속 다시 띄우면 성가시므로 조용히 닫음 — 필요하면 /profile에서 다시 켤 수 있음
    }
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="wd-ov" onClick={(e) => e.target === e.currentTarget && dismiss()}>
      <div className="wd-box">
        <div className="wd-title">알림을 받아보세요</div>
        <p className="wd-desc push-prompt-desc">가입 승인, 실시간 주문·배송 소식을 바로 받을 수 있어요.</p>
        <div className="wd-btns">
          <button className="cta ghost" onClick={dismiss} disabled={busy}>나중에</button>
          <button className="cta" onClick={allow} disabled={busy}>알림 받기</button>
        </div>
      </div>
    </div>
  );
}
