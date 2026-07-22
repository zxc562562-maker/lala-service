import type { LookImage } from '@/lib/looks';

export default function LookGallery({ images }: { images: LookImage[] }) {
  return (
    <div className="look-gallery-wrap">
      <div className="look-gallery-list">
        {images.map((img, i) => (
          <div
            key={i}
            className="look-gallery-item"
            style={{ background: `linear-gradient(160deg, ${img.c2}, ${img.c1})` }}
          />
        ))}
      </div>
    </div>
  );
}
