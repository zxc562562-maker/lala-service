'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmMembershipPayment } from '@/lib/membership-actions';

function MembershipSuccessContent() {
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
      const res = await confirmMembershipPayment(paymentKey!, orderId!, amount);
      if (res.ok) setState('ok');
      else { setState('fail'); setMsg(res.reason); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="cart-page">
      <h1 className="cart-title">멤버십 결제</h1>
      {state === 'loading' && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>결제를 확인하는 중…</p>}
      {state === 'ok' && (
        <div className="booked">
          <div className="booked-mark">✓</div>
          <p>가입비 결제가 완료됐어요. 디렉터·슈퍼바이저 승인을 거치면 이용할 수 있습니다.</p>
          <Link href="/pending" className="cta ghost" style={{ display: 'inline-block', width: 'auto', padding: '12px 22px' }}>승인 대기 화면으로</Link>
        </div>
      )}
      {state === 'fail' && (
        <div className="booked">
          <p style={{ marginBottom: 16 }}>결제를 완료하지 못했습니다.<br />{msg}</p>
          <Link href="/membership" className="cta ghost" style={{ display: 'inline-block', width: 'auto', padding: '12px 22px' }}>다시 시도하기</Link>
        </div>
      )}
    </section>
  );
}

export default function MembershipSuccessPage() {
  return (
    <Suspense fallback={null}>
      <MembershipSuccessContent />
    </Suspense>
  );
}
