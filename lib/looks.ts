export interface LookImage { c1: string; c2: string }

export interface Look {
  id: string;
  title: string;
  cat: string;   // 성격(occasion)
  desc: string;
  c1: string;    // 커버 그라데이션 (실제 룩 사진으로 교체 예정) — 목록 카드용
  c2: string;
  images?: LookImage[]; // 상세 페이지용 갤러리, 최대 6장(실제 사진으로 교체 예정)
  items: string[]; // 구성 상품명 (product.name)
}

export const MAX_LOOK_IMAGES = 6;

export const LOOKS: Look[] = [
  {
    id: 'noir-soiree', title: 'Noir Soirée', cat: '이브닝',
    desc: '블랙 새틴 드레스에 에나멜 힐과 레더백을 더한 이브닝 룩.',
    c1: '#241820', c2: '#4A2A33',
    images: [
      { c1: '#241820', c2: '#4A2A33' },
      { c1: '#2B1D24', c2: '#5A3240' },
      { c1: '#1E1519', c2: '#402630' },
    ],
    items: ['블랙 드레이프 원피스', '에나멜 하이힐', '레더 핸드백'],
  },
  {
    id: 'tailored-day', title: 'Tailored Day', cat: '데일리',
    desc: '벨벳 블레이저와 실크 블라우스, 플리츠 스커트로 완성한 단정한 데이 룩.',
    c1: '#26303F', c2: '#5A5478',
    images: [
      { c1: '#26303F', c2: '#5A5478' },
      { c1: '#2C3648', c2: '#666088' },
      { c1: '#20293A', c2: '#4E4A70' },
    ],
    items: ['벨벳 블레이저', '실크 블라우스', '플리츠 미디 스커트'],
  },
  {
    id: 'soft-romance', title: 'Soft Romance', cat: '로맨틱',
    desc: '실크 블라우스와 미디 스커트, 레더백이 어우러진 로맨틱 무드.',
    c1: '#6B4A52', c2: '#C98D95',
    images: [
      { c1: '#6B4A52', c2: '#C98D95' },
      { c1: '#78525C', c2: '#D89BA3' },
      { c1: '#5E4048', c2: '#BC7F87' },
    ],
    items: ['실크 블라우스', '플리츠 미디 스커트', '레더 핸드백'],
  },
  {
    id: 'evening-grace', title: 'Evening Grace', cat: '이브닝',
    desc: '드레이프 원피스에 핸드백을 매치한 우아한 이브닝 룩.',
    c1: '#1C1611', c2: '#3B2230',
    images: [
      { c1: '#1C1611', c2: '#3B2230' },
      { c1: '#221A14', c2: '#452838' },
    ],
    items: ['블랙 드레이프 원피스', '레더 핸드백'],
  },
];

export function getLook(id: string): Look | null {
  return LOOKS.find((l) => l.id === id) ?? null;
}

/** 상세 페이지 갤러리용 이미지 목록(최대 6장). images가 없으면 커버 1장으로 대체. */
export function getLookImages(look: Look): LookImage[] {
  const list = look.images && look.images.length > 0 ? look.images : [{ c1: look.c1, c2: look.c2 }];
  return list.slice(0, MAX_LOOK_IMAGES);
}
