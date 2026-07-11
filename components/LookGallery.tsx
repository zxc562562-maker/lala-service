'use client';

import { useRef, useState } from 'react';
import type { LookImage } from '@/lib/looks';

export default function LookGallery({ images }: { images: LookImage[] }) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive(idx);
  }

  return (
    <div className="look-gallery-wrap">
      <div className="look-gallery" ref={ref} onScroll={onScroll}>
        {images.map((img, i) => (
          <div
            key={i}
            className="look-gallery-item"
            style={{ background: `linear-gradient(160deg, ${img.c2}, ${img.c1})` }}
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="look-gallery-dots">
          {images.map((_, i) => (
            <span key={i} className={`look-gallery-dot ${i === active ? 'on' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}
