'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { createOrder } from '@/lib/payments-actions';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

export default function CheckoutPage() {
  const params = useSearchParams();
  const co = params.get('co');
  const ret = params.get('ret');

  const [amount, setAmount] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const widgetsRef = useRef<Awaited<ReturnType<Awaited<ReturnType<typeof loadTossPayments>>['widgets']>> | null>(null);
  const orderRef = useRef<{ orderId: string; orderName: string } | null>(null);
  const customerKey = useRef('cust_' + Math.random().toString(36).slice(2)).current;

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!co || !ret) { setErr('예약 날짜 정보가 없습니다.'); return; }
    if (!clientKey) { setErr('결제 설정(NEXT_PUBLIC_TOSS_CLIENT_KEY)이 없습니다.'); return; }

    let alive = true;
    (async () => {
      const order = await createOrder(co, ret);
      if (!alive) return;
      if (!order.ok) { setErr(order.reason); return; }
      orderRef.current = { orderId: order.orderId, orderName: order.orderName };
      setAmount(order.amount);

      const toss = await loadTossPayments(clientKey);
      const widgets = toss.widgets({ customerKey });
      await widgets.setAmount({ currency: 'KRW', value: order.amount });
      await Promise.all([
        widgets.renderPaymentMethods({ selector: '#payment-method' }),
        widgets.renderAgreement({ selector: '#agreement' }),
      ]);
      if (!alive) return;
      widgetsRef.current = widgets;
      setReady(true);
    })().catch((e) => alive && setErr(e?.message || '결제창을 불러오지 못했습니다.'));

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [co, ret]);

  async function pay() {
    if (!widgetsRef.current || !orderRef.current) return;
    try {
      await widgetsRef.current.requestPayment({
        orderId: orderRef.current.orderId,
        orderName: orderRef.current.orderName,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch (e) {
      setErr((e as Error)?.message || '결제 요청에 실패했습니다.');
    }
  }

  if (err) {
    return (
      <section className="cart-page">
        <h1 className="cart-title">결제</h1>
        <div className="hint err">{err}</div>
        <a className="cta ghost" href="/cart" style={{ display: 'inline-block', marginTop: 12 }}>카트로 돌아가기</a>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <h1 className="cart-title">결제</h1>
      <div id="payment-method" />
      <div id="agreement" />
      <button className="cta" disabled={!ready} onClick={pay}>
        {amount != null ? `${won(amount)} 결제하기` : '불러오는 중…'}
      </button>
    </section>
  );
}
