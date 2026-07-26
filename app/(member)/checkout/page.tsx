'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { createOrder } from '@/lib/payments-actions';
import { isValidDeliverySlot, isValidDeliveryMethod } from '@lala/shared/lib/delivery';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

function CheckoutForm() {
  const params = useSearchParams();
  const co = params.get('co');
  const ret = params.get('ret');
  const slot = params.get('slot');
  const method = params.get('method');
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  // 직배송·직접 픽업은 시간을 맞춰야 해서 시간 정보가 필요하고, 퀵배송·택배는 시간 없이 진행한다.
  const needsSlot = method === 'DIRECT' || method === 'PICKUP';
  const initErr = !co || !ret ? '예약 날짜 정보가 없습니다.'
    : !method || !isValidDeliveryMethod(method) ? '배송 방법 정보가 없습니다. 카트에서 다시 시도해주세요.'
    : needsSlot && (!slot || !isValidDeliverySlot(slot)) ? '배송 시간 정보가 없습니다. 카트에서 다시 시도해주세요.'
    : !clientKey ? '결제 설정(NEXT_PUBLIC_TOSS_CLIENT_KEY)이 없습니다.' : null;

  const [amount, setAmount] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(initErr);
  const widgetsRef = useRef<Awaited<ReturnType<Awaited<ReturnType<typeof loadTossPayments>>['widgets']>> | null>(null);
  const orderRef = useRef<{ orderId: string; orderName: string } | null>(null);
  const [customerKey] = useState(() => 'cust_' + Math.random().toString(36).slice(2));
  const ran = useRef(false);

  useEffect(() => {
    if (initErr || !co || !ret || !method || (needsSlot && !slot) || !clientKey || ran.current) return;
    ran.current = true;

    let alive = true;
    (async () => {
      const order = await createOrder(co, ret, needsSlot ? slot : null, method);
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
  }, [co, ret, slot, method]);

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

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutForm />
    </Suspense>
  );
}
