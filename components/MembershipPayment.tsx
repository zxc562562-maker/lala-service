'use client';

import { useEffect, useRef, useState } from 'react';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { createMembershipOrder } from '@/lib/membership-actions';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

export default function MembershipPayment() {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

  const [amount, setAmount] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(clientKey ? null : '결제 설정(NEXT_PUBLIC_TOSS_CLIENT_KEY)이 없습니다.');
  const widgetsRef = useRef<Awaited<ReturnType<Awaited<ReturnType<typeof loadTossPayments>>['widgets']>> | null>(null);
  const orderRef = useRef<{ orderId: string; orderName: string } | null>(null);
  const [customerKey] = useState(() => 'cust_' + Math.random().toString(36).slice(2));
  const ran = useRef(false);

  useEffect(() => {
    if (!clientKey || ran.current) return;
    ran.current = true;

    let alive = true;
    (async () => {
      const order = await createMembershipOrder();
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
  }, [customerKey, clientKey]);

  async function pay() {
    if (!widgetsRef.current || !orderRef.current) return;
    try {
      await widgetsRef.current.requestPayment({
        orderId: orderRef.current.orderId,
        orderName: orderRef.current.orderName,
        successUrl: `${window.location.origin}/membership/success`,
        failUrl: `${window.location.origin}/membership/fail`,
      });
    } catch (e) {
      setErr((e as Error)?.message || '결제 요청에 실패했습니다.');
    }
  }

  if (err) {
    return (
      <section className="cart-page">
        <h1 className="cart-title">멤버십 결제</h1>
        <div className="hint err">{err}</div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <h1 className="cart-title">멤버십 결제</h1>
      <p className="auth-sub" style={{ marginBottom: 16 }}>
        가입을 완료하려면 멤버십 가입비를 결제해주세요. 결제 완료 후 디렉터·슈퍼바이저 승인을 거쳐 이용할 수 있어요.
      </p>
      <div id="payment-method" />
      <div id="agreement" />
      <button className="cta" disabled={!ready} onClick={pay}>
        {amount != null ? `${won(amount)} 결제하기` : '불러오는 중…'}
      </button>
    </section>
  );
}
