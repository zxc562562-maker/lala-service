import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const won = (n: number) => n.toLocaleString('ko-KR') + '원';

// 정상 진행 흐름(7단계): 주문결제 → 주문검수중 → 배송대기중 → 배송중 → 배송완료 → 수거검수중 → 완료
const NORMAL_LABEL: Record<string, string> = {
  ORDERED: '주문결제', PRE_INSPECTING: '주문검수중', READY: '배송대기중', SHIPPED: '배송중',
  DELIVERED: '배송완료', RETURN_INSPECTING: '수거검수중', REFUNDED: '완료',
};
// 문제 발생 분기(레드 계열로 구분 표시)
const PROBLEM_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '주문검수중 오염, 손상 확인', MISDELIVERED: '오배송', RETURN_ISSUE: '수거검수중 오염, 손상 확인',
};
// 문제 발생 시 상태 알약 아래에 한 번 더 보여줄 "우리 쪽 대응" 알약(옅은 회색 바탕, 브랜드색 글씨)
const RESPONSE_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '깔끔히 처리 후 보내드릴게요.', MISDELIVERED: '오배송 확인되어 처리중에 있어요.', RETURN_ISSUE: '불필요한 분쟁이 발생되지 않게 확인, 처리 중이에요.',
};

const PLACEHOLDER_STATUS: Record<string, string> = { ACTIVE: '예약됨', COMPLETED: '완료', CANCELLED: '취소됨' };

export default async function AccountPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login?next=/account');

  // RLS 정책 덕분에 "내 예약"만 돌아온다
  const { data } = await sb
    .from('reservation')
    .select('id,checkout,return_date,status,payment_order_id,inventory_item(product(name,brand,daily_price,color_1,color_2))')
    .order('checkout', { ascending: false });

  // 상태·분쟁 정보는 reservation이 아니라 payment_order(주문)에 있음 — 하나로 합쳐서 알약 하나로 보여줌
  const { data: orders } = await sb
    .from('payment_order')
    .select('id,checkout,return_date,fulfillment_status,disputed,dispute_reason');
  type OrderInfo = { fulfillmentStatus: string; disputed: boolean; disputeReason: string | null };
  const orderByOrderId = new Map<string, OrderInfo>();
  const orderByDate = new Map<string, OrderInfo>(); // payment_order_id가 없는 옛 예약용 대체 매칭
  for (const o of orders ?? []) {
    const info: OrderInfo = { fulfillmentStatus: o.fulfillment_status, disputed: o.disputed, disputeReason: o.dispute_reason };
    orderByOrderId.set(o.id, info);
    orderByDate.set(`${o.checkout}_${o.return_date}`, info);
  }

  type Row = {
    id: string; checkout: string; return_date: string; status: string; payment_order_id: string | null;
    inventory_item: { product: { name: string; brand: string; daily_price: number; color_1: string; color_2: string } };
  };
  const rows = (data ?? []) as unknown as Row[];

  // 실제 주문(payment_order_id)이 있으면 그걸로 정확히 묶고, 없는 옛 예약만 날짜로 대체 그룹핑
  // (하루에 같은 기간으로 두 번 결제해도 서로 다른 박스로 정확히 분리됨)
  const groups = new Map<string, Row[]>();
  const order: string[] = [];
  for (const r of rows) {
    const key = r.payment_order_id ?? `date_${r.checkout}_${r.return_date}`;
    if (!groups.has(key)) { groups.set(key, []); order.push(key); }
    groups.get(key)!.push(r);
  }

  return (
    <section className="detail">

      {rows.length === 0 ? (
        <div className="empty">
          <p>아직 대여 내역이 없어요.</p>
          <Link href="/looks" className="cta ghost" style={{ display: 'inline-block', width: 'auto', padding: '12px 22px', marginTop: 8 }}>룩북 둘러보기</Link>
        </div>
      ) : (
        order.map((key) => {
          const items = groups.get(key)!;
          const first = items[0];
          const info = first.payment_order_id
            ? orderByOrderId.get(first.payment_order_id)
            : orderByDate.get(`${first.checkout}_${first.return_date}`);

          // 상태와 분쟁을 하나로 통합: 분쟁이 있으면 그 사유(또는 "분쟁중")를 최우선으로,
          // 그다음 문제 분기 상태, 그 외엔 정상 진행 단계를 알약 하나로 보여준다.
          let label: string;
          let isProblem: boolean;
          if (info?.disputed) { label = info.disputeReason || '분쟁중'; isProblem = true; }
          else if (info && PROBLEM_LABEL[info.fulfillmentStatus]) { label = PROBLEM_LABEL[info.fulfillmentStatus]; isProblem = true; }
          else if (info) { label = NORMAL_LABEL[info.fulfillmentStatus] ?? info.fulfillmentStatus; isProblem = false; }
          else { label = PLACEHOLDER_STATUS[first.status] ?? first.status; isProblem = false; } // 옛 예약(주문 정보 없음) 대체 표시
          // 문제 분기 상태일 때만(분쟁 여부와 무관하게) 우리 쪽 대응 메시지를 한 번 더 보여줌
          const response = info ? RESPONSE_LABEL[info.fulfillmentStatus] : undefined;

          const inner = (
            <>
              <div className="resv-group-date">
                <span className="resv-group-date-left">
                  {first.checkout} – {first.return_date}
                </span>
                <span className={`resv-status ${isProblem ? 'resv-problem' : ''}`}>{label}</span>
              </div>
              {response && <div className="resv-response-row"><span className="resv-response">{response}</span></div>}
              <div className="resv-list">
                {items.map((r) => {
                  const p = r.inventory_item.product;
                  return (
                    <div className="resv-swatch" key={r.id} style={{ background: `linear-gradient(160deg, ${p.color_2}, ${p.color_1})` }} />
                  );
                })}
              </div>
            </>
          );
          // 실제 주문(payment_order_id)이 있는 것만 상세 페이지로 연결(옛 예약은 상세가 없어 링크 없음)
          return first.payment_order_id ? (
            <Link href={`/account/${first.payment_order_id}`} className="resv-group resv-group-link" key={key}>
              {inner}
            </Link>
          ) : (
            <div className="resv-group" key={key}>{inner}</div>
          );
        })
      )}
    </section>
  );
}
