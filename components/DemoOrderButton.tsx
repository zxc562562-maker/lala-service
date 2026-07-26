'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createDemoParcelOrder } from '@/lib/demo-actions';

/** 개발/테스트 전용 버튼 — 택배 반납접수요청 UI를 실제 결제 없이 바로 확인해볼 수 있게 함. */
export default function DemoOrderButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function click() {
    setErr(null);
    startTransition(async () => {
      const res = await createDemoParcelOrder();
      if (!res.ok) { setErr(res.reason); return; }
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
        {pending ? '생성 중…' : '[테스트] 택배 반납접수요청 데모 주문 만들기'}
      </button>
      {err && <p className="hint err" style={{ marginTop: 4 }}>{err}</p>}
    </div>
  );
}
