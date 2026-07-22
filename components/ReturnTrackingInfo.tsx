'use client';

import type { MouseEvent } from 'react';

export default function ReturnTrackingInfo({
  courier, trackingNumber, onClose,
}: {
  courier: string;
  trackingNumber: string;
  onClose: () => void;
}) {
  function stop(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div className="resv-group return-tracking-card" onClick={stop}>
      <div className="field-section" style={{ margin: 0 }}>반납 택배 정보</div>
      {courier && trackingNumber ? (
        <p style={{ fontSize: 13, color: 'var(--espresso)', marginTop: 10 }}>{courier} · {trackingNumber}</p>
      ) : (
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 10 }}>
          반납 택배 픽업을 준비 중이에요. 택배사·송장번호가 정해지면 여기에서 확인하실 수 있어요.
        </p>
      )}
      <button type="button" className="cta ghost" style={{ marginTop: 12 }} onClick={(e) => { stop(e); onClose(); }}>
        닫기
      </button>
    </div>
  );
}
