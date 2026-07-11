'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCartItems, getCartBusyDates, removeCartItem, getOtherCartConflicts, type CartLine } from '@/lib/cart-actions';
import { iso, toDate, addDays, todayISO } from '@/lib/domain/reservation';
import { FLAT_DEPOSIT } from '@/lib/pricing';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';
const TODAY = toDate(todayISO());
const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartLine[] | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState(() => new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth(), 1)));
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [otherCartConflicts, setOtherCartConflicts] = useState<Set<string>>(new Set());

  async function refresh() {
    const its = await getCartItems();
    setItems(its);
    setBusy(new Set(await getCartBusyDates()));
    setOtherCartConflicts(await getOtherCartConflicts(its.map((i) => i.productId)));
  }
  useEffect(() => { refresh(); }, []);

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
      setStart(null); setEnd(null);
      await refresh();
    });
  }

  function checkout() {
    if (!start || !end) return;
    router.push(`/checkout?co=${iso(start)}&ret=${iso(end)}`);
  }

  if (items === null) {
    return <section className="cart-page"><p style={{ textAlign: 'center', color: 'var(--muted)' }}>불러오는 중…</p></section>;
  }

  if (items.length === 0) {
    return (
      <section className="cart-page">
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
  type Cell = { blank: true } | { blank: false; d: number; date: Date; k: string; past: boolean; busy: boolean };
  const raw: Cell[] = [];
  for (let i = 0; i < firstDow; i++) raw.push({ blank: true });
  for (let d = 1; d <= len; d++) {
    const date = new Date(Date.UTC(y, m, d));
    const k = iso(date);
    raw.push({ blank: false, d, date, k, past: date.getTime() < TODAY.getTime(), busy: busy.has(k) });
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
    else { days = Math.round((end.getTime() - start.getTime()) / 86_400_000); daysLabel = `${days}일`; valid = true; }
  }

  const sub = valid ? items.reduce((a, c) => a + c.dailyPrice * days, 0) : 0;
  const dep = items.length ? FLAT_DEPOSIT : 0;

  return (
    <section className="cart-page">
      <div className="cart-list">
        {items.map((c) => (
          <div className="cart-item" key={c.id}>
            <div className="cart-thumb" style={{ background: `linear-gradient(160deg, ${c.c2}, ${c.c1})` }} />
            <div className="cart-info">
              {otherCartConflicts.has(c.productId) && (
                <div className="cart-name-row">
                  <span className="cart-conflict">⚡ 다른 회원님의 카트에도 담겨 있어요</span>
                </div>
              )}
              <div className="cart-bottom">
                <span className="cart-name-group">
                  <span className="cart-name">{c.name}</span>
                  <span className="size-chip chosen">{c.size}</span>
                </span>
                <span className="cart-total">{won(c.dailyPrice)}<small> /일</small>{valid ? ` · ${won(c.dailyPrice * days)}` : ''}</span>
              </div>
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
        <div className="row"><span>렌탈비용</span><span>{valid ? won(sub) : '—'}</span></div>
        <div className="row"><span><span style={{ letterSpacing: '6px' }}>보증금</span> <small className="deposit-note">* 반납검수 후 환불</small></span><span>{won(dep)}</span></div>
        <div className="row total"><span>결제금액</span><span className="amt">{valid ? won(sub + dep) : '—'}</span></div>
      </div>

      {err && <div className="hint err" style={{ marginTop: 8 }}>{err}</div>}

      <button className="cta" disabled={!valid || pending} onClick={checkout}>
        {pending ? '처리 중…' : valid ? '결제하기' : '예약일을 선택하세요'}
      </button>
      <Link className="cta ghost" href="/looks" style={{ display: 'inline-block', marginTop: 10 }}>룩북 둘러보기</Link>
    </section>
  );
}
