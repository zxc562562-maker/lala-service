import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@lala/shared/lib/supabase/server';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import { getPackagingPhotoUrl } from '@lala/shared/lib/storage';
import PackagingPhotoLightbox from '@/components/PackagingPhotoLightbox';

export const dynamic = 'force-dynamic';
const won = (n: number) => n.toLocaleString('ko-KR') + '원';

const NORMAL_LABEL: Record<string, string> = {
  ORDERED: '주문결제', PRE_INSPECTING: '상품검수중', READY: '배송대기중', SHIPPED: '배송중',
  DELIVERED: '배송완료', RETURN_REQUESTED: '반납접수 요청됨', RETURN_INSPECTING: '반납검수중', REFUNDED: '반납 완료',
  DEPOSIT_REFUNDED: '보증금 환불 완료', CANCELLED: '취소됨',
};
const PROBLEM_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '상품검수중 오염, 손상 확인', MISDELIVERED: '오배송', RETURN_ISSUE: '반납검수중 오염, 손상 확인',
};
const RESPONSE_LABEL: Record<string, string> = {
  PRE_INSPECT_ISSUE: '깔끔히 수선·세탁 후 보내드릴게요.', MISDELIVERED: '오배송 확인되어 처리중이에요.', RETURN_ISSUE: '불필요한 분쟁이 발생되지 않게 확인·처리 중이에요.',
};

export default async function OrderDetailPage(props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  const user = await getCachedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/account/${params.orderId}`)}`);
  const sb = await supabaseServer();

  // RLS("본인 것 또는 직원") 덕분에 남의 주문이면 그냥 안 돌아옴 → notFound 처리.
  // items 조회는 order의 결과값에 의존하지 않으므로(같은 orderId로만 조회) 병렬로 같이 요청한다.
  const [{ data: order }, { data: items }] = await Promise.all([
    sb
      .from('payment_order')
      .select('id,checkout,return_date,days,amount,status,fulfillment_status,disputed,dispute_reason,created_at,packaging_photo_path')
      .eq('id', params.orderId)
      .maybeSingle(),
    sb
      .from('reservation')
      .select('id,status,has_issue,inventory_item(product(id,name,daily_price,color_1,color_2))')
      .eq('payment_order_id', params.orderId),
  ]);
  if (!order) notFound();
  const packagingPhotoUrl = await getPackagingPhotoUrl(order.packaging_photo_path);

  // 상태+분쟁 통합: 분쟁이면 그 사유(또는 "분쟁중"), 문제 분기 상태면 그 라벨, 그 외엔 정상 진행 단계
  let statusLabel: string;
  let isProblem: boolean;
  if (order.disputed) { statusLabel = order.dispute_reason || '분쟁중'; isProblem = true; }
  else if (PROBLEM_LABEL[order.fulfillment_status]) { statusLabel = PROBLEM_LABEL[order.fulfillment_status]; isProblem = true; }
  else { statusLabel = NORMAL_LABEL[order.fulfillment_status] ?? order.fulfillment_status; isProblem = false; }
  // 주문검수/수거검수 오염·손상은 "어떤 상품"인지가 중요해서 상단 요약이 아니라 포함 상품 목록의
  // 해당 상품 옆에 표시(오배송은 특정 상품 문제가 아니라 배송 전체 문제라 상단에 그대로 둠)
  const isPerItemIssue = order.fulfillment_status === 'PRE_INSPECT_ISSUE' || order.fulfillment_status === 'RETURN_ISSUE';
  const perItemResponse = isPerItemIssue ? RESPONSE_LABEL[order.fulfillment_status] : null;
  const response = isPerItemIssue ? null : RESPONSE_LABEL[order.fulfillment_status];

  type ItemRow = {
    id: string; status: string; has_issue: boolean;
    inventory_item: { product: { id: string; name: string; daily_price: number; color_1: string; color_2: string } };
  };
  const rows = (items ?? []) as unknown as ItemRow[];
  const sub = rows.reduce((a, r) => a + r.inventory_item.product.daily_price * order.days, 0);
  const deposit = order.amount - sub;
  // 관리자가 문제 상품을 특정 지정해뒀으면 그 상품에만, 아직 지정 안 했으면(옛 주문 등) 전체 상품에 표시
  const anyItemFlagged = rows.some((r) => r.has_issue);

  return (
    <section className="detail">
      <div className="order-detail-plain" style={{ marginTop: 16 }}>
        <div className="row"><span>예약일 – 반납일</span><span>{order.checkout} – {order.return_date} ({order.days}일)</span></div>
        <div className="row"><span>결제 상태</span><span>{order.status === 'PAID' ? '결제완료' : order.status === 'CANCELLED' ? '취소·환불완료' : order.status}</span></div>
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
              <Link href={`/products/${p.id}`} className="order-item-thumb-link">
                <div className="order-item-thumb" style={{ background: `linear-gradient(160deg, ${p.color_2}, ${p.color_1})` }} />
              </Link>
              <div className="order-item-info">
                <div className="order-item-name-row">
                  <span className="order-item-name">{p.name}</span>
                </div>
                <div className="order-item-price">{won(p.daily_price)} /일</div>
              </div>
              {perItemResponse && (!anyItemFlagged || r.has_issue) && (
                <div className="order-item-response-row"><span className="resv-response">{perItemResponse}</span></div>
              )}
            </div>
          );
        })}
        {packagingPhotoUrl && <PackagingPhotoLightbox photoUrl={packagingPhotoUrl} />}
      </div>

      <div className="summary" style={{ marginTop: 22 }}>
        <div className="row"><span>렌탈비용</span><span>{won(sub)}</span></div>
        <div className="row"><span>보증금</span><span>{won(deposit)}</span></div>
        <div className="row total"><span>결제금액</span><span className="amt">{won(order.amount)}</span></div>
      </div>
    </section>
  );
}
