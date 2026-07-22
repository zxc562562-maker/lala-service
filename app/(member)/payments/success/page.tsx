'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmPayment } from '@/lib/payments-actions';

function PaymentSuccessContent() {
  const p = useSearchParams();
  const paymentKey = p.get('paymentKey');
  const orderId = p.get('orderId');
  const amount = Number(p.get('amount'));
  const paramsValid = !!(paymentKey && orderId && amount);

  const [state, setState] = useState<'loading' | 'ok' | 'fail'>(paramsValid ? 'loading' : 'fail');
  const [msg, setMsg] = useState(paramsValid ? '' : '결제 정보가 올바르지 않습니다.');
  const ran = useRef(false);

  useEffect(() => {
    if (!paramsValid || ran.current) return;
    ran.current = true;
    (async () => {
      const res = await confirmPayment(paymentKey!, orderId!, amount);
      if (res.ok) setState('ok');
      else { setState('fail'); setMsg(res.reason); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="cart-page">
      <h1 className="cart-title">결제</h1>
      {state === 'loading' && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>결제를 확인하는 중…</p>}
      {state === 'ok' && (
        <div className="booked">
          <div className="booked-mark">✓</div>
          <p>결제가 완료됐습니다. 「내 렌탈」에서 확인할 수 있어요.</p>
          <Link href="/account" className="cta ghost" style={{ display: 'inline-block', width: 'auto', padding: '12px 22px' }}>내 렌탈 보기</Link>
        </div>
      )}
      {state === 'fail' && (
        <div className="booked">
          <p style={{ marginBottom: 16 }}>결제를 완료하지 못했습니다.<br />{msg}</p>
          <Link href="/cart" className="cta ghost" style={{ display: 'inline-block', width: 'auto', padding: '12px 22px' }}>카트로 돌아가기</Link>
        </div>
      )}
    </section>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
