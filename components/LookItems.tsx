import Link from 'next/link';
import ProductAddToCart from './ProductAddToCart';
import type { SizeOption } from '@/lib/queries';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

interface Item {
  id: string;
  name: string;
  size: string;
  dailyPrice: number;
  c1: string;
  c2: string;
}

export default function LookItems({
  items, inCart, sizeMap,
}: {
  items: Item[];
  inCart: string[];
  sizeMap: Record<string, SizeOption[]>;
}) {
  return (
    <>
      <div className="look-items">
        {items.map((item) => {
          const options = sizeMap[item.name]?.length ? sizeMap[item.name] : [{ size: item.size, available: true, productId: item.id }];
          return (
            <div className="look-item" key={item.id}>
              <Link href={`/products/${item.id}`} className="li-thumb-link">
                <div className="li-thumb" style={{ background: `linear-gradient(160deg, ${item.c2}, ${item.c1})` }} />
              </Link>
              <div className="li-info">
                <div className="li-name">{item.name}</div>
                <span className="li-price">{won(item.dailyPrice)} /일</span>
              </div>
              <ProductAddToCart productName={item.name} fallbackId={item.id} options={options} inCart={inCart} />
            </div>
          );
        })}
      </div>

      <a className="cta look-cart-cta" href="/cart">
        CHECK THE CART
      </a>
    </>
  );
}
