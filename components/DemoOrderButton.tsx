'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createDemoOrders } from '@/lib/demo-actions';

/** 개발/테스트 전용 버튼 — 실제 결제 없이 모든 주문 상태(+배송방법별 문구)를 한 번에 확인해볼 수 있게 함. */
export default function DemoOrderButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [isErr, setIsErr] = useState(false);

  function click() {
    setMsg(null);
    startTransition(async () => {
      const res = await createDemoOrders();
      if (!res.ok) { setIsErr(true); setMsg(res.reason); return; }
      setIsErr(false);
      setMsg(res.skipped.length > 0
        ? `${res.created}개 생성, ${res.skipped.length}개 건너뜀: ${res.skipped.join(', ')}`
        : `${res.created}개 상태를 전부 생성했어요.`);
      router.refresh();
    });
  }

  return (
    <div style={{ marginBottom: 14, textAlign: 'right' }}>
      <button
        type="button"
        onClick={click}
        disabled={pending}
        style={{
          background: 'none', border: '1px dashed var(--muted)', borderRadius: 4, padding: '6px 10px',
          fontSize: 11, color: 'var(--muted)', cursor: 'pointer',
        }}
      >
        {pending ? '생성 중…' : '[테스트] 모든 상태 데모 주문 만들기'}
      </button>
      {msg && <p className={isErr ? 'hint err' : 'hint'} style={{ marginTop: 4 }}>{msg}</p>}
    </div>
  );
}
