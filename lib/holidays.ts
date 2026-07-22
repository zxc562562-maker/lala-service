/**
 * 한국 공휴일(빨간날) — 대체공휴일 포함. 예약 캘린더에서 이 날짜들은 휴무일로 표시되고
 * 예약일/반납일로 선택할 수 없다(단, 예약 기간이 이 날짜를 "거쳐가는" 것은 허용 — 배송/반납만
 * 안 되는 날일 뿐, 고객이 상품을 보유하고 있는 것 자체는 문제 없음).
 *
 * ⚠️ 매년 갱신 필요 — 설날/추석/부처님오신날은 음력 기준이라 해마다 날짜가 바뀌고,
 * 대체공휴일 여부도 그 해 요일 배치에 따라 달라진다. 아래 목록에 없는 해는 자동으로
 * "공휴일 없음"으로 처리되니(에러 아님), 새해가 되면 인사혁신처 발표(관공서의 공휴일에 관한 규정)를
 * 확인해서 이 배열에 새로 추가할 것.
 */
export const KOREAN_HOLIDAYS: { date: string; name: string }[] = [
  // 2026년
  { date: '2026-01-01', name: '신정' },
  { date: '2026-02-16', name: '설날 연휴' },
  { date: '2026-02-17', name: '설날' },
  { date: '2026-02-18', name: '설날 연휴' },
  { date: '2026-03-01', name: '삼일절' },
  { date: '2026-03-02', name: '대체공휴일(삼일절)' },
  { date: '2026-05-05', name: '어린이날' },
  { date: '2026-05-24', name: '부처님오신날' },
  { date: '2026-05-25', name: '대체공휴일(부처님오신날)' },
  { date: '2026-06-03', name: '전국동시지방선거일' },
  { date: '2026-06-06', name: '현충일' },
  { date: '2026-07-17', name: '제헌절' },
  { date: '2026-08-15', name: '광복절' },
  { date: '2026-08-17', name: '대체공휴일(광복절)' },
  { date: '2026-09-24', name: '추석 연휴' },
  { date: '2026-09-25', name: '추석' },
  { date: '2026-09-26', name: '추석 연휴' },
  { date: '2026-10-03', name: '개천절' },
  { date: '2026-10-05', name: '대체공휴일(개천절)' },
  { date: '2026-10-09', name: '한글날' },
  { date: '2026-12-25', name: '성탄절' },
];

export function getKoreanHolidays(): Set<string> {
  return new Set(KOREAN_HOLIDAYS.map((h) => h.date));
}

export function getKoreanHolidayName(date: string): string | null {
  return KOREAN_HOLIDAYS.find((h) => h.date === date)?.name ?? null;
}
