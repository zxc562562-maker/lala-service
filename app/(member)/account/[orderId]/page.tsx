import { notFound, redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const won = (n: number) => n.toLocaleString('ko-KR') + '원';

const NORMAL_LABEL: Record<string, string> = {
  ORDERED: '주문결제', PRE_INSPECTING: '주문검수중', READY: '배송대기중', SHIPPED: '배송중',
  DELIVERED: '배송완료', RETURN_INSPECTING: '수거검수중', REFUNDED: '완료',
};
const PROBLEM_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '주문검수중 오염, 손상 확인', MISDELIVERED: '오배송', RETURN_ISSUE: '수거검수중 오염, 손상 확인',
};
const RESPONSE_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '깔끔히 처리 후 보내드릴게요.', MISDELIVERED: '오배송 확인되어 처리중에 있어요.', RETURN_ISSUE: '불필요한 분쟁이 발생되지 않게 확인, 처리 중이에요.',
};

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/account/${params.orderId}`)}`);

  // RLS("본인 것 또는 직원") 덕분에 남의 주문이면 그냥 안 돌아옴 → notFound 처리
  const { data: order } = await sb
    .from('payment_order')
    .select('id,checkout,return_date,days,amount,status,fulfillment_status,disputed,dispute_reason,created_at')
    .eq('id', params.orderId)
    .maybeSingle();
  if (!order) notFound();

  // 상태+분쟁 통합: 분쟁이면 그 사유(또는 "분쟁중"), 문제 분기 상태면 그 라벨, 그 외엔 정상 진행 단계
  let statusLabel: string;
  let isProblem: boolean;
  if (order.disputed) { statusLabel = order.dispute_reason || '분쟁중'; isProblem = true; }
  else if (PROBLEM_LABEL[order.fulfillment_status]) { statusLabel = PROBLEM_LABEL[order.fulfillment_status]; isProblem = true; }
  else { statusLabel = NORMAL_LABEL[order.fulfillment_status] ?? order.fulfillment_status; isProblem = false; }
  const response = RESPONSE_LABEL[order.fulfillment_status];

  const { data: items } = await sb
    .from('reservation')
    .select('id,status,inventory_item(product(name,daily_price,color_1,color_2))')
    .eq('payment_order_id', params.orderId);

  type ItemRow = {
    id: string; status: string;
    inventory_item: { product: { name: string; daily_price: number; color_1: string; color_2: string } };
  };
  const rows = (items ?? []) as unknown as ItemRow[];
  const sub = rows.reduce((a, r) => a + r.inventory_item.product.daily_price * order.days, 0);
  const deposit = order.amount - sub;

  return (
    <section className="detail">
      <div className="order-detail-plain" style={{ marginTop: 16 }}>
        <div className="row"><span>예약일 – 반납일</span><span>{order.checkout} – {order.return_date} ({order.days}일)</span></div>
        <div className="row"><span>결제 상태</span><span>{order.status === 'PAID' ? '결제완료' : order.status}</span></div>
        <div className="row"><span className={`resv-status ${isProblem ? 'resv-problem' : ''}`} style={{ marginLeft: 'auto' }}>{statusLabel}</span></div>
        {response && <div className="row"><span className="resv-response" style={{ marginLeft: 'auto' }}>{response}</span></div>}
        <div className="row"><span>주문일시</span><span>{new Date(order.created_at).toLocaleString('ko-KR')}</span></div>
      </div>

      <div className="field-section" style={{ marginTop: 22 }}>포함 상품 ({rows.length}개)</div>
      <div className="order-item-list" style={{ marginTop: 10 }}>
        {rows.map((r) => {
          const p = r.inventory_item.product;
          return (
            <div className="order-item-row" key={r.id}>
              <div className="order-item-thumb" style={{ background: `linear-gradient(160deg, ${p.color_2}, ${p.color_1})` }} />
              <div className="order-item-info">
                <div className="order-item-name">{p.name}</div>
                <div className="order-item-price">{won(p.daily_price)} /일</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="summary" style={{ marginTop: 22 }}>
        <div className="row"><span>렌탈비용</span><span>{won(sub)}</span></div>
        <div className="row"><span>보증금</span><span>{won(deposit)}</span></div>
        <div className="row total"><span>결제금액</span><span className="amt">{won(order.amount)}</span></div>
      </div>
    </section>
  );
}
