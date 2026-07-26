'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCartPageData, removeCartItem, type CartLine } from '@/lib/cart-actions';
import { iso, toDate, addDays, todayISO, billableDays } from '@lala/shared/lib/domain/reservation';
import { FLAT_DEPOSIT, PARCEL_ROUNDTRIP_FEE, QUICK_DELIVERY_FEE } from '@/lib/pricing';
import { DELIVERY_SLOTS, DELIVERY_METHODS } from '@lala/shared/lib/delivery';
import { updateProfile, type Profile } from '@/lib/account-actions';
import { formatPhone } from '@/lib/phone-format';
import { openAddressSearch } from '@/lib/address-search';
import { listAddressBook, type AddressBookEntry } from '@/lib/address-book-actions';
import DeliveryInfoForm, { type DeliveryInfoFormHandle } from '@/components/DeliveryInfoForm';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';
const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;

export default function CartPage() {
  // 매 렌더마다 새로 계산 — 모듈 스코프 상수로 두면 자정을 넘겨 탭을 오래 열어둔 세션에서
  // "오늘"이 어제 날짜로 고정돼 지난 날짜가 예약 가능하게 보이는 버그가 생김.
  const TODAY = toDate(todayISO());
  const router = useRouter();
  const [items, setItems] = useState<CartLine[] | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState(() => new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), 1)));
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [otherCartConflicts, setOtherCartConflicts] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pickupPhone, setPickupPhone] = useState('');
  // 직접 픽업 반납 방식 — 기본은 직접 반납(매장으로 직접 가져다줌), 켜면 반납 수거를 요청해
  // 직배송의 반납 주소 입력과 동일한 방식으로 반납지를 지정할 수 있다.
  const [pickupReturnRequested, setPickupReturnRequested] = useState(false);
  const [pickupReturnAddress, setPickupReturnAddress] = useState('');
  const [pickupReturnJibun, setPickupReturnJibun] = useState('');
  const [pickupReturnDetailAddress, setPickupReturnDetailAddress] = useState('');
  const [pickupReturnEntrancePassword, setPickupReturnEntrancePassword] = useState('');
  const [pickupReturnMessage, setPickupReturnMessage] = useState('');
  // 반납 요청 주소의 "기본 배송지"/"즐겨찾기" 알약 — 내 정보의 자택 주소록과 같은 목록을 공유한다.
  const [pickupAddressBook, setPickupAddressBook] = useState<AddressBookEntry[]>([]);
  const [showPickupBookModal, setShowPickupBookModal] = useState(false);
  const [showPickupNoDefaultModal, setShowPickupNoDefaultModal] = useState(false);
  const deliveryFormRef = useRef<DeliveryInfoFormHandle>(null);

  // 대부분의 결제는 직접 픽업이 아니라서, 픽업을 실제로 골랐을 때만 주소록을 불러온다
  // (매번 카트에 들어올 때마다 안 쓸 수도 있는 데이터를 미리 가져오지 않게 함).
  useEffect(() => {
    if (deliveryMethod === 'PICKUP') listAddressBook().then(setPickupAddressBook);
  }, [deliveryMethod]);

  function fillPickupReturnFromEntry(e: AddressBookEntry) {
    setPickupReturnAddress(e.address ?? '');
    setPickupReturnJibun(e.jibun ?? '');
    setPickupReturnDetailAddress(e.detailAddress ?? '');
    setPickupReturnEntrancePassword(e.entrancePassword ?? '');
    if (e.phone) setPickupPhone(e.phone);
  }

  function clickPickupDefaultPill() {
    const def = pickupAddressBook.find((e) => e.mode === 'home' && e.isDefault);
    if (def) fillPickupReturnFromEntry(def); else setShowPickupNoDefaultModal(true);
  }

  const pickupHomeEntries = pickupAddressBook.filter((e) => e.mode === 'home');

  // 직접 픽업 전화번호 입력란은 회원이 아직 손대지 않았을 때만 프로필 값으로 채워준다
  // (이미 이번 화면에서 직접 고친 값이 있으면 refresh() 이후에도 덮어쓰지 않음).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (profile) setPickupPhone((cur) => cur || profile.deliveryPhone || profile.phone || '');
  }, [profile]);

  async function refresh() {
    const { items: its, busyDates, closedDates, otherConflicts, profile: prof } = await getCartPageData();
    setItems(its);
    setBusy(new Set(busyDates));
    setClosed(new Set(closedDates));
    setOtherCartConflicts(otherConflicts);
    setProfile(prof);
    // 재주문 시 같은 배송 방법을 다시 고를 확률이 높아, 마지막으로 쓴 방법을 기본 선택해준다
    // (이미 이번 세션에서 직접 고른 값이 있으면 덮어쓰지 않음).
    setDeliveryMethod((cur) => cur ?? prof?.preferredDeliveryMethod ?? null);
  }
  useEffect(() => {
    // refresh는 remove()에서도 재사용하는 데이터 새로고침 함수라 인라인 IIFE로 바꾸지 않음
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  function pick(d: Date) {
    setErr(null);
    if (!start || (start && end)) { setStart(d); setEnd(null); }
    else if (d.getTime() <= start.getTime()) { setStart(d); setEnd(null); }
    else setEnd(d);
  }

  function rangeHasBusy(a: Date, b: Date): boolean {
    let cur = new Date(a);
    while (cur.getTime() <= b.getTime()) {
      if (busy.has(iso(cur))) return true;
      cur = addDays(cur, 1);
    }
    return false;
  }

  function remove(id: string) {
    startTransition(async () => {
      await removeCartItem(id);
      setStart(null); setEnd(null); setSlot(null);
      await refresh();
    });
  }

  // 퀵배송·택배는 시간까지 맞춰서 배송해줄 수 없어 시간 알약 자체를 못 고르게 한다.
  // 직접 픽업은 직배송과 동일하게 시간을 맞춰서 온다.
  const timeSlotDisabled = deliveryMethod === 'QUICK' || deliveryMethod === 'PARCEL';

  function pickDeliveryMethod(id: string) {
    setDeliveryMethod(id);
    if (id === 'QUICK' || id === 'PARCEL') setSlot(null);
  }

  function checkout() {
    if (!start || !end || !deliveryMethod) return;
    if (!timeSlotDisabled && !effectiveSlot) return;
    setErr(null);
    startTransition(async () => {
      if (deliveryMethod === 'PICKUP') {
        if (!profile) return;
        const res = await updateProfile({
          name: profile.name,
          phone: profile.phone ?? '',
          marketingLookbook: profile.marketingLookbook,
          marketingPromotion: profile.marketingPromotion,
          marketingDaily: profile.marketingDaily,
          deliveryPhone: pickupPhone,
          deliveryRecipientName: profile.name,
          deliveryInStore: true,
          returnInStore: !pickupReturnRequested,
          returnAddress: pickupReturnRequested ? pickupReturnAddress : undefined,
          returnJibun: pickupReturnRequested ? pickupReturnJibun : undefined,
          returnDetailAddress: pickupReturnRequested ? pickupReturnDetailAddress : undefined,
          returnEntrancePassword: pickupReturnRequested ? pickupReturnEntrancePassword : undefined,
          returnMessage: pickupReturnRequested ? pickupReturnMessage : undefined,
        });
        if (!res.ok) { setErr(res.reason ?? '전화번호를 확인해주세요.'); return; }
      } else {
        const res = await deliveryFormRef.current?.save();
        if (res && !res.ok) { setErr(res.reason ?? '배송 정보를 확인해주세요.'); return; }
      }
      const slotParam = timeSlotDisabled ? '' : effectiveSlot;
      router.push(`/checkout?co=${iso(start)}&ret=${iso(end)}&slot=${slotParam}&method=${deliveryMethod}`);
    });
  }

  if (items === null) {
    return <section className="cart-page cart-wide"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>불러오는 중…</p></section>;
  }

  if (items.length === 0) {
    return (
      <section className="cart-page cart-wide">
        <div className="empty" style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--muted)' }}>카트가 비어 있어요.</p>
          <Link className="cta ghost" href="/looks" style={{ marginTop: 14 }}>룩북 둘러보기</Link>
        </div>
      </section>
    );
  }

  // 달력 셀 (전부 과거인 앞 주 제거)
  const y = month.getUTCFullYear();
  const m = month.getUTCMonth();
  const firstDow = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  type Cell = { blank: true } | { blank: false; d: number; date: Date; k: string; past: boolean; busy: boolean; closed: boolean };
  const raw: Cell[] = [];
  for (let i = 0; i < firstDow; i++) raw.push({ blank: true });
  for (let d = 1; d <= len; d++) {
    const date = new Date(Date.UTC(y, m, d));
    const k = iso(date);
    raw.push({ blank: false, d, date, k, past: date.getTime() < TODAY.getTime(), busy: busy.has(k), closed: closed.has(k) });
  }
  const weeks: Cell[][] = [];
  for (let i = 0; i < raw.length; i += 7) weeks.push(raw.slice(i, i + 7));
  let sw = 0;
  while (sw < weeks.length && weeks[sw].every((c) => c.blank || (!c.blank && c.past))) sw++;
  const cells = weeks.slice(sw).flat();

  const dayEls = cells.map((c, idx) => {
    if (c.blank) return <div key={`b${idx}`} className="day blank" />;
    let cls = 'day';
    let clickable = false;
    let label: string | null = null;
    if (c.past) cls += ' past';
    else if (c.closed) {
      cls += ' holiday';
      if (start && end && c.date > start && c.date < end) cls += ' inrange';
    }
    else if (c.busy) cls += ' busy';
    else {
      cls += ' free'; clickable = true;
      if (start && c.k === iso(start)) { cls += ' sel'; label = '예약'; }
      else if (end && c.k === iso(end)) { cls += ' sel'; label = '반납'; }
      else if (start && end && c.date > start && c.date < end) cls += ' inrange';
    }
    return (
      <button key={c.k} className={cls} disabled={!clickable} onClick={() => clickable && pick(c.date)}>
        <span className={label ? 'num label' : 'num'}>{label ?? c.d}</span>
      </button>
    );
  });

  let rangeLabel = '예약일과 반납일을 선택하세요';
  let daysLabel = '';
  let days = 0;
  let valid = false;
  let hint = '';
  let hintErr = false;
  if (start && !end) { rangeLabel = `${fmt(start)} —`; daysLabel = '반납일 선택'; }
  else if (start && end) {
    rangeLabel = `${fmt(start)} – ${fmt(end)}`;
    if (rangeHasBusy(start, end)) { hint = '선택한 기간에 렌탈 중인 아이템이 있어요. 다른 날짜를 골라주세요.'; hintErr = true; }
    else { days = billableDays(iso(start), iso(end), closed); daysLabel = `${days}일`; valid = true; }
  }

  const sub = valid ? items.reduce((a, c) => a + c.dailyPrice * days, 0) : 0;
  const dep = items.length ? FLAT_DEPOSIT : 0;
  // 택배는 왕복 배송비 정액 부과, 퀵배송은 거리별로 달라 우선 0원(라벨만 미리 노출).
  const deliveryFeeLabel = deliveryMethod === 'PARCEL' ? '왕복 배송비' : deliveryMethod === 'QUICK' ? '배송비' : null;
  const deliveryFee = deliveryMethod === 'PARCEL' ? PARCEL_ROUNDTRIP_FEE : deliveryMethod === 'QUICK' ? QUICK_DELIVERY_FEE : 0;

  // 배송 완료 시각 알약 = 결제(지금) 기준 준비~배송 1시간 + 1분 여유는 있어야 고를 수 있음.
  // 예약일이 오늘이 아니면(미래 날짜면) 이미 충분한 여유가 있으니 필터링하지 않음.
  const nowMinutes = (() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); })();
  const checkoutIsToday = !!start && iso(start) === todayISO();
  const visibleSlots = checkoutIsToday
    ? DELIVERY_SLOTS.filter((s) => Number(s.id) * 60 - nowMinutes >= 61)
    : DELIVERY_SLOTS;
  const effectiveSlot = visibleSlots.some((s) => s.id === slot) ? slot : null;
  const readyForDeliveryModes = valid && !!deliveryMethod && (timeSlotDisabled || !!effectiveSlot);

  return (
    <section className="cart-page cart-wide">
      <div className="cart-list">
        {items.map((c) => (
          <div className="cart-item" key={c.id}>
            <div className="cart-thumb" style={{ background: `linear-gradient(160deg, ${c.c2}, ${c.c1})` }} />
            <div className="cart-info">
              <div className="cart-bottom">
                <span className="cart-name-group">
                  <span className="cart-name">{c.name}</span>
                  <span className="size-chip chosen">{c.size}</span>
                </span>
                <span className="cart-total">{won(c.dailyPrice)}<small> /일</small></span>
              </div>
              {otherCartConflicts.has(c.productId) && (
                <div className="cart-name-row">
                  <span className="cart-conflict">⚡ 다른 회원님의 카트에도 담겨 있어요</span>
                </div>
              )}
            </div>
            <button className="cart-x" onClick={() => remove(c.id)} disabled={pending} aria-label="삭제">×</button>
          </div>
        ))}
      </div>

      <div className="cal" style={{ marginTop: 22 }}>
        <div className="cal-nav">
          <button
            disabled={y === TODAY.getUTCFullYear() && m === TODAY.getUTCMonth()}
            onClick={() => setMonth(new Date(Date.UTC(y, m - 1, 1)))}
            aria-label="이전 달"
          >‹</button>
          <div className="month">{y}년 {m + 1}월</div>
          <button onClick={() => setMonth(new Date(Date.UTC(y, m + 1, 1)))} aria-label="다음 달">›</button>
        </div>
        <div className="dow"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
        <div className="days">{dayEls}</div>
      </div>

      <div className="summary cart-sum">
        <div className="row"><span>{rangeLabel}</span><span>{daysLabel}</span></div>
        {hint && <div className={hintErr ? 'hint err' : 'hint'}>{hint}</div>}
        <div className="delivery-method-row">
          <span>어떻게 갈까요?</span>
          <div className="delivery-method-pills">
            {DELIVERY_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!valid}
                onClick={() => pickDeliveryMethod(m.id)}
                className={`size-chip ${!valid ? 'pending' : deliveryMethod === m.id ? 'chosen' : 'pickable'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="delivery-method-row">
          <span>몇 시까지 갈까요?</span>
          <div className="delivery-method-pills">
            {visibleSlots.length === 0 ? (
              <span className="delivery-slot-empty">오늘은 배송 가능한 시간이 없어요. 다른 날짜를 선택해주세요.</span>
            ) : timeSlotDisabled ? (
              <span className="delivery-slot-empty">퀵배송·택배는 시간을 맞춰 보내드리기 어려워요.</span>
            ) : visibleSlots.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={!valid}
                onClick={() => setSlot(s.id)}
                className={`size-chip ${!valid ? 'pending' : effectiveSlot === s.id ? 'chosen' : 'pickable'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row"><span>렌탈비용</span><span>{valid ? won(sub) : '—'}</span></div>
        {deliveryFeeLabel && (
          <div className="row"><span style={{ letterSpacing: '6px' }}>{deliveryFeeLabel}</span><span>{deliveryMethod === 'QUICK' ? '후불' : won(deliveryFee)}</span></div>
        )}
        <div className="row"><span><span style={{ letterSpacing: '6px' }}>보증금</span> <small className="deposit-note">* 반납검수 후 환불</small></span><span>{won(dep)}</span></div>
        <div className="row total">
          <span>결제금액</span>
          <span className="amt-group">
            <span className="amt">{valid ? won(sub + dep + deliveryFee) : '—'}</span>
            <span className="subscription-note">월 정기구독을 희망하시면 카카오톡 채널로 문의주세요 :)</span>
          </span>
        </div>
        {deliveryMethod === 'PICKUP' && (
          <div className="pickup-summary-block">
            <div className="phone-row" style={{ alignItems: 'center' }}>
              <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>전화번호</span>
              <input
                className="field field-phone-fit"
                style={{ textAlign: 'right', marginLeft: 'auto' }}
                placeholder="010-0000-0000"
                value={formatPhone(pickupPhone)}
                onChange={(e) => setPickupPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              />
            </div>

            <div className="toggle-group-row" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
              <label className="toggle-group-item">
                <span>직접 반납</span>
                <span className="ios-toggle">
                  <input type="checkbox" checked={!pickupReturnRequested} onChange={(e) => setPickupReturnRequested(!e.target.checked)} />
                  <span className="ios-slider" />
                </span>
              </label>
              <label className="toggle-group-item">
                <span>반납 요청</span>
                <span className="ios-toggle">
                  <input type="checkbox" checked={pickupReturnRequested} onChange={(e) => setPickupReturnRequested(e.target.checked)} />
                  <span className="ios-slider" />
                </span>
              </label>
            </div>

            {pickupReturnRequested && (
              <>
                <p className="hint return-addr-hint" style={{ marginTop: 8 }}>
                  반납 장소는 반납일 낮 12:00 전까지 입력하셔야 해요.<br />
                  낮 12:00 이후 반납 장소 입력시 추가금액이 발생될 수 있어요.
                </p>
                <div className="field-section-row" style={{ marginTop: 8 }}>
                  <div className="field-section" style={{ margin: 0 }}>반납 주소</div>
                  <div className="addr-pills">
                    <button type="button" className="size-chip pickable" onClick={clickPickupDefaultPill}>기본 배송지</button>
                    <button type="button" className="size-chip pickable" onClick={() => setShowPickupBookModal(true)}>즐겨찾기</button>
                  </div>
                </div>
                <div className="addr-row">
                  <input className="field" placeholder="반납 주소" value={pickupReturnAddress} onChange={(e) => setPickupReturnAddress(e.target.value)} />
                  <button
                    type="button"
                    className="cta ghost addr-btn"
                    onClick={() => openAddressSearch((r) => { setPickupReturnAddress(r.roadAddress); setPickupReturnJibun(r.jibunAddress); })}
                  >주소 검색</button>
                </div>
                {pickupReturnJibun && <div className="addr-jibun">지번 주소: {pickupReturnJibun}</div>}
                <input
                  className="field"
                  style={{ marginTop: 8 }}
                  placeholder="세부 주소 (건물명, 호수)"
                  value={pickupReturnDetailAddress}
                  onChange={(e) => setPickupReturnDetailAddress(e.target.value)}
                />

                <div className="phone-row" style={{ marginTop: 8, alignItems: 'center' }}>
                  <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>공동현관 비밀번호</span>
                  <input
                    className="field"
                    style={{ textAlign: 'right' }}
                    placeholder="자유 출입시 미기재"
                    value={pickupReturnEntrancePassword}
                    onChange={(e) => setPickupReturnEntrancePassword(e.target.value)}
                  />
                </div>

                <div className="phone-row" style={{ marginTop: 8, alignItems: 'center' }}>
                  <span className="field-section field-section-plain" style={{ margin: 0, flexShrink: 0 }}>반납 메시지</span>
                  <input
                    className="field"
                    style={{ textAlign: 'right' }}
                    value={pickupReturnMessage}
                    onChange={(e) => setPickupReturnMessage(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showPickupBookModal && (
        <div className="wd-ov" onClick={(e) => e.target === e.currentTarget && setShowPickupBookModal(false)}>
          <div className="legal-box">
            <div className="legal-title">즐겨찾기 (자택)</div>
            <div className="legal-body">
              <div className="addr-book-panel">
                {pickupHomeEntries.length === 0 && <p className="hint" style={{ margin: 0 }}>저장된 주소가 아직 없어요.</p>}
                {pickupHomeEntries.map((e) => (
                  <div className="addr-book-item" key={e.id}>
                    <button
                      type="button"
                      className="addr-book-info"
                      onClick={() => { fillPickupReturnFromEntry(e); setShowPickupBookModal(false); }}
                    >
                      <div className="addr-book-label-row">
                        <span className="addr-book-label-text">{e.label}</span>
                        {e.isDefault && <span className="addr-book-default">기본 배송지</span>}
                      </div>
                      <div className="addr-book-summary">{[e.address, e.detailAddress].filter(Boolean).join(' ') || '(주소 없음)'}</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button className="cta" style={{ width: '100%' }} onClick={() => setShowPickupBookModal(false)}>닫기</button>
          </div>
        </div>
      )}

      {showPickupNoDefaultModal && (
        <div className="wd-ov" onClick={(e) => e.target === e.currentTarget && setShowPickupNoDefaultModal(false)}>
          <div className="wd-box">
            <div className="wd-title">기본 배송지가 없어요</div>
            <p className="wd-desc">기본배송지가 등록되어 있지않아요.</p>
            <button className="cta" style={{ width: '100%' }} onClick={() => setShowPickupNoDefaultModal(false)}>확인</button>
          </div>
        </div>
      )}

      {profile && deliveryMethod !== 'PICKUP' && (
        <div style={{ marginTop: 18 }}>
          <DeliveryInfoForm
            ref={deliveryFormRef}
            profile={profile}
            onSaved={refresh}
            showSaveButton={false}
            restrictedToHome={timeSlotDisabled}
            isParcelDelivery={deliveryMethod === 'PARCEL'}
            showModeButtons={readyForDeliveryModes}
          />
        </div>
      )}

      {err && <div className="hint err" style={{ marginTop: 8 }}>{err}</div>}

      <div className="cart-checkout-row">
        <Link className="pf-withdraw cart-look-link" href="/looks">룩북 보기</Link>
        <button
          className="cta look-cart-cta cart-checkout-btn"
          disabled={!valid || !deliveryMethod || (!timeSlotDisabled && !effectiveSlot) || pending}
          onClick={checkout}
        >
          {pending ? '처리 중…'
            : !valid ? '예약일을 선택하세요'
            : !deliveryMethod ? '배송 방법을 선택하세요'
            : (!timeSlotDisabled && !effectiveSlot) ? '배송 시간을 선택하세요'
            : '결제하기'}
        </button>
      </div>
    </section>
  );
}
