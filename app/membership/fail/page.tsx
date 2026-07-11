'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function MembershipFailContent() {
  const p = useSearchParams();
  const message = p.get('message') || '결제가 취소되었거나 실패했습니다.';
  return (
    <section className="cart-page">
      <h1 className="cart-title">멤버십 결제</h1>
      <div className="booked">
        <p style={{ marginBottom: 16 }}>{message}</p>
        <Link href="/membership" className="cta ghost" style={{ display: 'inline-block', width: 'auto', padding: '12px 22px' }}>다시 시도하기</Link>
      </div>
    </section>
  );
}

export default function MembershipFailPage() {
  return (
    <Suspense fallback={null}>
      <MembershipFailContent />
    </Suspense>
  );
}
