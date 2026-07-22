'use client';

import { useState, useTransition, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { cancelOrder } from '@/lib/payments-actions';

// 목록 페이지에서는 카드 전체가 Link로 감싸여 있어, 이 버튼·모달 클릭이 상세 페이지 이동으로
// 새어나가지 않도록 모든 클릭 핸들러에서 preventDefault+stopPropagation을 명시적으로 호출한다.
export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function doCancel(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setErr(null);
    startTransition(async () => {
      const res = await cancelOrder(orderId);
      if (res.ok) { setConfirming(false); router.refresh(); }
      else { setErr(res.reason); }
    });
  }

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="cancel-pill"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setErr(null); setConfirming(true); }}
      >
        주문취소
      </button>

      {confirming && (
        <div className="modal-ov" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <div className="modal">
            <p className="modal-msg">주문을 취소하고 전액 환불할까요?<br />이 작업은 되돌릴 수 없어요.</p>
            {err && <p className="hint err">{err}</p>}
            <div className="modal-btns">
              <button type="button" className="cta" disabled={busy} onClick={doCancel}>
                {busy ? '처리 중…' : '취소하고 환불받기'}
              </button>
              <button
                type="button"
                className="cta ghost"
                disabled={busy}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
