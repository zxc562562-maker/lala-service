'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toDate, iso, addDays } from '@lala/shared/lib/domain/reservation';

const WHEEL_ITEM_H = 15;

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()));
}
function addYears(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate()));
}
function todayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}
function monthOf(dateStr: string | null): Date {
  const base = dateStr ? toDate(dateStr) : todayUTC();
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
function withDow(dateStr: string): string {
  return `${dateStr} (${DOW[toDate(dateStr).getUTCDay()]})`;
}

// 아이폰 달력 조회 스타일의 스크롤 휠 — 스크롤이 멈추면(설정 시간 동안 추가 스크롤 없으면)
// 가장 가까운 항목으로 스냅하고 그 값을 확정한다.
function WheelColumn({ items, value, suffix, onChange }: {
  items: number[]; value: number; suffix: string; onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const idx = items.indexOf(value);
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * WHEEL_ITEM_H;
    // 마운트 시 1회만 — 이후엔 사용자 스크롤이 값을 결정한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / WHEEL_ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      ref.current.scrollTo({ top: clamped * WHEEL_ITEM_H, behavior: 'smooth' });
      if (items[clamped] !== value) onChange(items[clamped]);
    }, 120);
  }

  return (
    <div className="wheel-col" ref={ref} onScroll={handleScroll}>
      <div className="wheel-pad" />
      {items.map((it) => (
        <div key={it} className={`wheel-item${it === value ? ' active' : ''}`}>{it}{suffix}</div>
      ))}
      <div className="wheel-pad" />
    </div>
  );
}

function YearMonthWheel({ month, onChange }: { month: Date; onChange: (next: Date) => void }) {
  const year = month.getUTCFullYear();
  const mon = month.getUTCMonth() + 1;
  // 2026년 이전은 조회할 일이 없어서 휠 시작점을 2026으로 고정
  const years = Array.from({ length: 8 }, (_, i) => 2026 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="wheel-picker">
      <div className="wheel-highlight" />
      <WheelColumn items={years} value={year} suffix="년" onChange={(y) => onChange(new Date(Date.UTC(y, mon - 1, 1)))} />
      <WheelColumn items={months} value={mon} suffix="월" onChange={(m) => onChange(new Date(Date.UTC(year, m - 1, 1)))} />
    </div>
  );
}

function MiniCalendar({
  month,
  onNavigate,
  selected,
  onPick,
}: {
  month: Date;
  onNavigate: (next: Date) => void;
  selected: string | null;
  onPick: (iso: string) => void;
}) {
  const y = month.getUTCFullYear();
  const m = month.getUTCMonth();
  const firstDow = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  type Cell = { blank: true } | { blank: false; d: number; k: string };
  const cells: Cell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ blank: true });
  for (let d = 1; d <= len; d++) cells.push({ blank: false, d, k: iso(new Date(Date.UTC(y, m, d))) });

  return (
    <div className="account-filter-cal">
      <YearMonthWheel month={month} onChange={onNavigate} />
      <div className="dow"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
      <div className="days">
        {cells.map((c, idx) => {
          if (c.blank) return <div key={`b${idx}`} className="day blank" />;
          const cls = `day free${c.k === selected ? ' sel' : ''}`;
          return (
            <button type="button" key={c.k} className={cls} onClick={() => onPick(c.k)}>
              <span className="num">{c.d}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AccountDateFilter({
  initialFrom,
  initialTo,
}: {
  initialFrom?: string;
  initialTo?: string;
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [openField, setOpenField] = useState<'from' | 'to' | null>(null);
  const [from, setFrom] = useState<string | null>(initialFrom ?? null);
  const [to, setTo] = useState<string | null>(initialTo ?? null);
  const [fromMonth, setFromMonth] = useState(() => monthOf(initialFrom ?? null));
  const [toMonth, setToMonth] = useState(() => monthOf(initialTo ?? null));

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenField(null);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function apply(f: string | null, t: string | null) {
    const params = new URLSearchParams();
    if (f) params.set('from', f);
    if (t) params.set('to', t);
    const qs = params.toString();
    router.push(qs ? `/account?${qs}` : '/account');
  }

  function toggleFrom() {
    if (openField !== 'from') setFromMonth(monthOf(from));
    setOpenField((o) => (o === 'from' ? null : 'from'));
  }
  function toggleTo() {
    if (openField !== 'to') setToMonth(monthOf(to));
    setOpenField((o) => (o === 'to' ? null : 'to'));
  }

  function preset(days?: number, months?: number, years?: number) {
    const today = todayUTC();
    let start = today;
    if (days) start = addDays(today, -days);
    if (months) start = addMonths(today, -months);
    if (years) start = addYears(today, -years);
    const f = iso(start);
    const t = iso(today);
    setFrom(f);
    setTo(t);
    setOpenField(null);
    apply(f, t);
  }

  function resetAll() {
    setFrom(null);
    setTo(null);
    setOpenField(null);
    apply(null, null);
  }

  return (
    <div className="account-filter-wrap" ref={wrapRef}>
      <div className="account-filter">
        <div className="account-filter-box-wrap">
          <button type="button" className="account-filter-box" onClick={toggleFrom}>{from ? withDow(from) : '시작일'}</button>
          {openField === 'from' && (
            <MiniCalendar
              month={fromMonth}
              onNavigate={setFromMonth}
              selected={from}
              onPick={(k) => { setFrom(k); setOpenField(null); }}
            />
          )}
        </div>
        <span className="account-filter-sep">~</span>
        <div className="account-filter-box-wrap">
          <button type="button" className="account-filter-box" onClick={toggleTo}>{to ? withDow(to) : '종료일'}</button>
          {openField === 'to' && (
            <MiniCalendar
              month={toMonth}
              onNavigate={setToMonth}
              selected={to}
              onPick={(k) => { setTo(k); setOpenField(null); }}
            />
          )}
        </div>
        <button type="button" className="cta ghost account-filter-btn" onClick={() => apply(from, to)}>조회</button>
      </div>

      <div className="account-filter-presets">
        <button type="button" onClick={resetAll}>전체보기</button>
        <button type="button" onClick={() => preset(7)}>1주일</button>
        <button type="button" onClick={() => preset(undefined, 1)}>1개월</button>
        <button type="button" onClick={() => preset(undefined, 3)}>3개월</button>
        <button type="button" onClick={() => preset(undefined, 6)}>6개월</button>
        <button type="button" onClick={() => preset(undefined, undefined, 1)}>1년</button>
      </div>
    </div>
  );
}
