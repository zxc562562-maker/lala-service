import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@lala/shared/lib/supabase/server';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import AccountDateFilter from '@/components/AccountDateFilter';
import AccountOrderCard from '@/components/AccountOrderCard';
import { DELIVERY_METHODS } from '@lala/shared/lib/delivery';
import { getOrderStatusLabel, PROBLEM_LABEL, RESPONSE_LABEL } from '@/lib/order-status-labels';

export const dynamic = 'force-dynamic';
const won = (n: number) => n.toLocaleString('ko-KR') + '원';

// 배송(SHIPPED) 시작 전까지만 취소 가능 — lib/payments-actions.ts의 cancelOrder 판단 기준과 동일하게 유지할 것.
const CANCELLABLE_FULFILLMENT_STATUSES = ['ORDERED', 'PRE_INSPECTING', 'READY'];

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
    .select(`
      id,checkout,return_date,status,fulfillment_status,disputed,dispute_reason,delivery_method,
      return_request_address,return_request_jibun_address,return_request_detail_address,
      return_request_message,return_request_recipient_name,return_request_phone
    `);
  if (from) orderQuery = orderQuery.gte('checkout', from);
  if (to) orderQuery = orderQuery.lte('checkout', to);

  // 서로 의존하지 않는 두 조회라 병렬로 요청한다.
  const [{ data }, { data: orders }] = await Promise.all([resvQuery, orderQuery]);
  type OrderInfo = {
    status: string; fulfillmentStatus: string; disputed: boolean; disputeReason: string | null; deliveryMethod: string | null;
    returnRequestAddress: string | null; returnRequestJibun: string | null; returnRequestDetailAddress: string | null;
    returnRequestMessage: string | null; returnRequestRecipientName: string | null; returnRequestPhone: string | null;
  };
  const orderByOrderId = new Map<string, OrderInfo>();
  const orderByDate = new Map<string, OrderInfo>(); // payment_order_id가 없는 옛 예약용 대체 매칭
  for (const o of orders ?? []) {
    const info: OrderInfo = {
      status: o.status, fulfillmentStatus: o.fulfillment_status, disputed: o.disputed, disputeReason: o.dispute_reason,
      deliveryMethod: o.delivery_method,
      returnRequestAddress: o.return_request_address, returnRequestJibun: o.return_request_jibun_address,
      returnRequestDetailAddress: o.return_request_detail_address, returnRequestMessage: o.return_request_message,
      returnRequestRecipientName: o.return_request_recipient_name, returnRequestPhone: o.return_request_phone,
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
    else if (info) { label = getOrderStatusLabel(info.fulfillmentStatus, info.deliveryMethod); isProblem = false; }
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
        returnRequestInitial={{
          address: info?.returnRequestAddress ?? '',
          jibun: info?.returnRequestJibun ?? '',
          detailAddress: info?.returnRequestDetailAddress ?? '',
          message: info?.returnRequestMessage ?? '',
          recipientName: info?.returnRequestRecipientName ?? '',
          phone: info?.returnRequestPhone ?? '',
        }}
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
