'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import CancelOrderButton from './CancelOrderButton';
import RequestReturnButton from './RequestReturnButton';
import ReturnTrackingInfo from './ReturnTrackingInfo';

export interface AccountOrderCardProps {
  orderId: string | null;
  checkoutDate: string;
  returnDate: string;
  label: string;
  isProblem: boolean;
  response?: string;
  isCancellable: boolean;
  deliveryMethodLabel?: string;
  canRequestReturn: boolean;
  canManageReturnInfo: boolean;
  returnCourier: string;
  returnTrackingNumber: string;
  swatches: { id: string; color1: string; color2: string }[];
}

export default function AccountOrderCard({
  orderId, checkoutDate, returnDate, label, isProblem, response, isCancellable,
  deliveryMethodLabel, canRequestReturn, canManageReturnInfo,
  returnCourier, returnTrackingNumber, swatches,
}: AccountOrderCardProps) {
  const [returnInfoOpen, setReturnInfoOpen] = useState(false);

  function toggleReturnInfo(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setReturnInfoOpen((v) => !v);
  }

  const inner = (
    <>
      <div className="resv-group-date">
        <span className="resv-group-date-left">{checkoutDate} – {returnDate}</span>
        <span className="resv-status-group">
          {deliveryMethodLabel && <span className="delivery-method-pill">{deliveryMethodLabel}</span>}
          <span className={`resv-status ${isProblem ? 'resv-problem' : ''}`}>{label}</span>
          {isCancellable && orderId && <CancelOrderButton orderId={orderId} />}
        </span>
      </div>
      <div className="resv-list">
        {swatches.map((s) => (
          <div className="resv-swatch" key={s.id} style={{ background: `linear-gradient(160deg, ${s.color2}, ${s.color1})` }} />
        ))}
        {(response || canRequestReturn || canManageReturnInfo) && (
          <div className="resv-response-row">
            {response && <span className="resv-response">{response}</span>}
            {canRequestReturn && orderId && <RequestReturnButton orderId={orderId} />}
            {canManageReturnInfo && (
              <button type="button" className="return-info-pill" onClick={toggleReturnInfo}>
                반납정보
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {orderId ? (
        <Link href={`/account/${orderId}`} className="resv-group resv-group-link">{inner}</Link>
      ) : (
        <div className="resv-group">{inner}</div>
      )}
      {canManageReturnInfo && returnInfoOpen && (
        <ReturnTrackingInfo
          courier={returnCourier}
          trackingNumber={returnTrackingNumber}
          onClose={() => setReturnInfoOpen(false)}
        />
      )}
    </>
  );
}
