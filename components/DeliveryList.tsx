'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { updateFulfillment, type OrderRow, type Fulfillment } from '@/lib/staff-actions';

const LABEL: Record<Fulfillment, string> = {
  ORDERED: '주문결제', PRE_INSPECTING: '주문검수중', READY: '배송대기중', SHIPPED: '배송중',
  DELIVERED: '배송완료', RETURN_INSPECTING: '수거검수중', REFUNDED: '완료',
  PRE_INSPECT_ISSUE: '검수 보류', MISDELIVERED: '오배송', RETURN_ISSUE: '반납 이슈 확인중',
};

// 배송기사가 진행시킬 다음 단계 (정상 흐름만 — 문제 발생 시엔 관리자 화면에서 처리)
const NEXT: Partial<Record<Fulfillment, { to: Fulfillment; label: string }>> = {
  ORDERED: { to: 'PRE_INSPECTING', label: '주문검수 시작' },
  PRE_INSPECTING: { to: 'READY', label: '검수 완료(배송대기)' },
  READY: { to: 'SHIPPED', label: '배송 시작' },
  SHIPPED: { to: 'DELIVERED', label: '배송 완료' },
  DELIVERED: { to: 'RETURN_INSPECTING', label: '수거검수 시작' },
  RETURN_INSPECTING: { to: 'REFUNDED', label: '검수 완료(보증금 환불)' },
};

export default function DeliveryList({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const sb = supabaseBrowser();
    const ch = sb
      .channel('delivery-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_order' }, () => router.refresh())
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [router]);

  function advance(id: string, to: Fulfillment) {
    startTransition(async () => { await updateFulfillment(id, to); router.refresh(); });
  }

  return (
    <section>
      <h1 className="staff-title">배송 <span className="rt-dot" title="실시간 연결됨">●</span></h1>
      {orders.length === 0 && <p className="staff-empty">배정된 배송 건이 없습니다.</p>}
      <div className="order-list">
        {orders.map((o) => {
          const next = NEXT[o.fulfillment];
          return (
            <div className="order-card" key={o.id}>
              <div className="order-head">
                <span className="order-cust">{o.customerName}</span>
                <span className="order-status">{LABEL[o.fulfillment]}</span>
              </div>
              <div className="order-sub">{o.checkout} → {o.return}</div>
              {next && (
                <button className="cta" disabled={pending} onClick={() => advance(o.id, next.to)} style={{ marginTop: 10 }}>
                  {next.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
