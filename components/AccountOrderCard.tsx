'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import CancelOrderButton from './CancelOrderButton';
import ReturnRequestForm, { type ReturnRequestFormInitial } from './ReturnRequestForm';

export interface AccountOrderCardProps {
  orderId: string | null;
  checkoutDate: string;
  returnDate: string;
  label: string;
  isProblem: boolean;
  response?: string;
  isCancellable: boolean;
  canRequestReturn: boolean;
  canManageReturnInfo: boolean;
  returnRequestInitial: ReturnRequestFormInitial;
  swatches: { id: string; color1: string; color2: string }[];
}

export default function AccountOrderCard({
  orderId, checkoutDate, returnDate, label, isProblem, response, isCancellable,
  canRequestReturn, canManageReturnInfo, returnRequestInitial, swatches,
}: AccountOrderCardProps) {
  const [returnPanelOpen, setReturnPanelOpen] = useState(false);
  const [returnEditing, setReturnEditing] = useState(false);

  function toggleReturnPanel(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setReturnPanelOpen((v) => !v);
    setReturnEditing(false);
  }

  const inner = (
    <>
      <div className="resv-group-date">
        <span className="resv-group-date-left">{checkoutDate} – {returnDate}</span>
        <span className="resv-status-group">
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
            {canRequestReturn && orderId && (
              <button type="button" className="request-return-pill" onClick={toggleReturnPanel}>택배 반납 요청</button>
            )}
            {canManageReturnInfo && orderId && (
              <button type="button" className="return-info-pill" onClick={toggleReturnPanel}>반납 정보</button>
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
      {(canRequestReturn || canManageReturnInfo) && orderId && returnPanelOpen && (
        <ReturnRequestForm
          orderId={orderId}
          mode={canRequestReturn ? 'request' : 'manage'}
          initial={returnRequestInitial}
          editing={returnEditing}
          onStartEdit={() => setReturnEditing(true)}
          onCancelEdit={() => setReturnEditing(false)}
          onSaved={() => { setReturnPanelOpen(false); setReturnEditing(false); }}
        />
      )}
    </>
  );
}
