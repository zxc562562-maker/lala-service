'use client';

import { useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

export default function PackagingPhotoLightbox({ photoUrl }: { photoUrl: string }) {
  const [open, setOpen] = useState(false);

  function close(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  }

  return (
    <>
      <div className="order-item-row">
        <button type="button" className="order-item-thumb-link" onClick={() => setOpen(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="패키징 완료 사진" className="order-item-thumb" />
        </button>
        <div className="order-item-info">
          <div className="order-item-name-row"><span className="order-item-name">패키징 완료 사진</span></div>
          <div className="order-item-price" style={{ color: 'var(--muted)' }}>담긴 상품을 모두 확인하고 포장했어요.</div>
        </div>
      </div>
      {open && createPortal(
        <div className="modal-ov" onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="패키징 완료 사진 크게보기" className="packaging-photo-lightbox-img" />
        </div>,
        document.body,
      )}
    </>
  );
}
