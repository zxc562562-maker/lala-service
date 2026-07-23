import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@lala/shared/lib/supabase/server';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import AccountDateFilter from '@/components/AccountDateFilter';
import AccountOrderCard from '@/components/AccountOrderCard';
import { DELIVERY_METHODS } from '@lala/shared/lib/delivery';

export const dynamic = 'force-dynamic';
const won = (n: number) => n.toLocaleString('ko-KR') + '원';

// 배송(SHIPPED) 시작 전까지만 취소 가능 — lib/payments-actions.ts의 cancelOrder 판단 기준과 동일하게 유지할 것.
const CANCELLABLE_FULFILLMENT_STATUSES = ['ORDERED', 'PRE_INSPECTING', 'READY'];

// 정상 진행 흐름(8단계): 주문결제 → 상품검수중 → 배송대기중 → 배송중 → 배송완료 → 반납접수 요청됨 → 반납검수중 → 완료
const NORMAL_LABEL: Record<string, string> = {
  ORDERED: '주문결제', PRE_INSPECTING: '상품검수중', READY: '배송대기중', SHIPPED: '배송중',
  DELIVERED: '배송완료', RETURN_REQUESTED: '반납접수 요청됨', RETURN_INSPECTING: '반납검수중', REFUNDED: '반납 완료',
  DEPOSIT_REFUNDED: '보증금 환불 완료', CANCELLED: '취소됨',
};
// 문제 발생 분기(레드 계열로 구분 표시)
const PROBLEM_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '상품검수중 오염, 손상 확인', MISDELIVERED: '오배송', RETURN_ISSUE: '반납검수중 오염, 손상 확인',
};
// 문제 발생 시 상태 알약 아래에 한 번 더 보여줄 "우리 쪽 대응" 알약(옅은 회색 바탕, 브랜드색 글씨)
const RESPONSE_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '깔끔히 수선·세탁 후 보내드릴게요.', MISDELIVERED: '오배송 확인되어 처리중이에요.', RETURN_ISSUE: '불필요한 분쟁이 발생되지 않게 확인·처리 중이에요.',
};

const PLACEHOLDER_STATUS: Record<string, string> = { ACTIVE: '예약됨', COMPLETED: '완료', CANCELLED: '취소됨' };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await getCachedUser();
  if (!user) redirect('/login?next=/account');
  const { from, to } = await searchParams;
  const sb = await supabaseServer();

  // RLS 정책 덕분에 "내 예약"만 돌아온다. 조회기간 필터(from/to)는 checkout(예약일) 기준.
  let resvQuery = sb
    .from('reservation')
    .select('id,checkout,return_date,status,payment_order_id,inventory_item(product(name,brand,daily_price,color_1,color_2))')
    .order('checkout', { ascending: false });
  if (from) resvQuery = resvQuery.gte('checkout', from);
  if (to) resvQuery = resvQuery.lte('checkout', to);

  // 상태·분쟁 정보는 reservation이 아니라 payment_order(주문)에 있음 — 하나로 합쳐서 알약 하나로 보여줌
  let orderQuery = sb
    .from('payment_order')
    .select('id,checkout,return_date,status,fulfillment_status,disputed,dispute_reason,delivery_method,return_courier,return_tracking_number');
  if (from) orderQuery = orderQuery.gte('checkout', from);
  if (to) orderQuery = orderQuery.lte('checkout', to);

  // 서로 의존하지 않는 두 조회라 병렬로 요청한다.
  const [{ data }, { data: orders }] = await Promise.all([resvQuery, orderQuery]);
  type OrderInfo = {
    status: string; fulfillmentStatus: string; disputed: boolean; disputeReason: string | null; deliveryMethod: string | null;
    returnCourier: string | null; returnTrackingNumber: string | null;
  };
  const orderByOrderId = new Map<string, OrderInfo>();
  const orderByDate = new Map<string, OrderInfo>(); // payment_order_id가 없는 옛 예약용 대체 매칭
  for (const o of orders ?? []) {
    const info: OrderInfo = {
      status: o.status, fulfillmentStatus: o.fulfillment_status, disputed: o.disputed, disputeReason: o.dispute_reason,
      deliveryMethod: o.delivery_method, returnCourier: o.return_courier, returnTrackingNumber: o.return_tracking_number,
    };
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

  // 목록을 월별로 구분해서 보여주기 위해, checkout(예약일)의 "YYYY-MM"이 바뀔 때마다 월 구분 헤더를 끼워넣는다.
  let lastMonth = '';
  const elements: ReactNode[] = [];
  for (const key of order) {
    const items = groups.get(key)!;
    const first = items[0];
    const month = first.checkout.slice(0, 7); // 'YYYY-MM'
    if (month !== lastMonth) {
      lastMonth = month;
      const [y, m] = month.split('-');
      elements.push(<div className="resv-month-header" key={`m-${month}`}>{y}년 {Number(m)}월</div>);
    }

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
    const isCancellable = !!info && info.status === 'PAID' && !info.disputed
      && CANCELLABLE_FULFILLMENT_STATUSES.includes(info.fulfillmentStatus);
    const deliveryMethodLabel = info?.deliveryMethod
      ? DELIVERY_METHODS.find((m) => m.id === info.deliveryMethod)?.label
      : undefined;
    // 택배는 기사가 수거하지 않아 고객이 직접 반납 발송을 알려야 함 — 배송완료 상태에서만 노출.
    const canRequestReturn = !!info && info.deliveryMethod === 'PARCEL' && info.status === 'PAID' && !info.disputed
      && info.fulfillmentStatus === 'DELIVERED';
    // 반납접수요청 후에만 반납 택배 송장정보를 입력·확인할 수 있음.
    const canManageReturnInfo = !!info && info.deliveryMethod === 'PARCEL' && info.status === 'PAID' && !info.disputed
      && info.fulfillmentStatus === 'RETURN_REQUESTED';

    elements.push(
      <AccountOrderCard
        key={key}
        orderId={first.payment_order_id}
        checkoutDate={first.checkout}
        returnDate={first.return_date}
        label={label}
        isProblem={isProblem}
        response={response}
        isCancellable={isCancellable}
        deliveryMethodLabel={deliveryMethodLabel}
        canRequestReturn={canRequestReturn}
        canManageReturnInfo={canManageReturnInfo}
        returnCourier={info?.returnCourier ?? ''}
        returnTrackingNumber={info?.returnTrackingNumber ?? ''}
        swatches={items.map((r) => ({ id: r.id, color1: r.inventory_item.product.color_1, color2: r.inventory_item.product.color_2 }))}
      />,
    );
  }

  return (
    <section className="detail">
      <AccountDateFilter initialFrom={from} initialTo={to} />

      {rows.length === 0 ? (
        <div className="empty">
          <p>{from || to ? '해당 기간에 대여 내역이 없어요.' : '아직 대여 내역이 없어요.'}</p>
          <Link href="/looks" className="cta ghost" style={{ display: 'inline-block', width: 'auto', padding: '12px 22px', marginTop: 8 }}>룩북 둘러보기</Link>
        </div>
      ) : (
        elements
      )}
    </section>
  );
}
