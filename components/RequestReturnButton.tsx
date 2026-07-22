'use client';

import { useState, useTransition, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { requestReturn } from '@/lib/payments-actions';

// 목록 페이지에서는 카드 전체가 Link로 감싸여 있어, 이 버튼·모달 클릭이 상세 페이지 이동으로
// 새어나가지 않도록 모든 클릭 핸들러에서 preventDefault+stopPropagation을 명시적으로 호출한다.
export default function RequestReturnButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function doRequest(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setErr(null);
    startTransition(async () => {
      const res = await requestReturn(orderId);
      // router.refresh()는 성공 안내를 닫을 때까지 미룬다 — 바로 새로고침하면 canRequestReturn이
      // false가 되면서 이 컴포넌트 자체가 언마운트돼 성공 메시지가 뜨자마자 사라져버림.
      if (res.ok) setDone(true);
      else setErr(res.reason);
    });
  }

  function close(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
    if (done) { setDone(false); router.refresh(); }
  }

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="request-return-pill"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setErr(null); setConfirming(true); }}
      >
        반납접수요청
      </button>

      {confirming && createPortal(
        // 목록 카드에서 이 버튼이 놓이는 .resv-response-row가 transform을 쓰고 있어(가운데 정렬용),
        // 그 안에서 그냥 렌더링하면 position:fixed의 기준이 뷰포트가 아니라 그 좁은 조상으로
        // 바뀌어버려 모달이 아주 좁은 세로 줄로 찌그러진다 — document.body로 포털을 띄워 우회한다.
        <div className="modal-ov" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <div className="modal">
            {done ? (
              <>
                <p className="modal-msg">반납접수가 완료되었어요.<br />누락된 상품이 없는지 다시 확인해 주세요.</p>
                <div className="modal-btns">
                  <button type="button" className="cta" onClick={close}>확인</button>
                </div>
              </>
            ) : (
              <>
                <p className="modal-msg">반납 접수를 요청할까요?<br />택배로 보내주신 상품을 확인 후 안내드릴게요.</p>
                {err && <p className="hint err">{err}</p>}
                <div className="modal-btns">
                  <button type="button" className="cta" disabled={busy} onClick={doRequest}>
                    {busy ? '처리 중…' : '반납접수요청'}
                  </button>
                  <button type="button" className="cta ghost" disabled={busy} onClick={close}>
                    돌아가기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
