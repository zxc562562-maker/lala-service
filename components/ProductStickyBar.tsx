import ProductAddToCart from './ProductAddToCart';
import type { SizeOption } from '@/lib/queries';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

export default function ProductStickyBar({
  dailyPrice, deposit, productName, fallbackId, options, inCart,
}: {
  dailyPrice: number;
  deposit: number;
  productName: string;
  fallbackId: string;
  options: SizeOption[];
  inCart: string[];
}) {
  return (
    <div className="product-sticky-bar">
      <div className="product-sticky-bar-inner product-action-row">
        <div className="product-sticky-price">
          <span>렌탈비용 {won(dailyPrice)} /일</span>
          <span>보증금 {won(deposit)}</span>
        </div>
        <ProductAddToCart productName={productName} fallbackId={fallbackId} options={options} inCart={inCart} />
      </div>
    </div>
  );
}
