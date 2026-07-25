import type { LookImage } from '@/lib/looks';

export default function LookGallery({ images }: { images: LookImage[] }) {
  return (
    <div className="look-gallery-wrap">
      <div className="look-gallery-list">
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={img.url} alt="" className="look-gallery-item" />
        ))}
      </div>
    </div>
  );
}
